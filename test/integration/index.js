/*eslint no-magic-numbers:0*/
/*eslint no-unused-expressions:0*/
var
	chai = require('chai'),

	craigslist = require('../../dist/index.js'),

	should = chai.should();


describe('functional tests for node-craigslist', function () {
	'use strict';

	var
		client,
		examplePosting,
		exampleURL;

	/*eslint no-invalid-this:0*/
	this.timeout(10000);

	beforeEach(function () {
		client = new craigslist.Client({
			city : 'seattle'
		});
	});

	describe('#search', function () {
		it('should properly search without options', function (done) {
			client.search('xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);

				exampleURL = data[0].url;

				done();
			});
		});

		it('should properly search with options', function (done) {
			client.search({ city : 'spokane' }, 'xbox', function (err, data) {
				should.not.exist(err);
				should.exist(data);

				done();
			});
		});

		it('should properly search with minAsk and maxAsk (Promise)', function (done) {
			client
				.search({ maxAsk : '200', minAsk : '100' }, 'xbox')
				.then((data) => {
					should.exist(data);
					should.exist(data[0]);
					should.exist(data[0].title);
					/xbox/i.test(data[0].title).should.be.true;

					return done();
				})
				.catch(done);
		});

		// integration test for #7
		it('should properly search another country', function (done) {
			client
				.search({
						city : 'montreal',
						baseHost : 'craigslist.ca'
					},
					'xbox')
				.then((data) => {
					should.exist(data);
					should.exist(data[0]);

					examplePosting = data[0];

					done();
				})
				.catch(done);
		});

		// integration test for #17
		it('should properly search another country when baseHost is not specified', function (done) {
			client
				.search({
						city : 'vancouver'
					},
					'xbox')
				.then((data) => {
					should.exist(data);
					should.exist(data[0]);

					done();
				})
				.catch(done);
		});
	});

	describe('#details', function () {
		it('should properly get posting details with URL', function (done) {
			let url = exampleURL;

			client.details(url, function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);
				should.exist(data.title);
				should.exist(data.pid);

				return done();
			});
		});

		it('should properly get posting details with posting (Promise)', function (done) {
			client
				.details(examplePosting)
				.then((data) => {
					should.exist(data);
					should.exist(data.title);
					should.exist(data.pid);

					return done();
				})
				.catch(done);
		});
	});
});
