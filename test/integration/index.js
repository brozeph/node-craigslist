/*eslint no-magic-numbers:0*/
/*eslint no-unused-expressions:0*/
var
	chai = require('chai'),

	craigslist = require('../../dist/index.js'),

	should = chai.should();


describe('functional tests for node-craigslist', function () {
	'use strict';

	var client;

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
					baseHost : 'craigslist.ca'},
					'xbox')
				.then((data) => {
					should.exist(data);

					done();
				})
				.catch(done);
		});
	});

});
