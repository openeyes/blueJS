/**
BlueJS (bluejay) 
Builds the following JS for production distribution

-----------------------
* OpenEyes JS UI layer:
./dist -|- oe -|- oe-bluejay.min.js
               |- oe-bluejay.js
  
----------------------------------             
* OpenERS JS UI layer (into Bloom)
../bloom -|- dist -|- js -|- bloomjay.min.js
                          |- bloomjay.js

----------------------------------
* iDG also runs off all blueJS but it needs ALL modules
./idg-dev -|- idg-bluejay.min.js
    
*/

/*
Modules
*/
const modules = {
	base: [
		'./src/polyfills/*.js', // to ensure concat order is correct
		'./src/app/app.js', // load in the app file first
		'./src/app/*.js', // other app parts, then modules... 
	],
	
	// OpenEyes, for dist and iDG
	oe: {
		build: './src/build/**/*.js', // OE distribution modules (note: included in iDG build)
		idg: [
			'./src/idg_ux_demo/add-select-insert/_init.js', // this needs rebuilding but for now make sure this loads first
			'./src/idg_ui/**/*.js', // ready for build
			'./src/idg_ux_demo/**/*.js', // UX demos
			'./src/idg_dirty/*.js',	// quick and dirty demos
		]
	},
	
	// oePlot (plotly abstract)
	oePlot:  [
		'./src/oePlot/_oePlot.js',		
		'./src/oePlot/*.js',		
		'./src/oePlot/layouts/*.js',
	],
	
	// openERS - for Bloom
	ers: {
		build: './src/openERS/**/*.js', // OpenERS (bloom JS UI layer)
	}	  
}

// Ready state always loaded last
const bjReady = ['./src/app/_last/ready.js'] 

/*
Paths
*/
const paths = {
	// OpenEyes
	oe: {	
		input: modules.base.concat( modules.oePlot, modules.oe.build, bjReady ), 
		output:	'./dist/',
		prefix: 'oe-bluejay'
	},
	// builds: for IDG, all Modules
	idg: {
		input: modules.base.concat( modules.oePlot, modules.oe.build, modules.oe.idg, bjReady ),
		output:	'./idg-dev/',
		prefix: 'idg-bluejay'	
	}, 
	// openERS
	// output into bloom!
	ers: {
		input: modules.base.concat( modules.ers.build, bjReady ),
		output:	'../bloom/dist/js/', 
		prefix: 'bloomjay'
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
	del.sync([ paths.idg.output ]);
	done();
}

const oe_lint = () => lintScripts( paths.idg.input );
const oe_build_idg = () => buildScripts( paths.idg );
const oe_build_dist = () => buildScripts( paths.oe );

const watch_oe = ( done ) => {
	watch( paths.idg.input, series( oe_lint, oe_build_idg, oe_build_dist ));
	done();
};

/*
-----------------------------
openERS - (was portal)
-----------------------------
*/
const ers_lint = () => lintScripts( paths.ers.input );
const ers_build_dist = () => buildScripts( paths.ers );

const watch_ers = ( done ) => {
	watch( paths.ers.input, series( ers_lint, ers_build_dist ));
	done();
};

/*
-----------------------------
Export Tasks
-----------------------------
*/
// turned off cleaning for openers because it was wiping IDG file for Mike (see down!)
exports.bloom = series( series( ers_lint, ers_build_dist ), watch_ers );
exports.default = series( oe_clean, series( oe_lint, oe_build_idg, oe_build_dist ), watch_oe );




