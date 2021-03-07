/**
BlueJS (bluejay) builds the following JS for production distribution

dist -|- oe -|- oe-bluejay.min.js
      |      |- oe-bluejay.js
      |
      |- openERS -|- bj-openers.min.js
                  |- bj-openers.js
 
 
It also creates JS for IDG, for testing and developement
IDG contains ALL JS modules (production, UX demos and in development)

idg-dev -|- idg-bluejay.min.js
         |- idg-openers.min.js
    
*/

/*
Modules
*/
const modules = {
	base: [
		'./src/polyfills/*.js',			// to ensure concat order is correct
		'./src/app/app.js',				// load in the app file first
		'./src/app/*.js',				// other app parts, then modules... 
	],
	// OpenEyes
	oe: {
		build: './src/build/**/*.js', // OE distribution modules
		idg: [
			'./src/idg_ux_demo/add-select-insert/_init.js', // this needs rebuilding but for now make sure this loads first
			'./src/idg_ui/**/*.js', // ready for build
			'./src/idg_ux_demo/**/*.js', // UX demos
			'./src/idg_dirty/*.js',	// quick and dirty demos
		]
	},
	// openERS 
	ers: {
		build: './src/openERS/build/*.js', // OE Portal modules
		idg: './src/openERS/idg/*.js'
	},
	// oePlot 
	oePlot:  [
		'./src/oePlot/_oePlot.js',		
		'./src/oePlot/*.js',		
		'./src/oePlot/layouts/*.js',
	]	
	  
}

// Ready state loaded last
const bjReady = ['./src/app/_last/ready.js'] 

/*
Paths
*/
const paths = {
	// OpenEyes
	oe: {	
		input: modules.base.concat( modules.oePlot, modules.oe.build, bjReady ), 
		output:	'./dist/oe/',
		prefix: 'oe-bluejay'
	},
	// openERS
	ers: {
		input: modules.base.concat( modules.ers.build, bjReady ),
		output:	'./dist/openERS/',
		prefix: 'bj-openers'
	},
	
	// builds: for IDG, all Modules
	idg: {
		oe: {
			input: modules.base.concat( modules.oePlot, modules.oe.build, modules.oe.idg, bjReady ),
			output:	'./idg-dev/oe/',
			prefix: 'oe-bluejay'
		}, 
		ers: {
			input: modules.base.concat( modules.ers.build, modules.ers.idg, bjReady ),
			output:	'./idg-dev/openERS/',
			prefix: 'bj-openers'
		}	
	}, 
};

/*
Packages
*/
const { gulp, src, dest, watch, series, parallel } = require('gulp');
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
const buildScripts = ({ prefix, input, output }) => {
	return src( input )
		.pipe(concat( prefix + '.js'))
		.pipe(optimizejs())
		.pipe(dest( output ))
		.pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
		.pipe(optimizejs())
		.pipe(dest( output ));

};

// Lint scripts
const lintScripts = ( path ) => {
	// Lint scripts
	return src( path )
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));

};

/*
-----------------------------
OpenEyes
-----------------------------
*/
const oe_clean = ( done ) => {
	del.sync([ paths.oe.output ]);
	del.sync([ paths.idg.oe.output ]);
	done();
}

const oe_lint = () => lintScripts( paths.idg.oe.input );
const oe_build_idg = () => buildScripts( paths.idg.oe );
const oe_build_dist = () => buildScripts( paths.oe );

const watch_oe = ( done ) => {
	watch( paths.idg.oe.input, series( oe_lint, oe_build_idg, oe_build_dist ));
	done();
};

/*
-----------------------------
openERS - (was portal)
-----------------------------
*/
const ers_clean = ( done ) => {
	del.sync([ paths.ers.output ]);
	del.sync([ paths.idg.ers.output ]);
	done();
}

const ers_lint = () => lintScripts( paths.idg.ers.input );
const ers_build_idg = () => buildScripts( paths.idg.ers);
const ers_build_dist = () => buildScripts( paths.ers );

const watch_ers = ( done ) => {
	watch( paths.idg.ers.input, series( ers_lint, ers_build_idg, ers_build_dist ));
	done();
};

/*
-----------------------------
Export Tasks
-----------------------------
*/
// turned off cleaning for openers because it was wiping IDG file for Mike (see down!)
exports.openers = series( series( ers_lint, ers_build_idg, ers_build_dist ), watch_ers );
exports.default = series( oe_clean, series( oe_lint, oe_build_idg, oe_build_dist ), watch_oe );

/*
-----------------------------
IDG UI for OpenERS skin of OpenEyes
This is for the quick demo. Provide
a cut down version of IDG for openERS
skin job...
-----------------------------
*/
exports.openersIDG = () => buildScripts({ 
	prefix: 'bj-oe-idg-ui',
	input:  modules.base.concat( modules.oe.build, [
		'./src/idg_ui/**/*.js', // ready for build
		'./src/idg_ux_demo/**/*.js', // UX demos
	], bjReady ),
	output: paths.ers.output,
});


