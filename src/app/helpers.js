
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
	* Provide a consistent approach to appending DOM Element to <body>, 	
	* @param {DOM Element} el
	*/
	const appendTo = (dom,el) => {
		let body = document.querySelector(dom);
		body.appendChild(el);
	};
	
	/**
	* Get dimensions of hidden DOM element
	* only use on 'fixed' or 'absolute'elements
	* @param {DOM Element} el 	currently out of the document flow
	* @returns {Object} width and height as {w:w,h:h}
	*/
	const getHiddenElemSize = (el) => {
		// need to render with all the right CSS being applied
		// show but hidden...
		el.style.visibility = 'hidden';
		el.style.display = 'block';		// doesn't work for 'flex'
		
		// ok now calc...
		let props =  {	w:el.offsetWidth,
						h:el.offsetHeight }; 	
		
		// now hide properly again
		el.style.visibility = 'inherit';
		el.style.display = 'none';
		
		return props;
	};

	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendTo',appendTo);
	bluejay.extend('getHiddenElemSize', getHiddenElemSize);
	
})();