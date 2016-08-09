'use strict';

import 'babel-polyfill';
import 'source-map-support/register';
import cheerio from 'cheerio';
import debugLog from 'debug';
import validation from './validation.js';
import web from './web.js';

let
	baseHost = '.craigslist.org',
	debug = debugLog('craigslist'),
	defaultRequestOptions = {
		hostname : '',
		path : '',
		secure : true
	},
	searchMaxAsk = '&maxAsk=',
	searchMinAsk = '&minAsk=',
	searchPath = '/search/sss?sort=rel&query=',
	listPath = '/search/sss?sort=date';

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
			listing = {
				category : $(element)
					.find('span.l2 a.gc')
					.text(),
				coordinates : {
					lat : $(element).attr('data-latitude'),
					lon : $(element).attr('data-longitude')
				},
				date : $(element)
					.find('span.pl time')
					.attr('datetime'),
				hasPic : ($(element)
					.find('span.l2 span.p')
					.text()
					.trim()) !== '',
				location : $(element)
					.find('span.pnr small')
					.text()
					.replace(/[\(,\)]/g, ''), // santize
				pid : $(element)
					.attr('data-pid'),
				price : $(element)
					.find('span.l2 span.price')
					.text()
					.replace(/^\&\#x0024\;/g, ''), // sanitize
				title : $(element)
					.find('span.pl a')
					.text(),
				url : [
					(secure ? 'https://' : 'http://'),
					hostname,
					$(element)
						.find('span.pl a')
						.attr('href')].join('')
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
		requestOptions = JSON.parse(JSON.stringify(defaultRequestOptions)),
		/*eslint no-invalid-this:0*/
		self = this;

	// ensure default options are set, even if omitted from input options
	requestOptions.hostname = [
		(options.city || self.options.city || ''),
		baseHost].join('');

	// preserve any extraneous input option keys (may have addition instructions for underlying request object)
	Object.keys(options).forEach(function (key) {
		if (key !== 'maxAsk' &&
			key !== 'minAsk' &&
			key !== 'category' &&
			typeof requestOptions[key] === 'undefined' &&
			typeof defaultRequestOptions[key] === 'undefined') {
			requestOptions[key] = options[key];
		}
	});

	// add category
	if (typeof options.category !== 'undefined') {
		searchPath = searchPath.replace('sss', options.category);
		listPath = listPath.replace('sss', options.category);
	}

	// set path
	if (typeof query !== 'undefined') {
		requestOptions.path = searchPath + encodeURIComponent(query);
	} else {
		requestOptions.path = listPath;
	}

	// add min and max asking price
	if (typeof options.minAsk !== 'undefined') {
		requestOptions.path += searchMinAsk + options.minAsk;
	}

	if (typeof options.maxAsk !== 'undefined') {
		requestOptions.path += searchMaxAsk + options.maxAsk;
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
		if (typeof query === 'function' && typeof callback === 'undefined') {
			callback = query;
			query = options;
			options = {};
		}

		if (typeof query === 'undefined' && typeof options === 'string') {
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
		return validation.promiseOrCallback(exec, callback);
	}
}

export default { Client }
