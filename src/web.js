'use strict'

import 'babel-polyfill';
import 'source-map-support/register';
import events from 'events';
import http from 'http';
import https from 'https';
import url from 'url';
import validation from './validation.js';

const
	DEFAULT_MAX_REDIRECT_COUNT = 5,
	DEFAULT_RETRY_COUNT = 3,
	DEFAULT_TIMEOUT = 30000,
	EVENT_REDIRECT = 'redirect',
	EVENT_REQUEST = 'request',
	EVENT_RESPONSE = 'response',
	FIRST_TRY = 1,
	HTTP_ERROR_CODE_THRESHHOLD = 400,
	HTTP_ERROR_CODE_RETRY_THRESHHOLD = 500,
	// reference: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#3xx_Redirection
	HTTP_PROXY_REQUIRED = 305,
	HTTP_REDIRECT_CODE_PERM = 301,
	HTTP_REDIRECT_CODE_TEMP = 302,
	HTTP_REDIRECT_NEW_CODE_PERM = 308,
	HTTP_REDIRECT_NEW_CODE_TEMP = 307,
	REQUEST_OPTIONS = [
		'agent',
		'auth',
		'family',
		'headers',
		'host',
		'hostname',
		'json',
		'localAddress',
		'method',
		'path',
		'pathname',
		'port',
		'protocol',
		'query',
		'rejectUnauthorized',
		'maxRetries',
		'rawStream',
		'secure',
		'socketPath'],
	SECURE_PROTOCOL_RE = /^https/i;

function _augmentRequestOptions (options, settings) {
	let augmented = {};

	// ensure options exist
	options = options || {};

	// apply settings from Ctor
	REQUEST_OPTIONS.forEach((field) => {
		let value = validation.coalesce(options[field], settings[field]);

		if (!validation.isEmpty(value)) {
			augmented[field] = value;
		}
	});

	// ensure maxRetries is applied if one is not supplied
	augmented.maxRetries = augmented.maxRetries || DEFAULT_RETRY_COUNT;

	// ensure rawStream setting is applied if not supplied
	augmented.rawStream = validation.isEmpty(augmented.rawStream) ?
		false :
		augmented.rawStream;

	// ensure default timeout is applied if one is not supplied
	augmented.timeout = augmented.timeout || DEFAULT_TIMEOUT;

	// create `path` from pathname and query.
	augmented.path = augmented.path || augmented.pathname;

	return augmented;
}

