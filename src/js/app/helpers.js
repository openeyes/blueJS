
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
	* Append DOM Element to <body>, provides a consistent approach 	
	* @param {DOM Element} el
	*/
	const appendTo = (dom,el) => {
		let body = document.querySelector(dom);
		body.appendChild(el);
	};
	
	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendTo',appendTo);
	
})();