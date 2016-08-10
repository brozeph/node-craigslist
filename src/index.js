'use strict';

import 'babel-polyfill';
import 'source-map-support/register';
import cheerio from 'cheerio';
import core from './core.js';
import debugLog from 'debug';
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
 * Accepts string of HTML and parses that string to find all pertinent listings.
 *
 * @param {object} options - Request options used for the request to craigslist
 * @param {string} html - Markup from the request to Craigslist
 * @returns {Array} listings - The processed and normalized array of listings
 **/
function _getListings (options, html) {
	let
		$ = cheerio.load(html),
		hostname = options.hostname,
		listing = {},
		listings = [],
		secure = options.secure;

	$('div.content')
		.find('p.row')
		.each(function (i, element) {
			let detailsUrl = $(element)
				.find('span.pl a')
				.attr('href');

			// introducing fix for #6
			if (!RE_QUALIFIED_URL.test(detailsUrl)) {
				detailsUrl = [
					(secure ? 'https://' : 'http://'),
					hostname,
					detailsUrl].join('');

				debug('adjusted URL for listing to (%s)', detailsUrl);
			} else {
				detailsUrl = [
					(secure ? 'https:' : 'http:'),
					detailsUrl].join('');

				debug('adjusted URL for listing to (%s)', detailsUrl);
			}

			listing = {
				category : $(element)
					.find('span.l2 a.gc')
					.text(),
				coordinates : {
					lat : $(element).attr('data-latitude'),
					lon : $(element).attr('data-longitude')
				},
				date : ($(element)
					.find('span.pl time')
					.attr('datetime') || '')
						.trim(),
				hasPic : ($(element)
					.find('span.l2 span.p')
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
					.find('span.l2 span.price')
					.text() || '')
						.replace(/^\&\#x0024\;/g, '')
						.trim(), // sanitize
				title : ($(element)
					.find('span.pl a')
					.text() || '')
						.trim(),
				url : detailsUrl
			};

			// make sure lat / lon is valid
			if (typeof listing.coordinates.lat === 'undefined' ||
				typeof listing.coordinates.lon === 'undefined') {
				delete listing.coordinates;
			}

			listings.push(listing);
		});

	return listings;
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

	/*
	// Commented out for now - not unit tested...
	list (options, callback) {
		let self = this;

		if (typeof options === 'function' && typeof callback === 'undefined') {
			callback = options;
			options = {};
		}

		options = self::_getRequestOptions(options);

		self.request.get(options, function (err, data) {
			if (err) {
				return callback(err);
			}

			return callback(null, self::_getListings(options, data));
		});
	}
	//*/

	search (options, query, callback) {
		if (typeof query === 'function' && core.Validation.isEmpty(callback)) {
			callback = query;
			query = options;
			options = {};
		}

		if (core.Validation.isEmpty(query) && typeof options === 'string') {
			query = options;
			options = {};
		}

		let
			exec,
			self = this;

		// remap options for the request
		options = this::_getRequestOptions(options, query);

		// create a Promise to execute the request
		exec = new Promise((resolve, reject) => {
			return self.request
				.get(options)
				.then((data) => {
					let listings = _getListings(options, data);
					debug('found %d listings', listings.length);

					return resolve(listings);
				})
				.catch(reject);
		});

		// execute!
		return core.Validation.promiseOrCallback(exec, callback);
	}
}

export default { Client }
