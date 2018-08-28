'use strict'

import 'babel-polyfill';
import 'source-map-support/register';
import core from './core.js';
import debugLog from 'debug';
import events from 'events';
import http from 'http';
import https from 'https';
import path from 'path';
import url from 'url';

const
	debug = debugLog('craigslist'),
	DEFAULT_HTTP_PORT = 80,
	DEFAULT_HTTPS_PORT = 443,
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
	HTTPS_RE = /^https\:?/i,
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
		'proxy',
		'query',
		'rejectUnauthorized',
		'maxRetries',
		'rawStream',
		'secure',
		'socketPath',
		'timeout'],
	SECURE_PROTOCOL_RE = /^https/i,
	TOP_LEVEL_REDIRECT_RE = /^\/{2}([a-z0-9\-\_\.]*)([\/a-z\-\_\.]*)/i;

function _augmentRequestOptions (options) {
	let
		augmented = {},
		/*eslint no-invalid-this:0*/
		self = this;

	// ensure options exist
	options = options || {};

	// apply settings from Ctor
	REQUEST_OPTIONS.forEach((field) => {
		let value = core.Validation.coalesce(options[field], self.settings[field]);

		if (!core.Validation.isEmpty(value)) {
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
	augmented.maxRetries = core.Validation.coalesce(
		augmented.maxRetries,
		DEFAULT_RETRY_COUNT);

	// ensure rawStream setting is applied if not supplied
	augmented.rawStream = core.Validation.isEmpty(augmented.rawStream) ?
		false :
		augmented.rawStream;

	// ensure default timeout is applied if one is not supplied
	augmented.timeout = core.Validation.coalesce(augmented.timeout, DEFAULT_TIMEOUT);

	// create `path` from pathname and query.
	augmented.path = core.Validation.coalesce(augmented.path, augmented.pathname);
	// create a unique stamp for queries to encourage fresh response rather than cached response
	if(augmented.path.indexOf('?')>0){
	  augmented.path = augmented.path + '&uniqstamp=' + Date.now();
	}
	return augmented;
}

function _exec (options, data, tryCount, callback) {
	if (typeof data === 'function' && core.Validation.isEmpty(callback)) {
		callback = data;
		/*eslint no-undefined:0*/
		data = undefined;
		tryCount = FIRST_TRY;
	}

	if (typeof tryCount === 'function' && core.Validation.isEmpty(callback)) {
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
		// attempt to over-ride caching for more real time results
		options.headers['Cache-Control'] = 'private, no-cache, no-store, must-revalidate, max-age=0';
		options.headers['Pragma'] = 'no-cache';

		// apply application/json header if appropriate
		if (!options.rawStream && options.json && !options.headers['Content-Type']) {
			options.headers['Content-Type'] = 'application/json';
		}

		// apply proxy settings, as appropriate
		if (!core.Validation.isEmpty(options.proxy)) {
			let
				host = options.host || options.hostname,
				proxy = url.parse(options.proxy);

			// set the host header to the destination server
			options.headers['Host'] = host;

			// ensure the path property includes the full destination URL (and port)
			if (options.path.indexOf(host) < 0) {
				if (options.port && [DEFAULT_HTTP_PORT, DEFAULT_HTTPS_PORT].indexOf(options.port) < 0) {
					host = [host, options.port].join(':');
				}

				options.path = [
					options.secure ? 'https' : 'http',
					path.join(host, options.path)].join('://');
			}

			// set the secure settings, host and port for the options to the proxy server
			options.host = proxy.host;
			options.port = proxy.port;
			options.secure = HTTPS_RE.test(proxy.protocol);

			debug('proxy settings (%s) detected and applied: %o', options.proxy, options);
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
						if (core.Validation.isEmpty(context.headers.location)) {
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

						if (TOP_LEVEL_REDIRECT_RE.test(redirectUrl.pathname)) {
							debug('top level domain detected in location: %o', redirectUrl);
							let pathParts = redirectUrl.pathname.match(TOP_LEVEL_REDIRECT_RE);

							// ensure the hostname is corrected
							redirectUrl.host = pathParts[1];
							redirectUrl.hostname = pathParts[1];

							// update the path and pathname appropriately
							redirectUrl.path = [pathParts[2], redirectUrl.search].join('');
							redirectUrl.pathname = pathParts[2];
						}

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

	return core.Validation.promiseOrCallback(exec, callback);
}

export class Request extends events.EventEmitter {
	constructor (settings) {
		super();
		this.settings = settings || {};
	}

	/*
	delete (options, callback) {
		debug('performing DELETE (%o)', options);
		options = this::_augmentRequestOptions(options);
		options.method = 'DELETE';

		return this::_exec(options, callback);
	}
	//*/

	get (options, callback) {
		debug('performing GET (%o)', options);
		options = this::_augmentRequestOptions(options);
		options.method = 'GET';

		return this::_exec(options, callback);
	}

	getRequestOptions (options) {
		return this::_augmentRequestOptions(options);
	}

	/*
	head (options, callback) {
		debug('performing HEAD (%o)', options);
		options = this::_augmentRequestOptions(options);
		options.method = 'HEAD';

		return this::_exec(options, callback);
	}
	//*/

	/*
	post (options, data, callback) {
		debug('performing POST (%o)', options);
		options = this::_augmentRequestOptions(options);
		options.method = 'POST';

		return this::_exec(options, data, callback);
	}
	//*/

	/*
	put (options, data, callback) {
		debug('performing PUT (%o)', options);
		options = this::_augmentRequestOptions(options);
		options.method = 'PUT';

		return this::_exec(options, data, callback);
	}
	//*/
}

export default { Request }
