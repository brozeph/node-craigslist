/* eslint no-magic-numbers : 0 */
/* eslint no-unused-expressions : 0 */

import chai from 'chai';
import craigslist from '../../src';

const should = chai.should();

describe('functional tests for node-craigslist', function () {
	let
		client,
		examplePosting,
		exampleURL;

	/* eslint no-invalid-this : 0 */
	this.timeout(10000);

	beforeEach(function () {
		client = new craigslist.Client({
			city : 'seattle'
		});

		/*
		client.request.on('redirect', (state) => {
			console.log('REDIRECT:');
			console.log(state);
			console.log();
		});

		client.request.on('request', (state) => {
			console.log('REQUEST:');
			console.log(state);
			console.log();
		});

		client.request.on('response', (state) => (state) => {
			console.log('RESPONSE:');
			console.log(state);
			console.log();
		});
		//*/
	});

	describe('#search', function () {
		it('should properly search without options', function (done) {
			client.search('xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);

				exampleURL = data[0].url;

				return done();
			});
		});

		it('should properly search with options', function (done) {
			client.search({ city : 'spokane' }, 'xbox', function (err, data) {
				if (err) {
					return done(err);
				}

				should.exist(data);

				return done();
			});
		});

		it('should properly search with minPrice and maxPrice (Promise)', function (done) {
			client
				.search({ maxPrice : '200', minPrice : '100' }, 'xbox')
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
						baseHost : 'craigslist.ca',
						city : 'montreal'
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
