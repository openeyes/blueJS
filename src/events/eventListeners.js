/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('mouseover',	bluejay.hoverEvent,		false);
	document.addEventListener('mousedown',	bluejay.clickEvent,		false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,		false);
	 
	// these are handled a bit differently
	window.addEventListener('scroll',		bluejay.windowScroll,	true);
	window.onresize = bluejay.windowResize; 
	
})();