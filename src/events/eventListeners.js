/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('click', bluejay.clickEvent, false); // useCapture, not required on click, it bubbles

})();