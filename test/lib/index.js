/*eslint no-magic-numbers:0*/
var
	chai = require('chai'),

	craigslist = require('../../dist/index.js'),

	should = chai.should();


describe('unit tests for node-craigslist', function () {
	'use strict';

	var
		client,
		options = {},
		requestOptions,
		testMarkup = '';

	beforeEach(function () {
		options = {
			city : 'seattle',
			hostname : 'test.brozeph.com',
			secure : true
		};

		testMarkup = '<!DOCTYPE html><html><head></head><body class="toc search"><div class="content"><p class="row" data-pid="4355583965"> <span class="pl"> <time datetime="2015-04-07 23:31" title="Tue 07 Apr 11:31:09 PM (6 hours ago)">Apr 7</time> <a href="/see/vgm/4355583965.html" class="i" data-id="0:00P0P_8hKd1VlQDCd"></span><span class="price">&#x0024;250</span></a> <span class="star"></span> <span class="pl"> <span class="date">Mar  1</span>  <a href="/see/vgm/4355583965.html">NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE  </a> </span> <span class="l2"> <span class="price">&#x0024;250</span>  <span class="pnr"> <small> (renton)</small> <span class="px"> <span class="p"> pic</span></span> </span>  <a class="gc" href="/vgm/" data-cat="vgm">video gaming - by owner</a> </span> </p> <p class="row" data-latitude="47.6889961595583" data-longitude="-122.321962887269" data-pid="4357055000"> <a href="//othercity.craigslist.org/see/vgm/4357055000.html" class="i" data-id="0:00d0d_hYKRHRR9Pse"><span class="price">&#x0024;500</span></a> <span class="star"></span> <span class="pl"> <span class="date">Mar  2</span>  <a href="//othercity.craigslist.org/see/vgm/4357055000.html">Xbox One - Day One Edition (BRAND NEW &amp; SEALED)</a> </span> <span class="l2"> <span class="price">&#x0024;500</span>  <span class="pnr"> <small> (Maple Leaf)</small> <span class="px"> <span class="p"> pic&nbsp;<a href="#" class="maptag" data-pid="4357055000">map</a></span></span> </span>  <a class="gc" href="/vgm/" data-cat="vgm">video gaming - by owner</a> </span> </p> </div></body></html>';

		client = new craigslist.Client(options);

		client.request.get = function (options, callback) {
			requestOptions = options;

			if (callback) {
				return callback(null, testMarkup);
			}

			return Promise.resolve(testMarkup);
		};
	});

	describe('#details', function () {
		it('should reject if no posting is specified', function (done) {
			client
				.details()
				.then(() => done(new Error('should reject without posting')))
				.catch((err) => {
					should.exist(err);
					return done();
				});
		});

		it('should reject if posting is object without url property', function (done) {
			client
				.details({ pid : 'test' })
				.then(() => done(new Error('should reject without posting.url')))
				.catch((err) => {
					should.exist(err);
					return done();
				});
		});

		it('should retrieve posting details', function (done) {
			testMarkup = '<html><body><h2 class="postingtitle"><span class="icon icon-star" role="button"><span class="screen-reader-text">favorite this post</span></span><span class="postingtitletext"><span id="titletextonly">2007 Mac Pro Quad 2.66GHz Intel - Excellent Cond</span> - <span class="price">$350</span><small> (Kenmore)</small><span class="js-only banish-unbanish"><span class="banish" role="button"><span class="icon icon-trash" aria-hidden="true"></span><span class="screen-reader-text">hide this posting</span></span><span class="unbanish" role="button"><span class="icon icon-trash red" aria-hidden="true"></span> unhide </span></span></span></h2><section class="userbody"><figure class="iw multiimage"><div class="gallery"><span class="slider-back arrow">&lt;</span><span class="slider-info">image 1 of 4</span><span class="slider-forward arrow">&gt;</span><div class="swipe"><div class="swipe-wrap"><div id="1_image_g7w0QVBEzzg" data-imgid="g7w0QVBEzzg" class="slide first visible"><img src="http://images.craigslist.org/00Y0Y_g7w0QVBEzzg_600x450.jpg" title=" 1" alt=" 1"></div><div id="2_image_8BID4QpHyfR" data-imgid="8BID4QpHyfR" class="slide "></div><div id="3_image_43S0kiOgh8S" data-imgid="43S0kiOgh8S" class="slide "></div><div id="4_image_d2zX5wKCWAZ" data-imgid="d2zX5wKCWAZ" class="slide "></div></div></div></div><div id="thumbs"><a id="1_thumb_g7w0QVBEzzg" class="thumb" data-imgid="g7w0QVBEzzg" href="http://images.craigslist.org/00Y0Y_g7w0QVBEzzg_600x450.jpg" title="1"><img src="http://images.craigslist.org/00Y0Y_g7w0QVBEzzg_50x50c.jpg" class="selected" alt=" 1"></a><a id="2_thumb_8BID4QpHyfR" class="thumb" data-imgid="8BID4QpHyfR" href="http://images.craigslist.org/01010_8BID4QpHyfR_600x450.jpg" title="2"><img src="http://images.craigslist.org/01010_8BID4QpHyfR_50x50c.jpg" alt=" 2"></a><a id="3_thumb_43S0kiOgh8S" class="thumb" data-imgid="43S0kiOgh8S" href="http://images.craigslist.org/00T0T_43S0kiOgh8S_600x450.jpg" title="3"><img src="http://images.craigslist.org/00T0T_43S0kiOgh8S_50x50c.jpg" alt=" 3"></a><a id="4_thumb_d2zX5wKCWAZ" class="thumb" data-imgid="d2zX5wKCWAZ" href="http://images.craigslist.org/00K0K_d2zX5wKCWAZ_600x450.jpg" title="4"><img src="http://images.craigslist.org/00K0K_d2zX5wKCWAZ_50x50c.jpg" alt=" 4"></a></div></figure><div class="mapAndAttrs"><div class="mapbox"><div id="map" class="viewposting" data-latitude="47.747635" data-longitude="-122.255516" data-accuracy="0"></div><p class="mapaddress"><small> (<a target="_blank" href="https://maps.google.com/maps/preview/@47.747635,-122.255516,16z">google map</a>) </small></p></div><p class="attrgroup"><span>condition: <b>excellent</b></span><br><span>make / manufacturer: <b>Apple</b></span><br></p><div class="no-mobile"><aside class="tsb"><ul><li><a href="//www.craigslist.org/about/safety">safety tips</a><li><a href="//www.craigslist.org/about/prohibited">prohibited items</a><li><a href="//www.craigslist.org/about/recalled_items">product recalls</a><li><a href="//www.craigslist.org/about/scams">avoiding scams</a></ul></aside><div id="printcontact"></div><p><div id="qrcode" data-location="http://seattle.craigslist.org/est/sys/5727833301.html"></div></div></div><section id="postingbody"> Excellent condition, not dinged up or scratched. Owned by Macintosh Tech, and it\'s been completely stripped down, and cleaned out. Ready for it\'s new home. This has been used to store files on for the past 6 years. It\'s so clean you can eat from it. :)<br><br> Upgraded 8-Core 2.66GHz Processors, and Apple\'s X1900 XT Graphics Card. <br><br> MacPro Desktop Tower<br> Mac Pro1,1<br> 8-Core (2 x 4-Core) 2.66GHz Intel CPU<br> ATi Radeon X1900 XT Graphics Card<br> 6 GB of Memory <br> 320 GB 7,200 RPM Hard Drive<br> 24X Superdrive<br> Firewire 800<br> USB 2.0<br> Digital I/O<br> Airport WiFi Card<br> Bluetooth Card<br> Lion 10.7.5 with Apple Final Cut Studio 3, Logic Studio 9, Adobe CS5.5, Office 2011. <br><br> Local CASH Sale. Not interested in trades. I will take the post down when it sells. No need to ask. Obvious spam will be ignored. <br><br> Macbook Pro iMac Mac Mini Cinema Display Powermac G4 G5 Music Editing Video Editing Photography<br><br></section><ul class="notices"><li>do NOT contact me with unsolicited services or offers</li></ul><div class="postinginfos"><p class="postinginfo">post id: 5727833301</p><p class="postinginfo reveal">posted: <time class="timeago" datetime="2016-08-11T13:56:29-0700">2016-08-11 1:56pm</time></p><p class="postinginfo"><a href="https://accounts.craigslist.org/eaf?postingID=5727833301&amp;token=U2FsdGVkX180MTQ5NDE0OacYrlghDTplz5h_3fZzjNKaWyfZjVUsPql4VvZAHS39zCfI0KoNTf5Z9Z-oJ6HZMaX6sEIfTKxw" class="tsb">email to friend</a></p><p class="postinginfo"><a class="bestof-link" data-flag="9" href="https://post.craigslist.org/flag?flagCode=9&amp;postingID=5727833301&amp;" title="nominate for best-of-CL"><span class="bestof-icon">&hearts; </span><span class="bestof-text">best of</span></a><sup>[<a href="http://www.craigslist.org/about/best-of-craigslist">?</a>]</sup></p></div></body></html>';
			client.details('test', function (err, details) {
				if (err) {
					return done(err);
				}

				should.exist(details.title);
				should.exist(details.images);
				should.exist(details.description);

				return done();
			});
		});
	});

	describe('#list', function () {
		it('should properly list without options', function (done) {
			client.list(function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);

				done();
			});
		});

		it('should properly list without options (Promise)', function (done) {
			client
				.list()
				.then((data) => {
					should.exist(data);
					should.exist(requestOptions.hostname);

					return done();
				})
				.catch(done);
		});

		it('should properly list and use options to override', function (done) {
			client.list({ city : 'spokane' }, function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.hostname.should.contain('spokane');

				done();
			});
		});

		it('should properly list and use options to override', function (done) {
			client.search({ maxAsk : '200', minAsk: '100' }, function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.hostname.should.contain('seattle');
				requestOptions.path.should.contain('minAsk=100');
				requestOptions.path.should.contain('maxAsk=200');

				done();
			});
		});

		it('should properly parse markup', function (done) {
			client.search({ maxAsk : '200', minAsk: '100' }, function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				data.should.have.length(2);

				data[0].pid.should.have.length.above(1);
				data[0].category.should.have.length.above(1);
				data[0].date.should.have.length.above(1);
				should.exist(data[0].hasPic);
				data[0].location.should.have.length.above(1);
				data[0].price.should.have.length.above(1);
				data[0].title.should.have.length.above(1);
				data[0].url.should.have.length.above(1);

				done();
			});
		});

		it('should properly accept category', function (done) {
			client.list({ category : 'ppa' }, function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				requestOptions.path.should.contain('ppa');

				done();
			});
		});

		// testing fix for #7
		it('should properly allow override of base host', function (done) {
			client
				.list({ baseHost : 'craigslist.ca', city : 'toronto' })
				.then((results) => {
					should.exist(results);
					should.exist(requestOptions);
					should.exist(requestOptions.hostname);
					requestOptions.hostname.should.equal('toronto.craigslist.ca');

					return done();
				})
				.catch(done);
		});

		// testing fix for #6
		it('should properly handle nearby cities', function (done) {
			client
				.list()
				.then((results) => {
					should.exist(results);
					should.exist(results[1]);
					should.exist(results[1].url);
					results[1].url.should.contain('https://othercity.craigslist.org/');

					return done();
				})
				.catch(done);
		});
	});

	describe('#search', function () {
		it('should properly search without options', function (done) {
			client.search('xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.path.should.contain('query=xbox');

				done();
			});
		});

		it('should properly search without options (Promise)', function (done) {
			client
				.search('xbox')
				.then((data) => {
					should.exist(data);
					should.exist(requestOptions.hostname);
					requestOptions.path.should.contain('query=xbox');

					return done();
				})
				.catch(done);
		});

		it('should properly search and use options to override', function (done) {
			client.search({ city : 'spokane' }, 'xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.hostname.should.contain('spokane');
				requestOptions.path.should.contain('query=xbox');

				done();
			});
		});

		it('should properly search and use options to override', function (done) {
			client.search({ maxAsk : '200', minAsk: '100' }, 'xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.hostname.should.contain('seattle');
				requestOptions.path.should.contain('query=xbox');
				requestOptions.path.should.contain('minAsk=100');
				requestOptions.path.should.contain('maxAsk=200');

				done();
			});
		});

		it('should properly parse markup', function (done) {
			client.search({ maxAsk : '200', minAsk: '100' }, 'xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				data.should.have.length(2);

				data[0].pid.should.have.length.above(1);
				data[0].category.should.have.length.above(1);
				data[0].date.should.have.length.above(1);
				should.exist(data[0].hasPic);
				data[0].location.should.have.length.above(1);
				data[0].price.should.have.length.above(1);
				data[0].title.should.have.length.above(1);
				data[0].url.should.have.length.above(1);

				done();
			});
		});

		it('should properly accept category', function (done) {
			client.search({ category : 'ppa' }, 'washer', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				requestOptions.path.should.contain('ppa');

				done();
			});
		});

		// testing fix for #7
		it('should properly allow override of base host', function (done) {
			client
				.search({ baseHost : 'craigslist.ca', city : 'toronto' }, 'washer')
				.then((results) => {
					should.exist(results);
					should.exist(requestOptions);
					should.exist(requestOptions.hostname);
					requestOptions.hostname.should.equal('toronto.craigslist.ca');

					return done();
				})
				.catch(done);
		});

		// testing fix for #6
		it('should properly handle nearby cities', function (done) {
			client
				.search('xbox')
				.then((results) => {
					should.exist(results);
					should.exist(results[1]);
					should.exist(results[1].url);
					results[1].url.should.contain('https://othercity.craigslist.org/');

					return done();
				})
				.catch(done);
		});
	});
});
