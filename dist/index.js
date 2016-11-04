'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.Client = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('babel-polyfill');

require('source-map-support/register');

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

var _core = require('./core.js');

var _core2 = _interopRequireDefault(_core);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _web = require('./web.js');

var _web2 = _interopRequireDefault(_web);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('craigslist'),
    DEFAULT_BASE_HOST = 'craigslist.org',
    DEFAULT_CATEGORY = 'sss',
    DEFAULT_PATH = '/search/',
    DEFAULT_QUERYSTRING = '?sort=rel',
    DEFAULT_REQUEST_OPTIONS = {
	hostname: '',
	path: '',
	secure: true
},
    QUERY_KEYS = ['category', 'maxAsk', 'minAsk', 'query'],
    QUERY_PARAM_MAX = '&maxAsk=',
    QUERY_PARAM_MIN = '&minAsk=',
    QUERY_PARAM_QUERY = '&query=',
    RE_QUALIFIED_URL = /^\/\/[a-z0-9\-]*\.craigslist\.[a-z]*/i;

/**
 * Accepts strong of HTML and parses that string to find key details.
 *
 * @param {string} postingUrl - URL that details were loaded from
 * @param {string} markup - Markup from the request to Craigslist
 * @returns {object} details - The processed details from the Craigslist posting
 **/
function _getPostingDetails(postingUrl, markup) {
	var $ = _cheerio2.default.load(markup),
	    details = {};

	details.description = ($('#postingbody').text() || '').trim();
	details.mapUrl = $('div.mapbox p.mapaddress').find('a').attr('href');
	details.pid = postingUrl.substring(postingUrl.search(/[0-9]*\.html/)).replace(/\.html/, '');
	details.replyUrl = ($('#replylink').attr('href') || '').trim();
	details.title = ($('#titletextonly').text() || '').trim();
	details.url = postingUrl;

	// populate posting info
	$('div.postinginfos').find('p.postinginfo').each(function (i, element) {
		var infoType = $(element).text();

		// set pid (a backup to ripping it from the URL)
		if (/post\sid/i.test(infoType)) {
			details.pid = (infoType.split(/\:/)[1] || '').trim();
			return;
		}

		// set postedAt
		if (/posted/i.test(infoType) && $(element).find('time').attr('datetime')) {
			details.postedAt = new Date($(element).find('time').attr('datetime'));
			return;
		}

		// set updatedAt
		if (/updated/i.test(infoType) && $(element).find('time').attr('datetime')) {
			details.updatedAt = new Date($(element).find('time').attr('datetime'));
			return;
		}
	});

	// populate posting photos
	$('#thumbs').find('a').each(function (i, element) {
		details.images = details.images || [];
		details.images.push(($(element).attr('href') || '').trim());
	});

	return details;
}

/**
 * Accepts string of HTML and parses that string to find all pertinent postings.
 *
 * @param {object} options - Request options used for the request to craigslist
 * @param {string} markup - Markup from the request to Craigslist
 * @returns {Array} postings - The processed and normalized array of postings
 **/
function _getPostings(options, markup) {
	var $ = _cheerio2.default.load(markup),
	    hostname = options.hostname,
	    posting = {},
	    postings = [],
	    secure = options.secure;

	$('ul.rows').find('li.result-row').each(function (i, element) {
		var detailsUrl = $(element).find('a.result-title').attr('href');

		// introducing fix for #6
		if (!RE_QUALIFIED_URL.test(detailsUrl)) {
			detailsUrl = [secure ? 'https://' : 'http://', hostname, detailsUrl].join('');
			// debug('adjusted URL for posting to (%s)', detailsUrl);
		} else {
			detailsUrl = [secure ? 'https:' : 'http:', detailsUrl].join('');
			// debug('adjusted URL for postings to (%s)', detailsUrl);
		}

		posting = {
			category: $(element).find('span.l2 a.gc').text(),
			coordinates: {
				lat: $(element).attr('data-latitude'),
				lon: $(element).attr('data-longitude')
			},
			date: ($(element).find('.result-date').attr('datetime') || '').trim(),
			hasPic: ($(element).find('span.l2 span.p').text() || '').trim() !== '',
			location: ($(element).find('.result-hood').text() || '').replace(/[\(,\)]/g, '') // santize
			.trim(),
			pid: ($(element).attr('data-pid') || '').trim(),

			price: $(element).find('.result-price').text() || '',

			title: ($(element).find('.result-title').text() || '').trim(),
			url: detailsUrl
		};

		// make sure lat / lon is valid
		if (typeof posting.coordinates.lat === 'undefined' || typeof posting.coordinates.lon === 'undefined') {
			delete posting.coordinates;
		}

		postings.push(posting);
	});

	return postings;
}

