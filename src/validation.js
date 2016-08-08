import 'source-map-support/register';


export default (function (self) {
	'use strict';

	self.applyOptionalParameters = (inputOptions, outputOptions) => {
		// ensure outputOptions are defined...
		if (self.isEmpty(outputOptions)) {
			outputOptions = {};
		}

		// apply additional optional settings if supplied
		if (self.isEmpty(inputOptions)) {
			return outputOptions;
		}

		if (!self.isEmpty(inputOptions.agent)) {
			outputOptions.agent = inputOptions.agent;
		}

		if (!self.isEmpty(inputOptions.maxRetries) && !isNaN(inputOptions.maxRetries)) {
			outputOptions.maxRetries = parseInt(inputOptions.maxRetries, 10);
		}

		if (!self.isEmpty(inputOptions.port) && !isNaN(inputOptions.port)) {
			outputOptions.port = parseInt(inputOptions.port, 10);
		}

		if (!self.isEmpty(inputOptions.rejectUnauthorized)) {
			outputOptions.rejectUnauthorized = inputOptions.rejectUnauthorized;
		}

		if (!self.isEmpty(inputOptions.timeout) && !isNaN(inputOptions.timeout)) {
			outputOptions.timeout = parseInt(inputOptions.timeout, 10);
		}

		return outputOptions;
	};

	self.coalesce = function () {
		return Array
			.prototype
			.slice
			.call(arguments)
			.filter((value) => (!self.isEmpty(value)))[0];
	};

	self.isEmpty = (value) => (value === null || [
		typeof value === 'undefined',
		typeof value === 'string' && !value.length,
		Array.isArray(value) && !value.length,
		typeof value === 'object' &&
			value.toString &&
			/^\[object\sObject\]$/.test(value.toString()) &&
			!Object.keys(value).length
	].some((result) => (result)));

	self.promiseOrCallback = (promise, callback) => {
		if (self.isEmpty(callback)) {
			return promise;
		}

		return promise
			.then((result) => (callback(null, result)))
			.catch(callback);
	};

	return self;

}({}));
