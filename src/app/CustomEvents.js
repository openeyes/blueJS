/**
* Custom App Events 
* (lets try and keep it loose)
*/
(function( bj ) {

	'use strict';
	
	/**
	* Create Custom Event
	* @param {string} eventType
	* @param {Object}
	*/
	const myEvent = ( eventType, eventDetail ) => {
		/*
		Create unique prefix & dispatch 
		*/
		const event = new CustomEvent(eventType, {detail: eventDetail});
		document.dispatchEvent(event);
		
		// DEBUG
		// bluejay.log('[Custom Event] - "'+eventType+'"');
	};
		
	bj.extend('bjEvent', myEvent);	
	
})( bluejay );