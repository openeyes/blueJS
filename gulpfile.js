/*
blueJS OE UI JS (JS) - Gulp generates:
- blueJS.min.js
- blueJS.idg.js	// read-able + de-bugging 
*/

const config = {
	jsPrefix:	'oeblue_js',
}

const paths = {
	js: {	
		input:	[	'./src/polyfills/*.js',		// to ensure concat order is correct
					'./src/app/app.js',			// load in the app file first
					'./src/app/*.js',			// app bits, then... 
					'./src/ui/**/*.js'],		// UI modules
		output:	'./dist/',
	},
	idgDev: {
		input:	[	'./src/polyfills/*.js',		// to ensure concat order is correct
					'./src/app/app.js',			// load in the app file first
					'./src/app/*.js',			// app bits, then... 
					'./src/ui/**/*.js',			// UI Modules
					'./src/idg-dev/*.js'],		// *** IDG Developement modules - extra development modules
		output:	'./idg-dev/',
	}
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
var buildScripts = function (input,output) {
	return src(input)
		.pipe(concat(config.jsPrefix + '.js'))
		.pipe(optimizejs())
		.pipe(dest(output))
		.pipe(rename({suffix: '.min'}))
		.pipe(uglify())
		.pipe(optimizejs())
		.pipe(dest(output));

};

// Lint scripts
var lintScripts = function (done) {
	// Lint scripts
	return src(paths.idgDev.input)
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
	del.sync([ paths.idgDev.output ]);
	// Signal completion
	done();
};

var distJS = function(){
	return buildScripts(	paths.js.input,
							paths.js.output );
};

var idgDevJS = function(){
	return buildScripts(	paths.idgDev.input,
							paths.idgDev.output );
};

var watchJS = function(done){
	watch(paths.idgDev.input, series(exports.buildJS));
	done();
};

/*
-----------------------------
Export Tasks
-----------------------------
*/
exports.buildJS = series(lintScripts,distJS,idgDevJS);

exports.default = series(
	cleanDist,
	exports.buildJS,
	watchJS
);
