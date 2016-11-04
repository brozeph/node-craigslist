'use strict';

import 'babel-polyfill';
import 'source-map-support/register';
import cheerio from 'cheerio';
import core from './core.js';
import debugLog from 'debug';
import url from 'url';
import web from './web.js';

const
	debug = debugLog('craigslist'),
	DEFAULT_BASE_HOST = 'craigslist.org',
	DEFAULT_CATEGORY = 'sss',
	DEFAULT_PATH = '/search/',
	DEFAULT_QUERYSTRING = '?sort=rel',
	DEFAULT_REQUEST_OPTIONS = {
		hostname : '',
		path : '',
		secure : true
	},
	QUERY_KEYS = [
		'category',
		'maxAsk',
		'minAsk',
		'query'
	],
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
function _getPostingDetails (postingUrl, markup) {
	let
		$ = cheerio.load(markup),
		details = {};

	details.description = ($('#postingbody').text() || '').trim();
	details.mapUrl = $('div.mapbox p.mapaddress')
		.find('a')
		.attr('href');
	details.pid = postingUrl
		.substring(postingUrl.search(/[0-9]*\.html/))
		.replace(/\.html/, '');
	details.replyUrl = ($('#replylink').attr('href') || '').trim();
	details.title = ($('#titletextonly').text() || '').trim();
	details.url = postingUrl;

	// populate posting info
	$('div.postinginfos').find('p.postinginfo').each((i, element) => {
		let infoType = $(element).text();

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
	$('#thumbs').find('a').each((i, element) => {
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
function _getPostings (options, markup) {
	let
		$ = cheerio.load(markup),
		hostname = options.hostname,
		posting = {},
		postings = [],
		secure = options.secure;

	$('div.content')
		.find('li.result-row')
		.each((i, element) => {
			let detailsUrl = $(element)
				.find('a.result-title')
				.attr('href');

			// introducing fix for #6
			if (!RE_QUALIFIED_URL.test(detailsUrl)) {
				detailsUrl = [
					(secure ? 'https://' : 'http://'),
					hostname,
					detailsUrl].join('');
				// debug('adjusted URL for posting to (%s)', detailsUrl);
			} else {
				detailsUrl = [
					(secure ? 'https:' : 'http:'),
					detailsUrl].join('');
				// debug('adjusted URL for postings to (%s)', detailsUrl);
			}

			posting = {
				category : $(element)
					.find('span.l2 a.gc')
					.text(),
				coordinates : {
					lat : $(element).attr('data-latitude'),
					lon : $(element).attr('data-longitude')
				},
				date : ($(element)
					.find('time')
					.attr('datetime') || '')
						.trim(),
				hasPic : ($(element)
					.find('span.result-tags')
					.text() || '')
						.trim() !== '',
				location : ($(element)
					.find('span.pnr small')
					.text() || '')
						.replace(/[\(,\)]/g, '') // santize
						.trim(),
				pid : ($(element)
					.attr('data-pid') || '')
						.trim(),
				price : ($(element)
					.find('span.result-price')
					.text() || '')
						.replace(/^\&\#x0024\;/g, '')
						.trim(), // sanitize
				title : ($(element)
					.find('a.result-title')
					.text() || '')
						.trim(),
				url : detailsUrl
			};

			// make sure lat / lon is valid
			if (typeof posting.coordinates.lat === 'undefined' ||
				typeof posting.coordinates.lon === 'undefined') {
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
function _getReplyDetails (details, markup) {
	let $ = cheerio.load(markup);

	$('div.reply_options').find('b').each((i, element) => {
		let infoType = $(element).text().trim();

		// set contact name
		if (/contact\sname/i.test(infoType)) {
			$(element).next().find('li').each((i, li) => {
				details.contactName = $(li).text().trim();
			});

			return;
		}

		// set phone number and email
		if (/call/i.test(infoType)) {
			$(element).parent().find('li').each((i, li) => {
				let value = $(li).text().trim();

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
function _getRequestOptions (options, query) {
	var
		requestOptions = JSON.parse(JSON.stringify(DEFAULT_REQUEST_OPTIONS)),
		/*eslint no-invalid-this:0*/
		self = this;

	// ensure default options are set, even if omitted from input options
	requestOptions.hostname = [
		core.Validation.coalesce(options.city, self.options.city, ''),
		// introducing fix for #7
		core.Validation.coalesce(
			options.baseHost,
			self.options.baseHost,
			DEFAULT_BASE_HOST)
	].join('.');

	// preserve any extraneous input option keys (may have addition instructions for underlying request object)
	Object
		.keys(options)
		.forEach((key) => {
			if (!QUERY_KEYS.indexOf(key) &&
				core.Validation.isEmpty(requestOptions[key]) &&
				core.Validation.isEmpty(DEFAULT_REQUEST_OPTIONS[key])) {
				requestOptions[key] = options[key];
			}
		});

	// setup path
	if (core.Validation.isEmpty(requestOptions.path)) {
		requestOptions.path = DEFAULT_PATH;
	}

	// setup category
	requestOptions.path = [
		requestOptions.path,
		core.Validation.coalesce(options.category, DEFAULT_CATEGORY)].join('');

	// setup querystring
	requestOptions.path = [requestOptions.path, DEFAULT_QUERYSTRING].join('');

	// add search query (if specified)
	if (!core.Validation.isEmpty(query)) {
		requestOptions.path = [
			requestOptions.path,
			QUERY_PARAM_QUERY,
			encodeURIComponent(query)].join('');
	}

	// add min asking price (if specified)
	if (!core.Validation.isEmpty(options.minAsk)) {
		requestOptions.path = [
			requestOptions.path,
			QUERY_PARAM_MIN,
			options.minAsk].join('');
	}

	// add max asking price (if specified)
	if (!core.Validation.isEmpty(options.maxAsk)) {
		requestOptions.path = [
			requestOptions.path,
			QUERY_PARAM_MAX,
			options.maxAsk].join('');
	}

	debug('setting request options: %o', requestOptions);

	return requestOptions;
}

export class Client {
	constructor(options) {
		this.options = options || {};
		this.request = new web.Request(this.options);
	}

	details (posting, callback) {
		let
			exec,
			getDetails,
			postingUrl,
			requestOptions,
			self = this;

		// retrieves the posting details directly
		getDetails = new Promise((resolve, reject) => {
			if (core.Validation.isEmpty(posting)) {
				return reject(new Error('posting URL is required'));
			}

			if (typeof posting !== 'string' && core.Validation.isEmpty(posting.url)) {
				return reject(new Error('posting URL is required'));
			}

			postingUrl = typeof posting === 'string' ? posting : posting.url;
			requestOptions = url.parse(postingUrl);
			requestOptions.secure = /https/i.test(requestOptions.protocol);

			debug('request options set to: %o', requestOptions);

			return self.request
				.get(requestOptions)
				.then((markup) => {
					debug('retrieved posting %o', posting);
					let details = self::_getPostingDetails(postingUrl, markup);

					return resolve(details);
				})
				.catch(reject);
		});

		exec = new Promise((resolve, reject) => {
			return getDetails
				.then((details) => {
					if (!details.replyUrl) {
						return resolve(details);
					}

					// properly adjust reply URL
					if (!RE_QUALIFIED_URL.test(details.replyUrl)) {
						details.replyUrl = [
							'http://',
							requestOptions.hostname,
							details.replyUrl].join('');
					}

					// set request options to retrieve posting contact info
					requestOptions = url.parse(details.replyUrl);

					return self.request
						.get(requestOptions)
						.then((markup) => {
							self::_getReplyDetails(details, markup);

							return resolve(details);
						})
						.catch(reject);
				})
				.catch(reject);
		});

		// execute!
		return core.Validation.promiseOrCallback(exec, callback);
	}

	list (options, callback) {
		/*eslint no-undefined:0*/
		return this.search(options, undefined, callback);
	}

	search (options, query, callback) {
		if (typeof query === 'function' && core.Validation.isEmpty(callback)) {
			callback = query;
			query = typeof options === 'string' ? options : query;
			options = typeof options === 'string' ? {} : options;
		}

		if (core.Validation.isEmpty(query) && typeof options === 'string') {
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

		let
			exec,
			self = this;

		// create a Promise to execute the request
		exec = new Promise((resolve, reject) => {
			// remap options for the request
			let requestOptions = this::_getRequestOptions(options, query);

			debug('request options set to: %o', requestOptions);

			if (core.Validation.isEmpty(requestOptions.hostname)) {
				return reject(
					new Error(
						'unable to set hostname (check to see if city is specified)'));
			}

			return self.request
				.get(requestOptions)
				.then((markup) => {
					let postings = _getPostings(requestOptions, markup);
					debug('found %d postings', postings.length);

					return resolve(postings);
				})
				.catch(reject);
		});

		// execute!
		return core.Validation.promiseOrCallback(exec, callback);
	}
}

export default { Client }
