import 'source-map-support/register';


export default (function (self) {
	'use strict';

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
		typeof value === 'number' && isNaN(value),
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
