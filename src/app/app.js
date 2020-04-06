/**
* OE3 JS layer to handle UI interactions.
* Tooltips, popups, etc. 
* Using "bluejay" for namespace
* @namespace
*/
const bluejay = (function () {

	'use strict';

	console.time('[blue] Ready'); // endTime called by './_last/ready.js' the last JS concatenated by Gulp
	console.time('[blue] DOM Loaded'); // this is called by "DOMContentLoaded" event (to watch out for scripts that are slowing things down)

	const debug = true;		// Output debug '[blue]' to console
	const methods = {}; 	// Create a public methods object 
	let extendID = 1;		// Method IDs

	/**
	* Extend the public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	methods.extend = (name, fn) => {
		/*
		only extend if not already added 
		and if the name is available
		*/
		if(!fn._app && !(name in methods)){
			// ok, extend		
			fn._app = extendID++;
			methods[name] = fn;
			return true;
		} else {
			// method already added!
			bluejay.log('** Err: Can not extend again: "' + name + '"');
			return false;
		}
	};
	
	/**
	* Log to console, if debug is true
	* @param {String} msg - message to log
	*/
	methods.log = function (msg) {
		if(debug){
			console.log('[blue] ' + msg);
		}
	};
	
	/**
	* Provide set up feedback whilst debugging
	*/
	if(debug){
		methods.log('OE JS UI layer... starting');
		methods.log('DEBUG MODE');
		document.addEventListener('DOMContentLoaded', () => {
			// list API methods 
			let apiMethods = [];
			for(const name in methods)	apiMethods.push(name); 
			methods.log('[API] [Helper Methods] ' + apiMethods.join(', '));
			console.timeEnd('[blue] DOM Loaded');
		},{once:true});
	}

	// Return public methods object
	return methods;

})();