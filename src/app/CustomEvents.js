/**
* Custom App Events 
* (lets keep it a bit loose)
*/
(function () {

	'use strict';
	
	const myEvents = {};
	
	/**
	* Create Custom Event 
	* @param {string} eventType
	* @param {Object}
	*/
	const createEvent = (eventType,eventDetail) => {
		// check it's available
		if (!(eventType in myEvents)){
			bluejay.log('New Event added: '+eventType);
			myEvents[eventType] = new CustomEvent(eventType,{detail:eventDetail});
			return true;
	
		} else {
			
			bluejay.log('Err: Event aleady added? ' + eventType);
			return false;
		}
	};

	bluejay.extend('addCustomEvent',createEvent);	

})();