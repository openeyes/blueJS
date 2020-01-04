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
		exit:[]
	};
	
	/**
	* Register to receive Event
	* @param {Sting}  	selector	DOM selector, or set of selectors e.g '.class' or '#id' 	
	* @param {Function} cb			callback function
	*/
	const addClick = (selector,cb) => {
		listeners.click.push({ 	selector:selector,
								cb:cb });
	};
	
	const addHover = (selector,cb) => {
		listeners.hover.push({ 	selector:selector,
								cb:cb });
	};
	
	const addExit = (selector,cb) => {
		listeners.exit.push({ 	selector:selector,
								cb:cb });
	};
	
	// extend app
	bluejay.extend('listenForHover',addHover);
	bluejay.extend('listenForClick',addClick);
	bluejay.extend('listenForExit',addHover);
	
	/**
	* Document Event Listener for 'mousedown'
	* @param {Event} 
	*/
	const userClick = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	// mouseenter
	const userHover = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	
	const userExit = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	// extend App
	bluejay.extend('clickEvent',userClick);
	bluejay.extend('hoverEvent',userHover);
	bluejay.extend('exitEvent',userExit);

	

})();