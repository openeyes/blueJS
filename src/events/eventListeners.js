/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('mouseenter',	bluejay.hoverEvent,	false); // useCapture, not required as it bubbles
	document.addEventListener('mousedown',	bluejay.clickEvent,	false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,	false); 
	
	
})();