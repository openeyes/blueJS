/**
* Helper functions
*/
(function( bj ) {

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
	* @param {DOMElement} base - base Element for search (optional)
	*/
	const appendTo = ( selector, el, base ) => {
		let dom = ( base || document ).querySelector( selector );
		dom.appendChild( el );
	};
	
	/**
	* Remove a DOM Element 	
	* @param {DOM Element} el
	*/
	const remove = ( el ) => {
		el.parentNode.removeChild( el );
	};
	
	/**
	* wrap an element (https://plainjs.com/)
	* @param {Element} elementToWrap
	* @param {String} wrapClassName (optional)
	* @returns {Element} new wrapper 
	*/
	const wrap = ( el, wrapClassName = '' ) => {
		const wrap = document.createElement('div');
		/*
		match it's CSS width
		*/
		const compStyles = window.getComputedStyle( el );
		wrap.style.width = compStyles.getPropertyValue('width'); // match wrapped el
		wrap.style.position = "relative";
		wrap.style.display = "inline-block"; // don't affect layout
		
		el.style.width = "100%"; // fill wrapper: "unwrap" reverses this
		
		el.parentNode.insertBefore( wrap, el );
		wrap.appendChild( el ); // now move input into wrap
		
		return wrap;
	};
	
	/**
	* unwrap an element (https://plainjs.com/)
	* @param {Element} unwrapElement
	*/
	const unwrap = ( el ) => {
		const wrap = el.parentNode;
		const parent = wrap.parentNode;
		// clean up and reset the DOM
		el.style.width = ""; // see "wrap" above
		parent.insertBefore( el, wrap );
		remove( wrap ); 
	};
	
	/**
	* Show a DOM Element, the default setting of '' will allow the
	* the CSS to be used and stop the inline style overwriting it
	* @param {DOM Element} el
	* @param {String} displayType - "block","flex",'table-row',etc
	*/
	const show = (el, displayType = '') => {
		if(el === null) return;
		el.style.display = displayType;
	};
	
	/**
	* ! - DEPRECIATED
	* re-show a DOM Element - this assumes CSS has set display: "block" || "flex" || "inline-block" (or whatever)
	* @param {DOM Element} el
	*/
	const reshow = (el) => {
		if(el === null) return;
		el.style.display = ""; // in which case remove the style display and let the CSS handle it again (thanks Mike)
	};
	
	/**
	* Hide a DOM Element ()	
	* @param {DOM Element} el
	*/
	const hide = (el) => {
		if(el === null) return;
		el.style.display = "none";
	};
	
	/**
	* getParent - search UP the DOM (restrict to body) 
	* @param {HTMLElement} el
	* @parent {String} string to match
	* @returns {HTMLElement} or False
	*/
	const getParent = (el, selector) => {
		while( !el.matches('body')){
			if( el.matches( selector )){
				return el; // found it!
			} else {
				el = el.parentNode; // keep looking...
			}
		}
		return false;
	};
	
	/**
	* XMLHttpRequest 
	* @param {string} url
	* @returns {Promise} resolve(responseText) or reject(errorMsg)
	*/
	const xhr = (url) => {
		bj.log('[XHR] - '+url);
		// wrap XHR in Promise
		return new Promise((resolve, reject) => {
			let xReq = new XMLHttpRequest();
			xReq.open("GET", url);
			xReq.onreadystatechange = function(){
				
				if(xReq.readyState !== 4) return; // only run if request is fully complete 
				
				if(xReq.status >= 200 && xReq.status < 300){
					bj.log('[XHR] - Success');
					resolve(xReq.responseText);
					// success
				} else {
					// failure
					bj.log('[XHR] - Failed');
					reject(this.status + " " + this.statusText);
				}			
			};
			// open and send request
			xReq.send();
		});
	};

	/**
	* Get dimensions of hidden DOM element
	* can only be used on 'fixed' or 'absolute'elements
	* @param {DOM Element} el 	currently out of the document flow
	* @returns {Object} width and height as {w:w,h:h}
	*/
	const getHiddenElemSize = ( el ) => {
		// need to render with all the right CSS being applied
		// displayed but hidden...
		el.style.visibility = 'hidden';
		el.style.display = ''; // this assumes that a display is set on CSS (or by default on the DOM)
			
		// get props...
		let props = {	
			w: el.offsetWidth,
			h: el.offsetHeight 
		}; 	
		
		// ...and hide again
		el.style.visibility = '';
		el.style.display = 'none';
		
		return props;
	};

	/* 
	* Output messgaes onto UI
	* useful for touch device testing
	* @param {String} Message
	*/  
	const idgMsgReporter = (msg) => {
		
		let id = "idg-js-ui-message-out";
		let ul = document.getElementById(id);
		let li = document.createElement("li");
		
		if(ul === null){
			ul = document.createElement("ul");
			ul.id = id;
			ul.style = "position:fixed; bottom:10px; right:10px; z-index:9999; background:orange; padding:10px; list-style-position:inside; max-height:vh90; overflow-y: scroll; font-size:14px;";
			document.body.appendChild(ul);
		}
	
		let count = ul.children.length; 
		li.appendChild( document.createTextNode(count +' - '+ msg) );
		ul.appendChild(li);
	};
	
	/*
	Extend App
	*/
	bj.extend('nodeArray', NodeListToArray );
	bj.extend('appendTo', appendTo );
	bj.extend('getParent', getParent );
	bj.extend('wrap', wrap );
	bj.extend('unwrap', unwrap );
	bj.extend('remove', remove );
	bj.extend('show', show );
	bj.extend('reshow', reshow );
	bj.extend('hide', hide );
	bj.extend('xhr', xhr );
	bj.extend('getHiddenElemSize', getHiddenElemSize );
	bj.extend('idgReporter', idgMsgReporter );
	
})( bluejay );