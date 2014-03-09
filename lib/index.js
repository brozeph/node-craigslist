var
	htmlParser = require('htmlparser'),
	select = require('soupselect').select,

	request = require('./request'),

	baseHost = '.craigslist.org',
	defaultRequestOptions = {
		hostname : '',
		path : '',
		secure : true
	},
	searchMaxAsk = '&maxAsk=',
	searchMinAsk = '&minAsk=',
	searchPath = '/search/sss?sort=rel&query=';


module.exports = (function (self) {
	'use strict';

	self = self || {};
	self.options = {};

	/*
		Accepts options, iterates through the known acceptable keys from defaultOptions
		and if found in input options, uses that. If not found in input options to method,
		falls back to the options specified when the module was initialized. If not found
		in initialization options, uses the default options setting. All keys provided in
		the input options variable are retained.
	*/
	function getRequestOptions (options) {
		var requestOptions = JSON.parse(JSON.stringify(defaultRequestOptions));

		// ensure default options are set, even if omitted from input options
		requestOptions.hostname =
			(options.city || self.options.city || '') +
			baseHost;

		// preserve any extraneous input option keys (may have addition instructions for underlying request object)
		Object.keys(options).forEach(function (key) {
			if (key !== 'maxAsk' &&
				key !== 'minAsk' &&
				typeof requestOptions[key] === 'undefined' &&
				typeof defaultRequestOptions[key] === 'undefined') {
				requestOptions[key] = options[key];
			}
		});

		return requestOptions;
	}

	function getText (dom) {
		if (dom && dom.children && dom.children.length) {
			return dom.children[0].data.trim();
		}

		return '';
	}

	/*
		options = {
			city : '',
			maxAsk : '',
			minAsk : '',
		}
	*/
	self.search = function (options, query, callback) {
		if (typeof query === 'function' && typeof callback === 'undefined') {
			callback = query;
			query = options;
			options = {};
		}

		var
			listingHandler = new htmlParser.DefaultHandler(function (err, dom) {
				if (err) {
					return callback(err);
				}

				var
					listings = [],
					listingsDOM = select(dom, 'div.content p.row');

				listingsDOM.forEach(function (listingDOM) {
					var
						listing = {},
						categoryDOM = select(listingDOM, 'span.l2 a.gc')[0],
						dateDOM = select(listingDOM, 'span.date')[0],
						locationDOM = select(listingDOM, 'span.pnr small')[0],
						picDOM = select(listingDOM, 'span.l2 span.p')[0],
						priceDOM = select(listingDOM, 'span.l2 span.price')[0],
						titleDOM = select(listingDOM, 'span.pl a')[0];

					// posting ID
					listing.pid = listingDOM.attribs['data-pid'];

					// lat / lon
					if (typeof listingDOM.attribs['data-latitude'] !== 'undefined' &&
						typeof listingDOM.attribs['data-longitude'] !== 'undefined') {
						listing.coordinates = {
							lat : listingDOM.attribs['data-latitude'],
							lon : listingDOM.attribs['data-longitude']
						};
					}

					listing.category = getText(categoryDOM);
					listing.date = getText(dateDOM);
					listing.hasPic = getText(picDOM) !== '';
					listing.location = getText(locationDOM).replace(/[\(,\)]/g, '');
					listing.price = getText(priceDOM).replace(/^\&\#x0024\;/g, '');
					listing.title = getText(titleDOM);
					listing.url = (requestOptions.secure ? 'https://' : 'http://') +
						requestOptions.hostname +
						titleDOM.attribs.href || '';

					listings.push(listing);
				});

				return callback(err, listings);
			}),
			listingParser = new htmlParser.Parser(listingHandler),
			requestOptions = getRequestOptions(options);

		// set path
		requestOptions.path = searchPath + query;

		// add min and max asking price
		if (options.minAsk) {
			requestOptions.path += searchMinAsk + options.minAsk;
		}

		if (options.maxAsk) {
			requestOptions.path += searchMaxAsk + options.maxAsk;
		}

		self.request.get(requestOptions, function (err, data) {
			if (err) {
				return callback(err);
			}

			// parse listings here
			listingParser.parseComplete(data);
		});
	};

	return {
		/*
			options = {
				city : ''
			}
		*/
		initialize : function (options) {
			options = options || {};

			self.options = options;
			self.request = request.initialize();
			return self;
		}
	};
}({}));