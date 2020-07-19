/**
* OE3 JS to handle DOM UI.
* Using "bluejay" as namespace
* @namespace
*/
const bluejay = (function () {

	'use strict';
	/*
	Set up some performance timers
	"Ready": called by './_last/ready.js' the last JS file concatenated by Gulp
	"DOM Loaded": called by "DOMContentLoaded" event (watching out for other scripts that are slowing things down)
	*/
	console.time('[blue] Ready');
	console.time('[blue] DOM Loaded');
	

	const debug = true;		// Output debug '[blue]' to console
	const api = {};			// API for bluejay

	/**
	* Extend bluejay public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	api.extend = (name, fn) => {
		
		if(typeof fn !== "function"){
			throw new TypeError('[bluejay] [app.js] - only extend with a function: ' + name); 
		}
	
		// only extend if not already added and available
		if(!fn._bj && !(name in api)){		
			api[name] = fn;
			fn._bj = true; // tag it
		} else {
			throw new TypeError('[bluejay] [app.js] - already added: ' + name); 
		}
	};
	
	/**
	* Log to console with a fixed prefix
	* @param {String} msg - message to log
	*/
	api.log = (msg) => {
		if(debug) console.log('[blue] ' + msg);
	};
	
	
	/**
	* Provide set up feedback whilst debugging
	*/
	if(debug){
		api.log('OE JS UI layer ("blue") ...');
		api.log('DEBUG MODE');
		
		document.addEventListener('DOMContentLoaded', () => {
			console.timeEnd('[blue] DOM Loaded');
		}, {once:true});
	}

	/* 
	Reveal public methods for bluejay
	*/
	return api;

})();
