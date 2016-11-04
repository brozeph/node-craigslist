'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Validation = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

require('source-map-support/register');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Validation = exports.Validation = function () {
	function Validation() {
		_classCallCheck(this, Validation);
	}

	_createClass(Validation, null, [{
		key: 'coalesce',
		value: function coalesce() {
			return Array.prototype.slice.call(arguments).filter(function (value) {
				return !Validation.isEmpty(value);
			})[0];
		}
	}, {
		key: 'isEmpty',
		value: function isEmpty(value) {
			return value === null || [typeof value === 'undefined', typeof value === 'string' && !value.length, typeof value === 'number' && isNaN(value), Array.isArray(value) && !value.length, (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.toString && /^\[object\sObject\]$/.test(value.toString()) && !Object.keys(value).length].some(function (result) {
				return result;
			});
		}
	}, {
		key: 'promiseOrCallback',
		value: function promiseOrCallback(promise, callback) {
			if (Validation.isEmpty(callback)) {
				return promise;
			}

			return promise.then(function (result) {
				return callback(null, result);
			}).catch(callback);
		}
	}]);

	return Validation;
}();

exports.default = { Validation: Validation };
//# sourceMappingURL=core.js.map
