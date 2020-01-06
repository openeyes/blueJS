/**
* Event Listeners
*/
(function () {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseover',	bluejay.hoverEvent,		true);
	document.addEventListener('mousedown',	bluejay.clickEvent,		true); 
	document.addEventListener('mouseout',	bluejay.exitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll',		bluejay.windowScroll,	true);
	window.onresize = bluejay.windowResize; 
	
})();