
/**
  * Helper functions
  */
(function () {

	'use strict';
	
	/**
	* NodeList.forEach has poor support, convert to Array
	* @param {NodeList} nl
	* @returns {Array}
	*/
	const NodeListToArray = (nl) => {
		return Array.prototype.slice.call(nl);
	};
	
	/**
	* Append Element to <body> 	
	* @param {DOM Element} el
	*/
	const appendToBody = (el) => {
		let body = document.querySelector('body');
		body.appendChild(el);
	};
	
	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendToBody',appendToBody);
	//bluejay.extend('getConfig', getSettings);
})();