/**
 * Accepts strong of HTML and parses that string to find key details.
 *
 * @param {object} details - a posting object to populate
 * @param {string} markup - Markup from the request to Craigslist
 * @returns {null} - Returns empty
 **/
function _getReplyDetails(details, markup) {
	var $ = _cheerio2.default.load(markup);

	$('div.reply_options').find('b').each(function (i, element) {
		var infoType = $(element).text().trim();

		// set contact name
		if (/contact\sname/i.test(infoType)) {
			$(element).next().find('li').each(function (i, li) {
				details.contactName = $(li).text().trim();
			});

			return;
		}

		// set phone number and email
		if (/call/i.test(infoType)) {
			$(element).parent().find('li').each(function (i, li) {
				var value = $(li).text().trim();

				// check for phone value (based on the emoji)
				if (/\u260E/.test(value)) {
					details.phoneNumber = value.substring(value.indexOf('('));
					return;
				}

				// check for email value (based on the @ symbol)
				if (/\@/.test(value)) {
					details.email = value;
				}
			});

			return;
		}
	});
}

/**
 * Accepts options, iterates through the known acceptable keys from defaultOptions
 * and if found in input options, uses that. If not found in input options to method,
 * falls back to the options specified when the module was initialized. If not found
 * in initialization options, uses the default options setting. All keys provided in
 * the input options variable are retained.
 *
 * @param {object} options - Input options for the web request
 * @param {string} query - A querystring
 * @returns {object} options - The coalesced result of options
 **/
function _getRequestOptions(options, query) {
	var requestOptions = JSON.parse(JSON.stringify(DEFAULT_REQUEST_OPTIONS)),

	/*eslint no-invalid-this:0*/
	self = this;

	// ensure default options are set, even if omitted from input options
	requestOptions.hostname = [_core2.default.Validation.coalesce(options.city, self.options.city, ''),
	// introducing fix for #7
	_core2.default.Validation.coalesce(options.baseHost, self.options.baseHost, DEFAULT_BASE_HOST)].join('.');

	// preserve any extraneous input option keys (may have addition instructions for underlying request object)
	Object.keys(options).forEach(function (key) {
		if (!QUERY_KEYS.indexOf(key) && _core2.default.Validation.isEmpty(requestOptions[key]) && _core2.default.Validation.isEmpty(DEFAULT_REQUEST_OPTIONS[key])) {
			requestOptions[key] = options[key];
		}
	});

	// setup path
	if (_core2.default.Validation.isEmpty(requestOptions.path)) {
		requestOptions.path = DEFAULT_PATH;
	}

	// setup category
	requestOptions.path = [requestOptions.path, _core2.default.Validation.coalesce(options.category, DEFAULT_CATEGORY)].join('');

	// setup querystring
	requestOptions.path = [requestOptions.path, DEFAULT_QUERYSTRING].join('');

	// add search query (if specified)
	if (!_core2.default.Validation.isEmpty(query)) {
		requestOptions.path = [requestOptions.path, QUERY_PARAM_QUERY, encodeURIComponent(query)].join('');
	}

	// add min asking price (if specified)
	if (!_core2.default.Validation.isEmpty(options.minAsk)) {
		requestOptions.path = [requestOptions.path, QUERY_PARAM_MIN, options.minAsk].join('');
	}

	// add max asking price (if specified)
	if (!_core2.default.Validation.isEmpty(options.maxAsk)) {
		requestOptions.path = [requestOptions.path, QUERY_PARAM_MAX, options.maxAsk].join('');
	}

	debug('setting request options: %o', requestOptions);

	return requestOptions;
}

