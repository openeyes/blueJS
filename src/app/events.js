/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance route all events through 
	single Event Listener on the document. Modules register 
	callbacks here. The functionality they want is basically
	"click","hover","exit" 
	*/
	const listeners = {
		click:[],		// mousedown
		hover:[],		// mouseenter
		exit:[],		// mouseout
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
	bluejay.extend('listenForExit',addExit);
	
	/**
	* Handle Events from the Document Event Listener for
	* @param {Array}  Callback that are listening 
	* @param {Event} 
	*
	*/
	const checkListeners = (listeners,event) => {
		// only a few listeners, forEach should be fast enough
		if(event.target === document) return;
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	/**
	* Receive Event: 'mousedown'
	* @param {Event} 
	*/
	const userClick = (event) => checkListeners(listeners.click,event);
	
	/**
	* Receive Event: 'mouseenter'
	* @param {Event} 
	*/
	const userHover = (event) => checkListeners(listeners.hover,event);
	
	/**
	* Receive Event: 'mouseout'
	* @param {Event} 
	*/
	const userExit = (event) => checkListeners(listeners.exit,event);
	
	// extend App
	bluejay.extend('clickEvent',userClick);
	bluejay.extend('hoverEvent',userHover);
	bluejay.extend('exitEvent',userExit);

})();