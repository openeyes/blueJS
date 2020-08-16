/*
blueJay OE UI JS (JS) - Gulp generates:
- oeblue_js.js
- oeblue_js.min.js
*/

/*
Modules
*/
const bjReady = ['./src/app/_last/ready.js'];  // Ready state loaded last 

const baseModules = [
	'./src/polyfills/*.js',			// to ensure concat order is correct
	'./src/app/app.js',				// load in the app file first
	'./src/app/*.js',				// other app parts, then modules... 
];

const oePlotly = [
	'./src/oePlotly/_oePlotly.js',	// oePlotly moved from newblue
	'./src/oePlotly/*.js',		
	'./src/oePlotly/layouts/*.js',
]

const productionModules = [
	'./src/openeyes/**/*.js',   	// OE distribution modules
]

const idgModules = [
	'./src/idg/**/*.js',	// IDG only modules - NOT for OE (yet)
	'./src/add-select-insert/_init.js',
	'./src/add-select-insert/*.js',
]

const portalModules = [
	'./src/oePortal/**/*.js',   	// OE Portal modules
]

const paths = {
	// builds: for OpenEyes
	js: {	
		input: baseModules.concat( oePlotly, productionModules, bjReady ), // Ready state loaded last 
		output:	'./dist/',
	},
	// builds: for IDG
	idgDev: {
		input: baseModules.concat( oePlotly, productionModules, idgModules, bjReady ),
		output:	'./idg-dev/',
	}, 
	// oe Portal
	portal: {
		input: baseModules.concat( portalModules, bjReady ),
		output:	'./dist-portal/',
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
var buildScripts = function (jsPrefix, input,output) {
	return src(input)
		.pipe(concat(jsPrefix + '.js'))
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

var lintPortal = function (done) {
	// Lint scripts
	return src(paths.portal.input)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));

};


/*
-----------------------------
Task helpers
-----------------------------
*/

/** 
* OpenEyes and IDG development
*/
var cleanDist = function ( done ) {
	// Clean the dist folder
	del.sync([ paths.js.output ]);
	del.sync([ paths.idgDev.output ]);
	// Signal completion
	done();
};

var distJS = function(){
	return buildScripts( 'oeblue_js', paths.js.input, paths.js.output );
};

var idgDevJS = function(){
	return buildScripts( 'oeblue_js', paths.idgDev.input, paths.idgDev.output );
};

var watchJS = function( done ){
	watch(paths.idgDev.input, series(exports.buildJS));
	done();
};

/** 
* OE Portal
*/

var cleanPortal = function ( done ) {
	// Clean the dist folder
	del.sync([ paths.portal.output ]);
	// Signal completion
	done();
};

var portalJS = function(){
	return buildScripts( 'oeportal_js', paths.portal.input, paths.portal.output );
}

var watchPortalJS = function( done ){
	watch(paths.portal.input, series(exports.buildPortalJS));
	done();
}




/*
-----------------------------
Export Tasks
-----------------------------
*/
exports.buildJS = series( lintScripts, distJS, idgDevJS );
exports.buildPortalJS = series( lintPortal, portalJS );

// tasks
exports.portal = series( cleanPortal, exports.buildPortalJS, watchPortalJS);
exports.default = series( cleanDist, exports.buildJS, watchJS );



