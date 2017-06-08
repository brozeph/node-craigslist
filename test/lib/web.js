/*eslint no-magic-numbers:0*/
var
	chai = require('chai'),
	nock = require('nock'),

	requestLib = require('../../dist/web'),

	should = chai.should();


describe('unit tests for request', () => {
	'use strict';

	var
		options,
		request;

	afterEach(() => {
		nock.cleanAll();
	});

	beforeEach(() => {
		options = {
			host : 'test.brozeph.com',
			path : '/',
			secure : true
		};

		request = new requestLib.Request();
	});

	describe('#getRequestOptions', () => {
		it('should default timeout', (done) => {
			options = request.getRequestOptions({});

			should.exist(options);
			should.exist(options.timeout);

			process.nextTick(done);
		});

		it('should set default options when input options are missing', (done) => {
			request = new requestLib.Request({ secure : true });
			options = request.getRequestOptions({});

			should.exist(options);
			should.exist(options.secure);

			process.nextTick(done);
		});

		it('should override default options when input options are set', (done) => {
			request = new requestLib.Request({ secure : true });
			options = request.getRequestOptions({ secure : false });

			should.exist(options);
			should.exist(options.secure);

			process.nextTick(done);
		});
	});

	describe('#get', () => {
		it('should set method to GET', (done) => {
			nock(`https://${options.host}`)
				.get(options.path)
				.reply(200);

			let requestOptions;

			request.on('request', (o) => (requestOptions = o));

			request.get(options, (err) => {
				should.not.exist(err);
				should.exist(requestOptions);
				requestOptions.method.should.equal('GET');

				return done();
			});
		});

		it('should obey timeout', (done) => {
			nock(`https://${options.host}`)
				.get(options.path)
				.socketDelay(2000)
				.reply(200, { testing : true });

			options.maxRetries = 0;
			options.timeout = 500;

			request.get(options, function (err, data) {
				should.exist(err);
				should.not.exist(data);
				should.exist(err.code);
				err.code.should.equal('ECONNRESET');

				return done();
			});
		});

		it('should return data', (done) => {
			nock(`https://${options.host}`)
				.get(options.path)
				.reply(200, { data : true });

			request.get(options, function (err, data) {
				should.not.exist(err);
				should.exist(data);

				return done();
			});
		});

		it('should return error on 404', (done) => {
			nock(`https://${options.host}`)
				.get(options.path)
				.reply(404);

			request.get(options, function (err) {
				should.exist(err);
				should.exist(err.context);
				should.exist(err.context.statusCode);
				err.context.statusCode.should.equal(404);

				return done();
			});
		});

		it('should properly apply proxy settings', (done) => {
			options.path = '/full/path/test';
			options.proxy = 'https://proxy.brozeph.com';

			nock(options.proxy)
				.get(/[.]*/gi)
				.reply(200);

			let requestOptions;

			request.on('request', (o) => (requestOptions = o));

			request.get(options, function (err) {
				should.not.exist(err);
				should.exist(requestOptions);
				requestOptions.host.should.contain('proxy.brozeph.com');
				requestOptions.path.should.include('test.brozeph.com/full/path/test');
				should.exist(requestOptions.headers.Host);
				requestOptions.headers.Host.should.equal('test.brozeph.com');

				return done();
			});
		});

		it('should properly apply proxy settings with port', (done) => {
			options.path = '/full/path/test';
			options.proxy = 'http://proxy.brozeph.com:8080';

			nock(options.proxy)
				.get(/[.]*/gi)
				.reply(200);

			let requestOptions;

			request.on('request', (o) => (requestOptions = o));

			request.get(options, function (err) {
				should.not.exist(err);
				should.exist(requestOptions);
				requestOptions.host.should.contain('proxy.brozeph.com');
				requestOptions.path.should.include('test.brozeph.com/full/path/test');
				should.exist(requestOptions.headers.Host);
				requestOptions.headers.Host.should.equal('test.brozeph.com');
				Number(requestOptions.port).should.equal(8080);

				return done();
			});
		});
	});
});
