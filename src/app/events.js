/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance all events are routed 
	through a single Event Listener.
	Modules register here and get a callback
	*/
	const listeners = {
		click:[],
		hover:[],
	};
	
	/**
	* Register to receive Event
	* @param {Sting}  	selector	DOM selector, or set of selectors e.g '.class' or '#id' 	
	* @param {Function} cb			callback function
	*/
	const listenForClick = (selector,cb) => {
		listeners.click.push({ 	selector:selector,
								cb:cb });
	};
	
	
	/**
	* Called by the single document Event Listener 
	* @param {Event} 
	*/
	const clickEvent = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	
	// extend App
	bluejay.extend('listenForClick',listenForClick);
	bluejay.extend('clickEvent',clickEvent);

})();