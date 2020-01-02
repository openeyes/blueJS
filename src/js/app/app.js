/**
OE3 JS layer to handle UI interactions.
Tooltips, popups, etc. 
Using bluejay on IDG for namespace (easy to replace)
@namespace
*/
const bluejay = (function () {

	'use strict';

	const methods = {}; 	// Create a public methods object
	const debug = true;		// Out debug to console
	let extendID = 1;		// Method IDs

	/**
	* Extend the public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	methods.extend = function (name, fn) {
		// only extend if not already been added
		if(!fn.id){
			bluejay.log('extending app: '+name);
			fn.id = extendID++;
			methods[name] = fn;
			return true;
		} else {
			// method already added!
			bluejay.log('Err: Can not extend again: "' + name + '"');
			return false;
		}
	};
	
	/**
	* Log to console, if debug is true
	* @param {String} msg - message to log
	*/
	methods.log = function (msg) {
		if(debug){
			console.log('[bluejay] ' + msg);
		}
	};
	
	// Return public methods object
	return methods;

})();