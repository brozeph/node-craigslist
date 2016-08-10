'use strict';

var
	babel = require('gulp-babel'),
	coveralls = require('gulp-coveralls'),
	del = require('del'),
	eslint = require('gulp-eslint'),
	gulp = require('gulp'),
	gulpUtil = require('gulp-util'),
	istanbul = require('gulp-istanbul'),
	mocha = require('gulp-mocha'),
	sourcemaps = require('gulp-sourcemaps');


gulp.task('build', ['clean'], () => {
		return gulp
			.src('src/**/*.js')
			.pipe(sourcemaps.init())
			.pipe(babel({
				presets : ['es2015', 'stage-0']
			}))
			.pipe(sourcemaps.write('.'))
			.pipe(gulp.dest('dist'));
	});


gulp.task('clean', function (callback) {
	return del(['dist', 'reports'], callback);
});


gulp.task('coveralls', ['test-coverage'], function () {
	return gulp
		.src('reports/lcov.info')
		.pipe(coveralls());
});


gulp.task('lint', function () {
	return gulp
		.src(['**/*.js', '!dist/**', '!node_modules/**', '!reports/**'])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failAfterError());
});


gulp.task('test-coverage', ['build'], function () {
	return gulp
		.src(['./dist/**/*.js'])
		.pipe(istanbul())
		.pipe(istanbul.hookRequire())
		.on('finish', function () {
			gulp
				.src(['./test/lib/**/*.js'])
				.pipe(mocha({ reporter : 'spec' })
						.on('error', function (err) {
							if (err.showStack) {
								gulpUtil.log(err);
							}

							/*eslint no-invalid-this:0*/
							this.emit('end');
						}))
				.pipe(istanbul.writeReports('./reports'));
		});
});


gulp.task('test-integration', ['build'], function () {
	return gulp
		.src(['./test/integration/**/*.js'], { read : false })
		.pipe(mocha({
			checkLeaks : false,
			reporter : 'spec',
			ui : 'bdd'
		}));
});


gulp.task('test-unit', ['build'], function () {
	return gulp
		.src(['./test/lib/**/*.js'], { read : false })
		.pipe(mocha({
			checkLeaks : true,
			reporter : 'spec',
			ui : 'bdd'
		}));
});
