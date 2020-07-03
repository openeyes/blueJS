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
	const resize = [];	// window resize

	/**
	* Register a Module callback with an Event
	* @param {Array} arr - listeners array  
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = (arr, selector, cb) => {
		arr.push({selector:selector, cb:cb});
	};

	/**
	* Check Listeners for Selector matches	
	* @param {Event}  event 
	* @param {Array}  Listeners
	*/
	const checkListeners = (event, listeners) => {
		if(event.target === document) return;
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	/**
	* Basic broadcaster for Resize
	* @param {Array}  Listeners
	*/
	const broadcast = (listeners) => {
		listeners.forEach((item) => {
			item.cb();
		});
	};

	/**
	* Throttle Scroll & Resize events
	* As these fire at such high rates they need restricting
	* @oaram {Array} listeners array	
	*/
	function EventThrottler(){
		let throttleID = 0;
		return (listeners) => {
			clearTimeout(throttleID);
			throttleID = setTimeout(() => broadcast(listeners), 100);
		};
	}
	// set up closure
	const resizeThrottle = EventThrottler();
	
	/**
	Specific functions for each event. This is so that they can be remove
	*/
	function handleMouserEnter(e){
		checkListeners(e, hover);
	}
	function handleMouserDown(e){
		checkListeners(e, click);
	}
	function handleMouserLeave(e){
		checkListeners(e, exit);
	}
	
	
	
	/**
	To improve performance delegate Event handling to the document
	setup Event listeners... 
	*/
	document.addEventListener('mouseenter', handleMouserEnter, {capture:true});
	document.addEventListener('mousedown', handleMouserDown, {capture:true}); 
	document.addEventListener('mouseleave', handleMouserLeave, {capture:true});
	
	/* 
	** Touch **
	*/
	let handleTouchStart = (e) => {
		
		/*
		With touch I'll get: touchstart, mouseenter then mousedown.
		This will mess up the UI because of "hover" enhancment behaviour for mouse users.
		Therefore remove the Mouse events.
		*/
		document.removeEventListener('mouseenter', handleMouserEnter, {capture:true});
		document.removeEventListener('mousedown', handleMouserDown, {capture:true}); 
		document.removeEventListener('mouseleave', handleMouserLeave, {capture:true});
		
		// basic "click" behaviour
		checkListeners(e, click);
		
		// only need to removeListeners once!
		handleTouchStart = (e) => {
			checkListeners(e, click);
		};
	};
	
	
	document.addEventListener('touchstart', (e) => handleTouchStart(e), {capture:true});
	
	
	
	// Throttle high rate events
	window.onresize = () => resizeThrottle(resize); 
	
	// extend App
	uiApp.extend('registerForHover', (selector,cb) => addListener(hover,selector,cb));
	uiApp.extend('registerForClick', (selector,cb) => addListener(click,selector,cb));
	uiApp.extend('registerForExit', (selector,cb) => addListener(exit,selector,cb));
	uiApp.extend('listenForResize', (cb) => addListener(resize,null,cb));


})(bluejay);