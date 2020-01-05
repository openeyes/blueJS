/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('mouseenter',	bluejay.hoverEvent,	true);
	document.addEventListener('mousedown',	bluejay.clickEvent,	false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,	true); 
	
	
})();