var
	craigslist = requireWithCoverage('index');

describe('functional tests for node-craigslist', function () {
	'use strict';

	this.timeout(25000);

	var client;

	beforeEach(function () {
		client = craigslist({
				city : 'seattle'
			});

		/*
		client.request.on('request', function (options) {
			console.log(options);
		});
		//*/
	});

	describe('#search', function () {
		it('should properly search without options', function (done) {
			client.search('xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);

				done();
			});
		});
	});

	describe('#search', function () {
		it('should properly search with options', function (done) {
			client.search({ city : 'spokane' }, 'xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);

				done();
			});
		});
	});

	describe('#search', function () {
		it('should properly search with minAsk and maxAsk', function (done) {
			client.search({ maxAsk : '200', minAsk : '100' }, 'xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);

				done();
			});
		});
	});

});