/*
blueJS OE UI JS (JS) - Gulp generates:
- blueJS.min.js
- blueJS.idg.js	// read-able + de-bugging 
*/

const config = {
	jsPrefix:	'oe3_ui_js',
}

const paths = {
	js: {	
		input:	[	'./src/polyfills/*.js',		// to ensure concat order is correct
					'./src/app/app.js',			// load in the app file first
					'./src/app/*.js',			// then... 
					'./src/ui/*.js',			// all the other stuff
					'./src/events/*.js'],		// finally the events listeners
		output:	'./dist/',
	},
	reload:		'./dist/'
};

/*
Packages
*/
const {gulp, src, dest, watch, series, parallel} = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const header = require('gulp-header');

// JS
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const concat = require('gulp-concat');
const uglify = require('gulp-terser');
const optimizejs = require('gulp-optimize-js');

/*
-----------------------------
Process and JS files
-----------------------------
*/

// Lint, minify, and concatenate scripts
var buildScripts = function (done) {
	return src(paths.js.input)
		.pipe(concat(config.jsPrefix + '.js'))
		.pipe(optimizejs())
		.pipe(dest(paths.js.output))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(optimizejs())
		.pipe(dest(paths.js.output));

};

// Lint scripts
var lintScripts = function (done) {
	// Lint scripts
	return src(paths.js.input)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));

};


/*
-----------------------------
Task helpers
-----------------------------
*/
var cleanDist = function (done) {
	// Clean the dist folder
	del.sync([ paths.js.output ]);
	// Signal completion
	done();
};


var watchJS = function(done){
	watch(paths.js.input, series(exports.buildJS));
	done();
}

/*
-----------------------------
Export Tasks
-----------------------------
*/
exports.buildJS = parallel(buildScripts,lintScripts);

exports.default = series(
	cleanDist,
	exports.buildJS,
	watchJS
);
