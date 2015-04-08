var
	craigslist = requireWithCoverage('index');

describe('unit tests for node-craigslist', function () {
	'use strict';

	var
		client,
		requestOptions,
		testMarkup = '<!DOCTYPE html><html><head></head><body class="toc search"><div class="content"><p class="row" data-pid="4355583965"> <span class="pl"> <time datetime="2015-04-07 23:31" title="Tue 07 Apr 11:31:09 PM (6 hours ago)">Apr 7</time> <a href="/see/vgm/4355583965.html" class="i" data-id="0:00P0P_8hKd1VlQDCd"></span><span class="price">&#x0024;250</span></a> <span class="star"></span> <span class="pl"> <span class="date">Mar  1</span>  <a href="/see/vgm/4355583965.html">NEW &amp; UNSEALED XBOX 360 - 250 GB BLACK FRIDAY BUNDLE  </a> </span> <span class="l2"> <span class="price">&#x0024;250</span>  <span class="pnr"> <small> (renton)</small> <span class="px"> <span class="p"> pic</span></span> </span>  <a class="gc" href="/vgm/" data-cat="vgm">video gaming - by owner</a> </span> </p> <p class="row" data-latitude="47.6889961595583" data-longitude="-122.321962887269" data-pid="4357055000"> <a href="/see/vgm/4357055000.html" class="i" data-id="0:00d0d_hYKRHRR9Pse"><span class="price">&#x0024;500</span></a> <span class="star"></span> <span class="pl"> <span class="date">Mar  2</span>  <a href="/see/vgm/4357055000.html">Xbox One - Day One Edition (BRAND NEW &amp; SEALED)</a> </span> <span class="l2"> <span class="price">&#x0024;500</span>  <span class="pnr"> <small> (Maple Leaf)</small> <span class="px"> <span class="p"> pic&nbsp;<a href="#" class="maptag" data-pid="4357055000">map</a></span></span> </span>  <a class="gc" href="/vgm/" data-cat="vgm">video gaming - by owner</a> </span> </p> </div></body></html>';

	beforeEach(function () {
		client = craigslist.initialize({
				city : 'seattle'
			});

		client.request.get = function (options, callback) {
			requestOptions = options;
			return callback(null, testMarkup);
		};
	});

	describe('#search', function () {
		it('should properly search without options', function (done) {
			client.search('xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.path.should.contain('query=xbox');

				done();
			});
		});

		it('should properly search and use options to override', function (done) {
			client.search({ city : 'spokane' }, 'xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);
				should.exist(requestOptions.hostname);
				requestOptions.hostname.should.contain('spokane');
				requestOptions.path.should.contain('query=xbox');

				done();
			});
		});

		it('should properly search and use options to override', function (done) {
			client.search({ maxAsk : '200', minAsk: '100' }, 'xbox', function (err, data) {
				should.not.exist(err);
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
				should.not.exist(err);
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
	});

});
