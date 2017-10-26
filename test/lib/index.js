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

		testMarkup = '<!DOCTYPE html><html><head></head><bosy class="search en desktop w1024 grid"><div class="content" id="sortable-results"><ul class="rows"><li class="result-row" data-pid="5854157194"><a href="/skc/vgm/5854157194.html" class="result-image gallery" data-ids="1:00606_fVtBBKvKhVs,1:01111_3svaqLUEItO,1:00P0P_8pvX9wKAFa0,1:00C0C_T8IufGFDPX"><div class="swipe" style="visibility: visible;"><div class="swipe-wrap" style="width: 1200px;"><div data-index="0" style="width: 300px; left: 0px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(0px, 0px);"><img alt="" class="" src="https://images.craigslist.org/00606_fVtBBKvKhVs_300x300.jpg"></div><div data-index="1" style="width: 300px; left: -300px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="2" style="width: 300px; left: -600px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="3" style="width: 300px; left: -900px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(-300px, 0px);"></div></div></div><div class="slider-info">image 1 of 4</div><div class="slider-back arrow">&lt;</div><div class="slider-forward arrow">&gt;</div></a><p class="result-info"><span class="icon icon-star" role="button" title="save this post in your favorites list"><span class="screen-reader-text">favorite this post</span></span><time class="result-date" datetime="2016-11-07 07:17" title="Mon 07 Nov 07:17:45 AM">Nov7</time><a href="/skc/vgm/5854157194.html" data-id="5854157194" class="result-title hdrlnk">Original XBox Console (Parts Only) with Games and Controllers</a><span class="result-meta"><span class="result-price">$50</span><span class="result-hood"> (Kent)</span><span class="result-tags">pic<span class="maptag" data-pid="5854157194">map</span></span><span class="banish icon icon-trash" role="button"><span class="screen-reader-text">hide this posting</span></span><span class="unbanish icon icon-trash red" role="button" aria-hidden="true"></span><a href="#" class="restore-link"><span class="restore-narrow-text">restore</span><span class="restore-wide-text">restore this posting</span></a></span></p></li><li class="result-row" data-pid="5864805989" data-repost-of="5629475186"><a href="/sno/for/5864805989.html" class="result-image gallery" data-ids="1:00U0U_8lYpby8dfuQ,1:00K0K_lMWraJin7UP,1:01212_jCSXqTJYdAY,1:00p0p_2yZma4AeUPe,1:00p0p_4a2r0yFy3Fd,1:00a0a_83dEsTxklv1,1:00f0f_arGkw8QriLB,1:00r0r_fFmK3eaxz28,1:00C0C_boTeH7feZ3S"><div class="swipe" style="visibility: visible;"><div class="swipe-wrap" style="width: 2700px;"><div data-index="0" style="width: 300px; left: 0px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(0px, 0px);"><img alt="" class="" src="https://images.craigslist.org/00U0U_8lYpby8dfuQ_300x300.jpg"></div><div data-index="1" style="width: 300px; left: -300px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="2" style="width: 300px; left: -600px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="3" style="width: 300px; left: -900px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="4" style="width: 300px; left: -1200px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="5" style="width: 300px; left: -1500px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="6" style="width: 300px; left: -1800px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="7" style="width: 300px; left: -2100px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(300px, 0px);"></div><div data-index="8" style="width: 300px; left: -2400px; transition-duration: 0ms; -webkit-transition-duration: 0ms; transform: translate(-300px, 0px);"></div></div></div><div class="slider-info">image 1 of 9</div><div class="slider-back arrow">&lt;</div><div class="slider-forward arrow">&gt;</div></a><p class="result-info"><span class="icon icon-star" role="button" title="save this post in your favorites list"><span class="screen-reader-text">favorite this post</span></span><time class="result-date" datetime="2016-11-06 21:31" title="Sun 06 Nov 09:31:13 PM">Nov6</time><a href="/sno/for/5864805989.html" data-id="5864805989" class="result-title hdrlnk">**Xbox 360 Kinect w 2 games bundle New In Box plus more</a><span class="result-meta"><span class="result-price">$250</span><span class="result-hood"> (Everett)</span><span class="result-tags">pic<span class="maptag" data-pid="5864805989">map</span></span><span class="banish icon icon-trash" role="button"><span class="screen-reader-text">hide this posting</span></span><span class="unbanish icon icon-trash red" role="button" aria-hidden="true"></span><a href="#" class="restore-link"><span class="restore-narrow-text">restore</span><span class="restore-wide-text">restore this posting</span></a></span></p></li></ul></div></body></html>';

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
				should.exist(details.attributes);

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

				data[0].pid.should.have.length.above(1, 'pid');
				data[0].category.should.have.length.above(1, 'category');
				data[0].date.should.have.length.above(1, 'date');
				should.exist(data[0].hasPic, 'hasPic');
				// fix for #11 - location is removed :(
				//data[0].location.should.have.length.above(1, 'location');
				data[0].price.should.have.length.above(1, 'price');
				data[0].title.should.have.length.above(1, 'title');
				data[0].url.should.have.length.above(1, 'url');

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

					should.exist(results[0]);
					should.exist(results[0].url);
					results[0].url.should.contain('https://seattle.craigslist.org/skc');

					should.exist(results[1]);
					should.exist(results[1].url);
					results[1].url.should.contain('https://seattle.craigslist.org/sno');

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

		it('should properly search and use query', function (done) {
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
			client.search({
					bundleDuplicates : true,
					hasPic : true,
					maxAsk : '200',
					minAsk : '100',
					offset: 120,
					postal : '12345',
					searchDistance : 100,
					searchNearby : true,
					searchTitlesOnly : true
				},
				'xbox',
				function (err, data) {
					if (err) {
						return done(err);
					}

					should.exist(data);
					should.exist(requestOptions.hostname);
					requestOptions.hostname.should.contain('seattle');
					requestOptions.path.should.contain('query=xbox');
					requestOptions.path.should.contain('bundleDuplicates=1');
					requestOptions.path.should.contain('hasPic=1');
					requestOptions.path.should.contain('minAsk=100');
					requestOptions.path.should.contain('maxAsk=200');
					requestOptions.path.should.contain('s=120');
					requestOptions.path.should.contain('postal=12345');
					requestOptions.path.should.contain('search_distance=100');
					requestOptions.path.should.contain('searchNearby=1');
					requestOptions.path.should.contain('srchType=T');

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

				data[0].pid.should.have.length.above(1, 'pid');
				data[0].category.should.have.length.above(1, 'category');
				data[0].date.should.have.length.above(1, 'date');
				should.exist(data[0].hasPic, 'hasPic');
				data[0].price.should.have.length.above(1, 'price');
				data[0].title.should.have.length.above(1, 'title');
				data[0].url.should.have.length.above(1, 'url');

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

					should.exist(results[0]);
					should.exist(results[0].url);
					results[0].url.should.contain('https://seattle.craigslist.org/skc');

					should.exist(results[1]);
					should.exist(results[1].url);
					results[1].url.should.contain('https://seattle.craigslist.org/sno');

					return done();
				})
				.catch(done);
		});
	});
});
