/**
* Helper functions
*/
(function (uiApp) {

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
	* Provide a consistent approach to appending DOM Elements,
	* @param {String} selector  	
	* @param {DOM Element} el - to attach
	* @param {DOMElement} doc - start point for search (optional)
	*/
	const appendTo = (selector,el,doc) => {
		let dom = (doc || document).querySelector(selector);
		dom.appendChild(el);
	};
	
	/**
	* Remove a DOM Element 	
	* @param {DOM Element} el
	*/
	const removeDOM = (el) => {
		el.parentNode.removeChild(el);
	};
	
	/**
	* XMLHttpRequest 
	* @param {string} url
	* @param {Function} cb - callback
	* @retuns {String} responseText
	*/
	const xhr = (url,cb) => {
		uiApp.log('[XHR] - '+url);
		let xReq = new XMLHttpRequest();
		xReq.onreadystatechange = function(){
			
			if(xReq.readyState !== 4) return; // only run if request is DONE 
			
			if(xReq.status >= 200 && xReq.status < 300){
				uiApp.log('[XHR] - Success');
				cb(xReq.responseText);
				// success
			} else {
				// failure
				uiApp.log('[XHR] - Failed');
				return false;
			}			
		};
		// open and send request
		xReq.open("GET",url);
		xReq.send();
	};

	/**
	* Get dimensions of hidden DOM element
	* only use on 'fixed' or 'absolute'elements
	* @param {DOM Element} el 	currently out of the document flow
	* @returns {Object} width and height as {w:w,h:h}
	*/
	const getHiddenElemSize = (el) => {
		// need to render with all the right CSS being applied
		// displayed but hidden...
		el.style.visibility = 'hidden';
		el.style.display = 'block';			// this won't work for 'flex'
		
		// ok now calc...
		let props =  {	w:el.offsetWidth,
						h:el.offsetHeight }; 	
		
		// and now hide again
		el.style.visibility = 'inherit';
		el.style.display = 'none';
		
		return props;
	};

	// Extend App
	uiApp.extend('nodeArray', NodeListToArray);
	uiApp.extend('appendTo',appendTo);
	uiApp.extend('removeElement',removeDOM);
	uiApp.extend('xhr',xhr);
	uiApp.extend('getHiddenElemSize', getHiddenElemSize);
	
})(bluejay);