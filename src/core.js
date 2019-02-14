export class Validation {
	static coalesce () {
		return Array
			.prototype
			.slice
			.call(arguments)
			.filter((value) => (!Validation.isEmpty(value)))[0];
	}

	static isEmpty (value) {
		return (value === null || [
			typeof value === 'undefined',
			typeof value === 'string' && !value.length,
			typeof value === 'number' && isNaN(value),
			Array.isArray(value) && !value.length,
			typeof value === 'object' &&
				value.toString &&
				/^\[object\sObject\]$/.test(value.toString()) &&
				!Object.keys(value).length
		].some((result) => (result)));
	}

	static promiseOrCallback (promise, callback) {
		if (Validation.isEmpty(callback)) {
			return promise;
		}

		return promise
			.then((result) => (callback(null, result)))
			.catch(callback);
	}
}

export default { Validation };
