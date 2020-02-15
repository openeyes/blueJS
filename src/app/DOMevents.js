/**
* DOM Event Delegation
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate all events. 
	Modules register callbacks for listeners here.
	*/
	const click = [];	// mousedown
	const hover = [];	// mouseenter
	const exit = [];	// mouseleave
	const scroll = [];	// window (any) scroll
	const resize = [];	// window resize

	/**
	* Register a Module callback with an Event
	* @param {Array} arr - listeners array  
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = (arr,selector,cb) => {
		arr.push({	selector:selector, 
					cb:cb });
	};

	/**
	* Check Listeners for Selector matches	
	* @param {Event}  event 
	* @param {Array}  Listeners
	*/
	const checkListeners = (event,listeners) => {
		if(event.target === document) return;
/*
		
		if(event.type === "mousedown"){
			console.log(event.target);
			console.log(event);	
		}
		
*/
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
				event.stopPropagation();
			}
		});
	};
	
	/**
	* Basic broadcaster for Scroll and Resize
	* @param {Array}  Listeners
	*/
	const broadcast = (listeners) => {
		listeners.forEach((item) => {
			item.cb(event);
		});
	};

	/**
	* Throttle Scroll & Resize events
	* As these fire at such high rates they need restricting
	* @oaram {Array} listeners array	
	*/
	function EventThrottler(listeners){
		let throttle = false;
		return () => {
			if(throttle) return;
			throttle = true;
			
			broadcast(listeners); // broadcast at start
			
			setTimeout( () => {
				throttle = false;
			},320);  // 16ms * 20
		};
	}
	
	const scrollThrottle = EventThrottler(scroll);
	const resizeThrottle = EventThrottler(resize);
	
	/**
	To improve performance delegate Event handling to the document
	*/
	document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mouseenter',	(event) => checkListeners(event,hover),		{capture:true} );
		document.addEventListener('mousedown',	(event) => checkListeners(event,click),		{capture:true} ); 
		document.addEventListener('mouseleave',	(event) => checkListeners(event,exit),		{capture:true} );
		// Throttle high rate events
		window.addEventListener('scroll', () => scrollThrottle(), true); 
		window.onresize = () => resizeThrottle(); 
		
		console.timeEnd('***bluejay***');
    });
	
	// extend App
	uiApp.extend('registerForHover',	(selector,cb) => addListener(hover,selector,cb));
	uiApp.extend('registerForClick',	(selector,cb) => addListener(click,selector,cb));
	uiApp.extend('registerForExit',		(selector,cb) => addListener(exit,selector,cb));
	uiApp.extend('listenForScroll',		(cb) => addListener(scroll,null,cb));
	uiApp.extend('listenForResize',		(cb) => addListener(resize,null,cb));


})(bluejay);