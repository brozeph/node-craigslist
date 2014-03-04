var
	events = require('events'),
	http = require('http'),
	https = require('https'),

	DEFAULT_TIMEOUT = 30000,
	EVENT_REQUEST = 'request';


/*
	A closure that enables basic configuration of the request
	that will be applied for every operation of the lib.
*/
exports.initialize = function (settings, self) {
	'use strict';

	self = self || Object.create(events.EventEmitter.prototype);
	self.settings = settings || {};

	// enable events on request
	events.EventEmitter.call(self);

	/*
		Actually executes a request given the supplied options,
		writing the specified data and returning the result to the
		supplied callback.

		In the event that an exception occurs on the request, the
		Error is captured and returned via the callback.
	*/
	function exec (options, callback) {
		options = self.getRequestOptions(options);

		if (!options.headers) {
			options.headers = {};
		}

		if (self.emit) {
			self.emit(EVENT_REQUEST, options);
		}

		var req =
			(options.secure ? https : http).request(options, function (res) {
				var
					body = '',
					chunks = [],
					statusCode = res.statusCode;

				res.setEncoding('utf-8');

				res.on('data', function (chunk) {
					chunks.push(chunk);
				});

				res.once('end', function () {
					body = chunks.join('');

					if (statusCode >= 400) {
						var err = new Error(body);
						err.statusCode = statusCode;
						return callback(err);
					}

					return callback(null, body);
				});
			});

		req.on('error', function (err) {
			return callback(err, null);
		});

		// timeout the connection
		if (options.timeout) {
			req.on('socket', function (socket) {
				socket.setTimeout(options.timeout);
				socket.on('timeout', function () {
					req.abort();
				});
			});
		}

		req.end();

		return req;
	}

	/*
		Effectively merges request options with preconfigured
		information. Priority is given to the input options...

		This could get wonky if a client thinks to encapsulate
		settings for the server within a server sub-document of
		the options document.

		i.e.

		// this will override base config.host
		options.host = '127.0.0.1'

		// this will result in config.server being set... host
		// will not effectively be overriden for the request
		options.server.host = '127.0.0.1'
	*/
	self.getRequestOptions = function (options) {
		var returnOptions = {};

		Object.keys(self.settings).forEach(function (field) {
			returnOptions[field] = self.settings[field];
		});
		Object.keys(options).forEach(function (field) {
			returnOptions[field] = options[field];
		});

		// ensure default timeout is applied if one is not supplied
		if (typeof returnOptions.timeout === 'undefined') {
			returnOptions.timeout = DEFAULT_TIMEOUT;
		}

		return returnOptions;
	};

	/*
		Issues a GET request to the server
	*/
	self.get = function (options, callback) {
		options.method = 'GET';
		return exec(options, callback);
	};

	return self;
};
