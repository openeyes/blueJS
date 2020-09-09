/**
* DOM Event Delegation
*/
(function( bj ) {

	'use strict';
	
	const urlHostName = new URL(window.location).hostname; // temporary for IDG, see "notifyListeners" below
	
	/**
	* Event Aggregation Pattern
	* To improve performance delegate all events for all Modules here.
	* Modules register selectors (to match) along with callbacks
	*/
	const mouseDown = new Map();	
	const mouseEnter = new Map();	
	const mouseLeave = new Map();	
	const resize = new Set(); // no selectors to match too.

	/**
	* Register a Module callback with an Event
	* @param {May} map - for each EventListener
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = ( map, selector, cb ) => {
		
		if( map.has(selector)){
			throw new TypeError('Event Delegation: selector already added : ' + selector); 
		} 
		
		map.set( selector, cb );
	};

	/**
	* When Event fires check for registered listeners	
	* @param {Event} - event
	* @param {Map} - listeners
	*/
	const notifyListeners = ( event, listeners ) => {
		/*
		All mousedown, mouseenter, mouseleave events
		must be register here, therefore, there is no need to 
		let them continue to propagate throught the DOM.
		*/
		if( urlHostName === 'mac-oe' || urlHostName === 'idg.knowego.com' ){
			/*
			However, as this stops ALL: mousedown, mouseenter, mouseleave (& touchstart) events.
			Only do this on IDG for now, maybe in the future, it can be added into production...
			*/
			// event.stopPropagation(); 
		}
		
		// who?
		const target = event.target;
		
		// ignore if document
		if( target === document ) return false;
		
		listeners.forEach( ( cb, key ) => {
			if( target.matches( key )){
				cb( event );
			}
		});
	};

	/**
	* Throttle Resize Event	
	*/
	const resizeThrottle = (() => {
		
		let throttleID = 0;
		
		const delay = () => {
			clearTimeout(throttleID);
			throttleID = setTimeout( () => {
				resize.forEach( ( cb ) => {
					cb();
				});
			}, 150);
		};
		
		// public
		return { delay };
	})();
	
	// Throttle high rate events
	window.onresize = () => resizeThrottle.delay();
	
	/**
	* Event handlers
	* Specific functions for each event, this is so that they can be removed on Touch
	*/
	
	function handleMouserEnter(e){
		notifyListeners( e, mouseEnter );
	}
	
	function handleMouserDown(e){
		notifyListeners( e, mouseDown );
	}
	
	function handleMouserLeave(e){
		notifyListeners( e, mouseLeave );
	}
	
	/*
	With touch I'll get: touchstart, mouseenter then mousedown.
	This messes up the UI because of "mouseEnter" enhancment behaviour for mouse/track users.
	*/
	let handleTouchStart = ( e ) => {
		// remove mouse events
		document.removeEventListener('mouseenter', handleMouserEnter, { capture:true });
		document.removeEventListener('mousedown', handleMouserDown, { capture:true }); 
		document.removeEventListener('mouseleave', handleMouserLeave, { capture:true });
		
		// run basic "click" behaviour
		notifyListeners( e, mouseDown );
		
		// lazy load - only need the removeListeners once...
		handleTouchStart = ( e ) => {
			notifyListeners( e, mouseDown );
		};
	};
	
	/**
	* Event Listeners
	*/
	document.addEventListener('mouseenter', handleMouserEnter, { capture:true });
	document.addEventListener('mousedown', handleMouserDown, { capture:true }); 
	document.addEventListener('mouseleave', handleMouserLeave, { capture:true });
	document.addEventListener('touchstart', ( e ) => handleTouchStart( e ), { capture:true });

	// extend App
	bj.extend('userEnter', ( selector, cb ) => addListener( mouseEnter, selector, cb ));
	bj.extend('userDown', ( selector, cb ) => addListener( mouseDown, selector, cb ));
	bj.extend('userLeave', ( selector, cb ) => addListener( mouseLeave, selector, cb ));
	
	// window resize, no need for selectors
	bj.extend('listenForResize', ( cb ) => resize.add( cb ));

})( bluejay );