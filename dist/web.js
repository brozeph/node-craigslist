'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Request = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

require('source-map-support/register');

var _core = require('./core.js');

var _core2 = _interopRequireDefault(_core);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug2.default)('craigslist'),
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
    REQUEST_OPTIONS = ['agent', 'auth', 'family', 'headers', 'host', 'hostname', 'json', 'localAddress', 'maxRetries', 'method', 'path', 'pathname', 'port', 'protocol', 'query', 'rejectUnauthorized', 'maxRetries', 'rawStream', 'secure', 'socketPath', 'timeout'],
    SECURE_PROTOCOL_RE = /^https/i;

function _augmentRequestOptions(options) {
	var augmented = {},

	/*eslint no-invalid-this:0*/
	self = this;

	// ensure options exist
	options = options || {};

	// apply settings from Ctor
	REQUEST_OPTIONS.forEach(function (field) {
		var value = _core2.default.Validation.coalesce(options[field], self.settings[field]);

		if (!_core2.default.Validation.isEmpty(value)) {
			debug('request %s will be set to %s (options = %s, settings = %s)', field, value, options[field], self.settings[field]);
			augmented[field] = value;
		}
	});

	// ensure maxRetries is applied if one is not supplied
	augmented.maxRetries = _core2.default.Validation.coalesce(augmented.maxRetries, DEFAULT_RETRY_COUNT);

	// ensure rawStream setting is applied if not supplied
	augmented.rawStream = _core2.default.Validation.isEmpty(augmented.rawStream) ? false : augmented.rawStream;

	// ensure default timeout is applied if one is not supplied
	augmented.timeout = _core2.default.Validation.coalesce(augmented.timeout, DEFAULT_TIMEOUT);

	// create `path` from pathname and query.
	augmented.path = _core2.default.Validation.coalesce(augmented.path, augmented.pathname);

	return augmented;
}

function _exec(options, data, tryCount, callback) {
	if (typeof data === 'function' && _core2.default.Validation.isEmpty(callback)) {
		callback = data;
		/*eslint no-undefined:0*/
		data = undefined;
		tryCount = FIRST_TRY;
	}

	if (typeof tryCount === 'function' && _core2.default.Validation.isEmpty(callback)) {
		callback = tryCount;
		tryCount = FIRST_TRY;
	}

	data = data || '';
	options.headers = options.headers || {};
	tryCount = tryCount || FIRST_TRY;

	var exec = void 0,
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

		var makeRequest = function makeRequest() {
			debug('establishing request with options: %o', options);
			var req = (options.secure ? _https2.default : _http2.default).request(options, function (res) {
				var chunks = [],
				    context = {
					headers: res.headers,
					statusCode: res.statusCode
				},
				    redirect = [HTTP_REDIRECT_CODE_PERM, HTTP_REDIRECT_CODE_TEMP, HTTP_REDIRECT_NEW_CODE_PERM, HTTP_REDIRECT_NEW_CODE_TEMP].some(function (code) {
					return code === context.statusCode;
				});

				// provide response event (as there are response headers)
				if (self.emit) {
					self.emit(EVENT_RESPONSE, context);
				}

				if (context.statusCode === HTTP_PROXY_REQUIRED) {
					var err = new Error('proxy server configuration required');
					err.options = options;
					err.response = context;

					debug('error: proxy server required: %o', err);

					return reject(err);
				}

				// check for HTTP redirect
				if (redirect) {
					if (_core2.default.Validation.isEmpty(context.headers.location)) {
						var _err = new Error('redirect requested with no location');
						_err.options = options;
						_err.response = context;

						debug('error: missing redirect header: %o', _err);

						return reject(_err);
					}

					if (redirectCount >= DEFAULT_MAX_REDIRECT_COUNT) {
						var _err2 = new Error('maximum redirect limit exceeded');
						_err2.options = options;
						_err2.response = context;

						debug('error: exceeded max number of redirects: %o', _err2);

						return reject(_err2);
					}

					// remap options and redirect to supplied URL
					var redirectUrl = _url2.default.parse(context.headers.location);
					options = {
						host: redirectUrl.host || options.host || options.hostname,
						method: options.method,
						path: redirectUrl.path,
						pathname: redirectUrl.pathname,
						rawStream: options.rawStream,
						secure: redirectUrl.protocol ? SECURE_PROTOCOL_RE.test(redirectUrl.protocol) : options.secure
					};

					// increment number of redirects (to avoid endless looping)
					redirectCount++;

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
						var _err3 = new Error('resource not found');
						_err3.context = context;

						debug('error: unable to process response: %o', context.statusCode);

						return reject(_err3);
					}

					debug('returning response as stream');

					return resolve(res);
				}

				// standard API requests flow through below...
				res.setEncoding('utf-8');

				res.on('data', function (chunk) {
					return chunks.push(chunk);
				});

				res.once('end', function () {
					var body = chunks.join(''),
					    retry = context.statusCode >= HTTP_ERROR_CODE_RETRY_THRESHHOLD && tryCount <= options.maxRetries;

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
						debug('retry: response status code: %o', context.statusCode);
						tryCount += 1;
						return makeRequest();
					}

					// handle other response errors
					if (context.statusCode >= HTTP_ERROR_CODE_THRESHHOLD) {
						var _err4 = new Error('resource not found');
						_err4.body = body;
						_err4.context = context;

						debug('error: resource not found: %o', _err4);

						return reject(_err4);
					}

					debug('successfully completed request');

					// resolve the request as complete
					return resolve(body || '');
				});
			});

			req.on('error', function (err) {
				debug('error: unable to establish connection: %o', err);

				// retry if below retry count threshhold
				if (tryCount <= options.maxRetries) {
					debug('retry: %d retries remaining', options.maxRetries - tryCount);
					tryCount += 1;
					return makeRequest();
				}

				return reject(err);
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
		};

		// do it!
		makeRequest();
	});

	return _core2.default.Validation.promiseOrCallback(exec, callback);
}

var Request = exports.Request = function (_events$EventEmitter) {
	_inherits(Request, _events$EventEmitter);

	function Request(settings) {
		_classCallCheck(this, Request);

		var _this = _possibleConstructorReturn(this, (Request.__proto__ || Object.getPrototypeOf(Request)).call(this));

		_this.settings = settings || {};
		return _this;
	}

	/*
 delete (options, callback) {
 	debug('performing DELETE (%o)', options);
 	options = this::_augmentRequestOptions(options);
 	options.method = 'DELETE';
 		return this::_exec(options, callback);
 }
 //*/

	_createClass(Request, [{
		key: 'get',
		value: function get(options, callback) {
			debug('performing GET (%o)', options);
			options = _augmentRequestOptions.call(this, options);
			options.method = 'GET';

			return _exec.call(this, options, callback);
		}
	}, {
		key: 'getRequestOptions',
		value: function getRequestOptions(options) {
			return _augmentRequestOptions.call(this, options);
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

	}]);

	return Request;
}(_events2.default.EventEmitter);

exports.default = { Request: Request };
//# sourceMappingURL=web.js.map
