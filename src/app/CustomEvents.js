/**
* Custom App Events 
* (lets try and keep it loose)
*/
(function (uiApp) {

	'use strict';
	
	/**
	* Create Custom Event
	* @param {string} eventType
	* @param {Object}
	*/
	const myEvent = (eventType, eventDetail) => {
		/*
		Create unique prefix & dispatch 
		*/
		const event = new CustomEvent("blue-" + eventType, {detail: eventDetail});
		document.dispatchEvent(event);
		
		// log for DEBUG
		bluejay.log('[Custom Event] - "'+eventType+'"');
	};
		
	uiApp.extend('triggerCustomEvent', myEvent);	
	
})(bluejay);