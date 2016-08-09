'use strict'

import 'babel-polyfill';
import 'source-map-support/register';
import debugLog from 'debug';
import events from 'events';
import http from 'http';
import https from 'https';
import url from 'url';
import validation from './validation.js';

const
	debug = debugLog('craigslist'),
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
		'maxRetries',
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
		'socketPath',
		'timeout'],
	SECURE_PROTOCOL_RE = /^https/i;

function _augmentRequestOptions (options) {
	let
		augmented = {},
		/*eslint no-invalid-this:0*/
		self = this;

	// ensure options exist
	options = options || {};

	// apply settings from Ctor
	REQUEST_OPTIONS.forEach((field) => {
		let value = validation.coalesce(options[field], self.settings[field]);

		if (!validation.isEmpty(value)) {
			debug(
				'request %s will be set to %s (options = %s, settings = %s)',
				field,
				value,
				options[field],
				self.settings[field]);
			augmented[field] = value;
		}
	});

	// ensure maxRetries is applied if one is not supplied
	augmented.maxRetries = validation.coalesce(
		augmented.maxRetries,
		DEFAULT_RETRY_COUNT);

	// ensure rawStream setting is applied if not supplied
	augmented.rawStream = validation.isEmpty(augmented.rawStream) ?
		false :
		augmented.rawStream;

	// ensure default timeout is applied if one is not supplied
	augmented.timeout = validation.coalesce(augmented.timeout, DEFAULT_TIMEOUT);

	// create `path` from pathname and query.
	augmented.path = validation.coalesce(augmented.path, augmented.pathname);

	return augmented;
}

function _exec (options, data, tryCount, callback) {
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
		redirectCount = 0,
		/*eslint no-invalid-this:0*/
		self = this;

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
		if (self.emit) {
			self.emit(EVENT_REQUEST, options);
		}

		let makeRequest = function () {
			debug('establishing request with options: %o', options);
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
					if (self.emit) {
						self.emit(EVENT_RESPONSE, context);
					}

					if (context.statusCode === HTTP_PROXY_REQUIRED) {
						let err = new Error('proxy server configuration required');
						err.options = options;
						err.response = context;

						debug('error: proxy server required: %o', err);

						return reject(err);
					}

					// check for HTTP redirect
					if (redirect) {
						if (validation.isEmpty(context.headers.location)) {
							let err = new Error('redirect requested with no location');
							err.options = options;
							err.response = context;

							debug('error: missing redirect header: %o', err);

							return reject(err);
						}

						if (redirectCount >= DEFAULT_MAX_REDIRECT_COUNT) {
							let err = new Error('maximum redirect limit exceeded');
							err.options = options;
							err.response = context;

							debug('error: exceeded max number of redirects: %o', err);

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
						if (self.emit) {
							self.emit(EVENT_REDIRECT, options);
						}

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

							debug('error: unable to process response: %o', context.statusCode);

							return reject(err);
						}

						debug('returning response as stream');

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

								debug('error: unable to parse JSON response: %o', err);

								return reject(err);
							}
						}

						// handle retry if error code is above threshhold
						if (retry) {
							debug(
								'retry: response status code: %o',
								context.statusCode);
							tryCount += 1;
							return makeRequest();
						}

						// handle other response errors
						if (context.statusCode >= HTTP_ERROR_CODE_THRESHHOLD) {
							let err = new Error('resource not found');
							err.body = body;
							err.context = context;

							debug('error: resource not found: %o', err);

							return reject(err);
						}

						debug('successfully completed request');

						// resolve the request as complete
						return resolve(body || '');
					});
				});

			req.on('error', (err) => {
				debug('error: unable to establish connection: %o', err);

				// retry if below retry count threshhold
				if (tryCount <= options.maxRetries) {
					debug(
						'retry: %d retries remaining',
						options.maxRetries - tryCount);
					tryCount += 1;
					return makeRequest();
				}

				return reject(err)
			});

			// timeout the connection
			if (options.timeout) {
				debug('setting timeout value to %o', options.timeout);
				req.setTimeout(options.timeout, req.abort);
			}

			// write data to the connection
			if (data) {
				debug('writing %d bytes of data', options.headers['Content-Length']);
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
		debug('performing DELETE');
		options = this::_augmentRequestOptions(options);
		options.method = 'DELETE';

		return this::_exec(options, callback);
	}

	get (options, callback) {
		debug('performing GET');
		options = this::_augmentRequestOptions(options);
		options.method = 'GET';

		return this::_exec(options, callback);
	}

	getRequestOptions (options) {
		return this::_augmentRequestOptions(options);
	}

	head (options, callback) {
		debug('performing HEAD');
		options = this::_augmentRequestOptions(options);
		options.method = 'HEAD';

		return this::_exec(options, callback);
	}

	post (options, data, callback) {
		debug('performing POST');
		options = this::_augmentRequestOptions(options);
		options.method = 'POST';

		return this::_exec(options, data, callback);
	}

	put (options, data, callback) {
		debug('performing PUT');
		options = this::_augmentRequestOptions(options);
		options.method = 'PUT';

		return this::_exec(options, data, callback);
	}
}

export default { Request }