var Client = exports.Client = function () {
	function Client(options) {
		_classCallCheck(this, Client);

		this.options = options || {};
		this.request = new _web2.default.Request(this.options);
	}

	_createClass(Client, [{
		key: 'details',
		value: function details(posting, callback) {
			var exec = void 0,
			    getDetails = void 0,
			    postingUrl = void 0,
			    requestOptions = void 0,
			    self = this;

			// retrieves the posting details directly
			getDetails = new Promise(function (resolve, reject) {
				if (_core2.default.Validation.isEmpty(posting)) {
					return reject(new Error('posting URL is required'));
				}

				if (typeof posting !== 'string' && _core2.default.Validation.isEmpty(posting.url)) {
					return reject(new Error('posting URL is required'));
				}

				postingUrl = typeof posting === 'string' ? posting : posting.url;
				requestOptions = _url2.default.parse(postingUrl);
				requestOptions.secure = /https/i.test(requestOptions.protocol);

				debug('request options set to: %o', requestOptions);

				return self.request.get(requestOptions).then(function (markup) {
					debug('retrieved posting %o', posting);
					var details = _getPostingDetails.call(self, postingUrl, markup);

					return resolve(details);
				}).catch(reject);
			});

			exec = new Promise(function (resolve, reject) {
				return getDetails.then(function (details) {
					if (!details.replyUrl) {
						return resolve(details);
					}

					// properly adjust reply URL
					if (!RE_QUALIFIED_URL.test(details.replyUrl)) {
						details.replyUrl = ['http://', requestOptions.hostname, details.replyUrl].join('');
					}

					// set request options to retrieve posting contact info
					requestOptions = _url2.default.parse(details.replyUrl);

					return self.request.get(requestOptions).then(function (markup) {
						_getReplyDetails.call(self, details, markup);

						return resolve(details);
					}).catch(reject);
				}).catch(reject);
			});

			// execute!
			return _core2.default.Validation.promiseOrCallback(exec, callback);
		}
	}, {
		key: 'list',
		value: function list(options, callback) {
			/*eslint no-undefined:0*/
			return this.search(options, undefined, callback);
		}
	}, {
		key: 'search',
		value: function search(options, query, callback) {
			var _this = this;

			if (typeof query === 'function' && _core2.default.Validation.isEmpty(callback)) {
				callback = query;
				query = typeof options === 'string' ? options : query;
				options = typeof options === 'string' ? {} : options;
			}

			if (_core2.default.Validation.isEmpty(query) && typeof options === 'string') {
				query = options;
				options = {};
			}

			if (typeof options === 'function') {
				callback = options;
				options = {};
				/*eslint no-undefined:0*/
				query = undefined;
			}

			// ensure options is at least a blank object before continuing
			options = options || {};

			var exec = void 0,
			    self = this;

			// create a Promise to execute the request
			exec = new Promise(function (resolve, reject) {
				// remap options for the request
				var requestOptions = _getRequestOptions.call(_this, options, query);

				debug('request options set to: %o', requestOptions);

				if (_core2.default.Validation.isEmpty(requestOptions.hostname)) {
					return reject(new Error('unable to set hostname (check to see if city is specified)'));
				}

				return self.request.get(requestOptions).then(function (markup) {
					var postings = _getPostings(requestOptions, markup);
					debug('found %d postings', postings.length);

					return resolve(postings);
				}).catch(reject);
			});

			// execute!
			return _core2.default.Validation.promiseOrCallback(exec, callback);
		}
	}]);

	return Client;
}();

exports.default = { Client: Client };
//# sourceMappingURL=index.js.map