function _exec (request, options, data, tryCount, callback) {
	if (typeof data === 'function' && validation.isEmpty(callback)) {
		callback = data;
		/*eslint no-undefined:0*/
		data = undefined;
		tryCount = FIRST_TRY;
	}

	if (typeof tryCount === 'function' && validation.isEmpty(callback)) {
		callback = tryCount;
		tryCount = FIRST_TRY;
	}

	data = data || '';
	options.headers = options.headers || {};
	tryCount = tryCount || FIRST_TRY;

	let
		exec,
		redirectCount = 0;

	exec = new Promise(function (resolve, reject) {
		if (typeof data !== 'string') {
			data = JSON.stringify(data);
		}

		// apply content length header
		options.headers['Content-Length'] = Buffer.byteLength(data);

		// apply application/json header if appropriate
		if (!options.rawStream && options.json && !options.headers['Content-Type']) {
			options.headers['Content-Type'] = 'application/json';
		}

		// provide request event
		if (request.emit) {
			request.emit(EVENT_REQUEST, options);
		}

		let makeRequest = function () {
			let req = (options.secure ? https : http).request(
				options,
				(res) => {
					let
						chunks = [],
						context = {
							headers : res.headers,
							statusCode : res.statusCode
						},
						redirect = [
							HTTP_REDIRECT_CODE_PERM,
							HTTP_REDIRECT_CODE_TEMP,
							HTTP_REDIRECT_NEW_CODE_PERM,
							HTTP_REDIRECT_NEW_CODE_TEMP
						].some((code) => (code === context.statusCode));

					// provide response event (as there are response headers)
					if (request.emit) {
						request.emit(EVENT_RESPONSE, context);
					}

					if (context.statusCode === HTTP_PROXY_REQUIRED) {
						let err = new Error('proxy server configuration required');
						err.options = options;
						err.response = context;

						return reject(err);
					}

					// check for HTTP redirect
					if (redirect) {
						if (validation.isEmpty(context.headers.location)) {
							let err = new Error('redirect requested with no location');
							err.options = options;
							err.response = context;

							return reject(err);
						}

						if (redirectCount >= DEFAULT_MAX_REDIRECT_COUNT) {
							let err = new Error('maximum redirect limit exceeded');
							err.options = options;
							err.response = context;

							return reject(err);
						}

						// remap options and redirect to supplied URL
						let redirectUrl = url.parse(context.headers.location);
						options = {
							host : redirectUrl.host || options.host || options.hostname,
							method : options.method,
							path : redirectUrl.path,
							pathname : redirectUrl.pathname,
							rawStream : options.rawStream,
							secure : (redirectUrl.protocol ?
								SECURE_PROTOCOL_RE.test(redirectUrl.protocol) :
								options.secure)
						};

						// increment number of redirects (to avoid endless looping)
						redirectCount ++;

						// emit redirect event
						request.emit(EVENT_REDIRECT, options);

						// re-request based on the redirect location
						return setImmediate(makeRequest);
					}

					// for content-api requests (or other raw binary data requests)
					// rawStream may be set to true - in the event of this, return
					// the response directly
					if (options.rawStream) {
						if (context.statusCode >= HTTP_ERROR_CODE_THRESHHOLD) {
							let err = new Error('resource not found');
							err.context = context;

							return reject(err);
						}

						return resolve(res);
					}

					// standard API requests flow through below...
					res.setEncoding('utf-8');

					res.on('data', (chunk) => (chunks.push(chunk)));

					res.once('end', () => {
						let
							body = chunks.join(''),
							retry =
								context.statusCode >= HTTP_ERROR_CODE_RETRY_THRESHHOLD &&
								tryCount <= options.maxRetries;

						// attempt to parse the body
						if (typeof body === 'string' && body.length && options.json) {
							try {
								body = JSON.parse(body);
							} catch (err) {
								err.body = body;
								err.context = context;

								return reject(err);
							}
						}

						// handle retry if error code is above threshhold
						if (retry) {
							tryCount += 1;
							return makeRequest();
						}

						// handle other response errors
						if (context.statusCode >= HTTP_ERROR_CODE_THRESHHOLD) {
							let err = new Error('resource not found');
							err.body = body;
							err.context = context;

							return reject(err);
						}

						// resolve the request as complete
						return resolve(body || '');
					});
				});

			req.on('error', (err) => {
				// retry if below retry count threshhold
				if (tryCount <= options.maxRetries) {
					tryCount += 1;
					return makeRequest();
				}

				return reject(err)
			});

			// timeout the connection
			if (options.timeout) {
				req.setTimeout(options.timeout, () => {
					console.log('TIMED OUT');
					req.abort();
				});
			}

			// write data to the connection
			if (data) {
				req.write(data);
			}

			// signal end of request data
			req.end();
		}

		// do it!
		makeRequest();
	});

	return validation.promiseOrCallback(exec, callback);
}

export class Request extends events.EventEmitter {
	constructor (settings) {
		super();
		this.settings = settings || {};
	}

	delete (options, callback) {
		options = _augmentRequestOptions(options, this.settings);
		options.method = 'DELETE';

		return _exec(this, options, callback);
	}

	get (options, callback) {
		options = _augmentRequestOptions(options, this.settings);
		options.method = 'GET';

		return _exec(this, options, callback);
	}

	getRequestOptions (options) {
		return _augmentRequestOptions(options, this.settings);
	}

	head (options, callback) {
		options = _augmentRequestOptions(options, this.settings);
		options.method = 'HEAD';

		return _exec(this, options, callback);
	}

	post (options, data, callback) {
		options = _augmentRequestOptions(options, this.settings);
		options.method = 'POST';

		return _exec(this, options, data, callback);
	}

	put (options, data, callback) {
		options = _augmentRequestOptions(options, this.settings);
		options.method = 'PUT';

		return _exec(this, options, data, callback);
	}
}

export default { Request }
