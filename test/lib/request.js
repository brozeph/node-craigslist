var
	requestLib = requireWithCoverage('request');

describe('unit tests for request', function () {
	'use strict';

	this.timeout(25000);

	var request;

	beforeEach(function () {
		request = requestLib.initialize();
	});

	describe('#getRequestOptions', function () {
		it('should default timeout', function (done) {
			var options = request.getRequestOptions({});

			should.exist(options);
			should.exist(options.timeout);

			process.nextTick(done);
		});

		it('should set default options when input options are missing', function (done) {
			request = requestLib.initialize({ secure : true });
			var options = request.getRequestOptions({});

			should.exist(options);
			should.exist(options.secure);

			process.nextTick(done);
		});

		it('should override default options when input options are set', function (done) {
			request = requestLib.initialize({ secure : true });
			var options = request.getRequestOptions({ secure : false });

			should.exist(options);
			should.exist(options.secure);

			process.nextTick(done);
		});
	});

	describe('#get', function () {
		it('should set method to GET', function (done) {
			var options;

			request.on('request', function (requestOptions) {
				options = requestOptions;
			});

			request.get({}, function (err, data) {
				should.exist(options);
				options.method.should.equal('GET');

				done();
			});
		});

		it('should obey timeout', function (done) {
			request.get({ timeout : 1, hostname : 'github.com', path : '/brozeph/node-craigslist' }, function (err, data) {
				should.exist(err);
				should.exist(err.code);
				err.code.should.equal('ECONNRESET');

				done();
			});
		});

		it('should return data', function (done) {
			request.get({ hostname : 'github.com', path : '/brozeph/node-craigslist' }, function (err, data) {
				should.not.exist(err);
				should.exist(data);

				done();
			});
		});

		it('should return error on 404', function (done) {
			request.get({ secure: true, hostname : 'github.com', path : '/brozeph/node-craigslist-nope' }, function (err, data) {
				should.exist(err);
				should.exist(err.statusCode);
				err.statusCode.should.equal(404);

				done();
			});
		});
	});

});
