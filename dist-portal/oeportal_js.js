/**
 * Element.matches() polyfill (simple version)
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
/**
* OE3 JS to handle DOM UI.
* Using "bluejay" as namespace
* @namespace
*/
const bluejay = (function () {

	'use strict';
	/*
	Set up some performance timers
	"Ready": called by './_last/ready.js' the last JS file concatenated by Gulp
	"DOM Loaded": called by "DOMContentLoaded" event (watching out for other scripts that are slowing things down)
	*/
	
	const logPrefix = "[bluejay]";
	const debug = true;	 // Output debug '[blue]' to console
	const bj = {};  // API for bluejay
	
	console.time(`${logPrefix} Ready`);
	console.time(`${logPrefix} DOM Loaded`);
	
	/**
	* Extend bluejay public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	bj.extend = (name, fn) => {
		
		if(typeof fn !== "function"){
			throw new TypeError('[bluejay] [app.js] - only extend with a function: ' + name); 
		}
		
		// only extend if not already added and available
		if(!fn._bj && !(name in bj)){		
			bj[name] = fn;
			fn._bj = true; // tag it
		} else {
			throw new TypeError('[bluejay] [app.js] - already extended with: ' + name); 
		}
	};
	
	/**
	* Log to console with a fixed prefix
	* @param {String} msg - message to log
	*/
	bj.log = (msg) => {
		if(debug) console.log( logPrefix + ' ' + msg );
	};
	
	/**
	* Gulp ensures that _last/ready.js is added last
	* to the JS file ...it calls ready: 
	*/
	bj.ready = () => {
		console.timeEnd(`${logPrefix} Ready`);
	};
	
	/**
	* Provide set up feedback whilst debugging
	*/
	if(debug){
		bj.log('OE JS UI layer ' + logPrefix + ' ...');
		bj.log('DEBUG MODE');
		bj.log('Mustache version: ' + Mustache.version);
		
		document.addEventListener('DOMContentLoaded', () => {
			bj.log('[Modules] - ' + bj.registeredModules() );
			console.timeEnd(`${logPrefix} DOM Loaded`);
		}, {once:true});
	}

	/* 
	Reveal public methods for bluejay
	*/
	return bj;

})();

/**
* DOM Event Delegation
*/
(function( bj ) {

	'use strict';
	
	/**
	* Event Aggregation Pattern
	* To improve performance delegate all events for all Modules here.
	* Modules register selectors (to match) along with callbacks
	*/
	
	const mouseDown = new Map();	
	const mouseEnter = new Map();	
	const mouseLeave = new Map();	
	const resize = new Set(); // no selectors to match too.

	/**
	* Register a Module callback with an Event
	* @param {May} map - for each EventListener
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = ( map, selector, cb ) => {
		
		if( map.has(selector)){
			throw new TypeError('DOM Events: selector already added : ' + selector); 
		} 
		
		map.set( selector, cb );
	};

	/**
	* When Event fires check for registered listeners	
	* @param {Event} - event
	* @param {Map} - listeners
	*/
	const notifyListeners = ( event, listeners ) => {
		
		const target = event.target;
		if( target === document ) return false;
		
		listeners.forEach( ( cb, key ) => {
			if( target.matches( key )){
				cb( event );
			}
		});
	};

	/**
	* Throttle Resize Event	
	*/
	const resizeThrottle = (() => {
		
		let throttleID = 0;
		
		const delay = () => {
			clearTimeout(throttleID);
			throttleID = setTimeout( () => {
				resize.forEach( ( cb ) => {
					cb();
				});
			}, 150);
		};
		
		// public
		return { delay };
	})();
	
	/**
	* Event handlers
	* Specific functions for each event, this is so that they can be removed
	*/
	
	function handleMouserEnter(e){
		notifyListeners( e, mouseEnter );
	}
	
	function handleMouserDown(e){
		notifyListeners( e, mouseDown );
	}
	
	function handleMouserLeave(e){
		notifyListeners( e, mouseLeave );
	}
	
	let handleTouchStart = ( e ) => {
		/*
		With touch I'll get: touchstart, mouseenter then mousedown.
		This messes up the UI because of "mouseEnter" enhancment behaviour for mouse/track users.
		*/
		document.removeEventListener('mouseenter', handleMouserEnter, { capture:true });
		document.removeEventListener('mousedown', handleMouserDown, { capture:true }); 
		document.removeEventListener('mouseleave', handleMouserLeave, { capture:true });
		
		// basic "click" behaviour
		notifyListeners( e, mouseDown );
		
		// only need the removeListeners once...
		handleTouchStart = ( e ) => {
			notifyListeners( e, mouseDown );
		};
	};
	
	/**
	* Event Listeners
	*/
	document.addEventListener('mouseenter', handleMouserEnter, { capture:true });
	document.addEventListener('mousedown', handleMouserDown, { capture:true }); 
	document.addEventListener('mouseleave', handleMouserLeave, { capture:true });
	document.addEventListener('touchstart', ( e ) => handleTouchStart( e ), { capture:true });
	
	// Throttle high rate events
	window.onresize = () => resizeThrottle.delay();

	// extend App
	bj.extend('userEnter', ( selector, cb ) => addListener( mouseEnter, selector, cb ));
	bj.extend('userDown', ( selector, cb ) => addListener( mouseDown, selector, cb ));
	bj.extend('userLeave', ( selector, cb ) => addListener( mouseLeave, selector, cb ));
	
	// window resize, no need for selectors
	bj.extend('listenForResize', ( cb ) => resize.add( cb ));

})( bluejay );
/**
* Handle DOM collections
* Modules tend to handle DOM collections. 
* this should be of help... 
*/
(function( bj ) {
	'use strict';
	/**
	* Generator to create unique ids 
	* Used as Keys and in DOM data-bjk 
	*/
	function* IdGenerator(){
		let id = 10;
		while( true ){
			yield ++id;
		}
	}
	
	const iterator = IdGenerator();
	const getKey = () => iterator.next().value;
	
	bj.extend( 'getKey', getKey );
	
	/**
	* Handle DOM collections in modules
	* Create a Facade to Map to link the DOM data attribute
	* with the Map Key
	*/ 
	function Collection(){
		this.map = new Map();
		this.dataAttr =  'data-oebjk';
	}
	
	/**
	* Add new Key / Value 
	* this is the reason behind the Facade: Link Key to DOM element.
	* @param {Object} value (anything)
	* @param {HTMLElement} el - linked DOM element
	* @returns {String} Key
	*/
	Collection.prototype.add = function( value, el ){
		const key = getKey();
		this.map.set( key, value );
		el.setAttribute( this.dataAttr, key );	 
		return key;
	};
	
	/**
	* Get Key from DOM element data attribute
	* @param {HTMLElement} el - DOM Element to check
	* @returns Key || False
	*/
	Collection.prototype.getKey = function( el ){
		let key = el.getAttribute( this.dataAttr );
		if( key === null || key == ""){
			return false;
		} else {
			return key;
		}
	};
	
	Collection.prototype.get = function( key ){
		if( typeof key === "string") key = parseInt(key, 10);
		return this.map.get( key );
	};
	
	Collection.prototype.has = function( key ){
		return this.map.has( key );
	};
	
	bj.extend( 'Collection', Collection );	

})( bluejay );
/**
* Custom App Events 
* (lets try and keep it loose)
*/
(function( bj ) {

	'use strict';
	
	/**
	* Create Custom Event
	* @param {string} eventType
	* @param {String} details
	*/
	const myEvent = ( eventType, eventDetail ) => {
		// bluejay.log('[Custom Event] - "'+eventType+'"');
		const event = new CustomEvent(eventType, {detail: eventDetail});
		document.dispatchEvent(event);
	};
		
	bj.extend('customEvent', myEvent);	
	
})( bluejay );
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
	* @param {DOMElement} base - base Element for search (optional)
	*/
	const appendTo = (selector, el, base) => {
		let dom = (base || document).querySelector(selector);
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
		while(!el.matches('body')){
			if(el.matches(selector)){
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
		uiApp.log('[XHR] - '+url);
		// wrap XHR in Promise
		return new Promise((resolve, reject) => {
			let xReq = new XMLHttpRequest();
			xReq.open("GET", url);
			xReq.onreadystatechange = function(){
				
				if(xReq.readyState !== 4) return; // only run if request is fully complete 
				
				if(xReq.status >= 200 && xReq.status < 300){
					uiApp.log('[XHR] - Success');
					resolve(xReq.responseText);
					// success
				} else {
					// failure
					uiApp.log('[XHR] - Failed');
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
	const getHiddenElemSize = (el) => {
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
		el.style.visibility = 'inherit';
		el.style.display = 'none';
		
		return props;
	};

	/* 
	Output messgaes onto UI
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


	// Extend App
	uiApp.extend('nodeArray', NodeListToArray);
	uiApp.extend('appendTo', appendTo);
	uiApp.extend('getParent', getParent);
	uiApp.extend('removeElement', removeDOM);
	uiApp.extend('show', show);
	uiApp.extend('reshow', reshow);
	uiApp.extend('hide', hide);
	uiApp.extend('xhr', xhr);
	uiApp.extend('getHiddenElemSize', getHiddenElemSize);
	uiApp.extend('idgReporter', idgMsgReporter);
	
})(bluejay);
/**
* Modules in bluejay.
* Manage namespacing for modules in blueajay
*/
(function( bj ){
	'use strict';
	
	/* 
	Keep a note of added Modules for debugging
	2 version of Bluejay are created: 
	1) IDG all modules.
	2) OE UI: selected modules.
	*/
	const modules = [];
	const registerModule = ( name ) => modules.push( name );
	const listModules = () => {
		modules.sort();
		return modules.join(', ');
	};
	
	/**
	Manage namespace in Bluejay
	*/
	const namespace = new Map();
	/**
	 * Get/Set Namespace
	 * @param  {String} namespace
	 * @return {Object} (namespace)
	 */
	const appNameSpace = ( name ) => {
		if( !namespace.has(name) ){
			namespace.set( name, {} );
		}
		return namespace.get(name);	
	};
	
	// Extend API
	bj.extend( 'addModule', registerModule );
	bj.extend( 'registeredModules', listModules );
	bj.extend( 'namespace', appNameSpace );

})( bluejay );
/**
* Template structure for MV* patterns 
* Observer pattern
*/
(function( bj ) {
	
	'use strict';
	
	/**
	* Create an ObserverList for Models (Models)
	*/	
	const ObserverList = {
		list: new Set(), // observer only needs (should) be added once
		add( item ){
			this.list.add( item );
			return this.list.has( item );
		}, 
		remove( item ){
			this.list.remove( item );
		}, 
		size(){
			return this.list.size;
		}, 
		notify(){
			let iterator = this.list.values();
			for ( let item of iterator ){
				item();
			}
		}
	};
	 
	/**
	* Basic Model with Observer Pattern for Views
	*/
	const Model = () => ({
		views: Object.create( ObserverList )
	});
		
	bj.extend( 'ModelViews', Model );	

})( bluejay );
/**
* Settings (useful globals)
*/
(function (bj) {

	'use strict';
	
	/**
	* Globally useful settings.
	* CSS setting MUST match newblue: openeyes/__config-all.scss
	* @param {String} setting request
	* @returns value || null
	*/ 
	const settings = (request) => {
		switch(request){
			case "cssHeaderHeight": return 60; // mobile portrait, this doubles up! 
			case "cssExtended": return 1440;
			case "cssHotlistFixed": return 1890;
			case "idgPHPLoadURL": return '/idg-php/v3/_load/';
			default:
				bj.log('Setting request not recognised: ' + request);
				return null;
		}
	};
	
	/**
	* Standardise data-attributes names
	* @param {String} suffix optional
	* @returns {Sting} 
	*/
	const domDataAttribute = (suffix = false) => {
		let attr = !suffix ? 'bluejay' : 'bluejay-' + suffix;
		return 'data-' + attr;
	};
	
	/**
	* set Data Attribute on DOM 
	* @param {HTMLElement} el - el to store on
	* @param {String} value
	*/
	const setDataAttr = (el, value) => {
		el.setAttribute(domDataAttribute(), value); 
	};
	
	/**
	* get Data Attribute on DOM 
	* @param {HTMLElement} el - el to check
	* @returns {String||null} 
	*/
	const getDataAttr = (el) => {
		const dataAttr = domDataAttribute();
		if(el.hasAttribute(dataAttr)){
			return el.getAttribute(dataAttr);
		} else { 
			return false;
		}
	};

	// Extend App
	bj.extend('settings', settings);
	bj.extend('getDataAttributeName', domDataAttribute);
	bj.extend('setDataAttr', setDataAttr);
	bj.extend('getDataAttr', getDataAttr);

})(bluejay);
(function( bj ) {

	'use strict';	
	
	const demoPath = ( btnID, groupName, pathChoice ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;
		
		const group = `idg-radio-g-${groupName}`;
		const radios = bj.nodeArray( document.getElementsByName( groupName ));
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === group ){
				btn.disabled = ( elem.value === pathChoice ) ? false : true;
			}
		});
	};
	
	const demoCheckbox = ( btnID, checkboxName ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;	
		
		const checkbox = bj.nodeArray( document.getElementsByName( checkboxName ))[0]; // only 1
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === checkboxName ){
				btn.disabled = elem.checked ? false : true;
			}
		});
		
	};
	
	const demoMultiPath = ( btnID, groupName, callBack ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;
		
		const group = `idg-radio-g-${groupName}`;
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === group ){
				callBack( btn, elem.value );
			}
		});	
	};
	
	
	
	const otherCheckBox = ( groupName, otherTextID ) => {
		const other = document.querySelector( otherTextID );
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === groupName ){
				let displayOther = elem.checked ? 'block' : 'none';
				other.style.display = displayOther;
			}
		});		
	};
	
	const demoOtherText = ( args ) => {
		if( args.inputType ){
			otherCheckBox( args.group, args.otherTextID );
		}
	};
	
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('demoPath', demoPath );
	bj.extend('demoCheckbox', demoCheckbox );
	bj.extend('demoMultiPath', demoMultiPath );
	bj.extend('demoOtherText', demoOtherText );
	

})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	/*
	To avoid a 'flickering' effect
	DOM elements that need to be 'hidden'
	on page load need to use "hidden" CSS class
	after JS loads it switches it over
	*/ 
	
	const hidden = uiApp.nodeArray(document.querySelectorAll('.hidden'));
	if(hidden.length){
		hidden.forEach( (elem) => {
			uiApp.hide(elem);
			elem.classList.remove('hidden');
		});
	}
	
	// Table rows use a different technique
	const trCollapse = uiApp.nodeArray(document.querySelectorAll('.tr-collapse'));
	if(trCollapse.length){
		trCollapse.forEach( (elem) => {
			elem.style.visibility = 'collapse';
			elem.classList.remove('tr-collapse');
		});
	}
	

	
})(bluejay);
(function( bj ) {

	'use strict';	
	
	bj.addModule('navSlidePanel');
	
	/**
	Behaviour for the Logo Panel and the Menu Panel
	is identical, however the Menu isn't included on 
	the Login page
	*/

	const css = {
		btnActive: 'active',
		panelShow: 'show'
	};

	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Callback for 'down'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Callback for 'enter'
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( css.btnActive );
			
			// panel needs a bit of work
			//clearTimeout( this.hideTimerID ); 
			this.panel.classList.add( css.panelShow );
			this.panel.style.pointerEvents = "auto";
		}	
	});
	
	const _hide = () => ({
		/**
		* Callback for 'leave'
		*/
		hide:function(){
			if(this.open === false) return;
			this.open = false;
			this.btn.classList.remove( css.btnActive );
			this.panel.classList.remove( css.panelShow );
			this.panel.style.pointerEvents = "none";
			
		}
	});
	
	/**
	* navSlidePanel.
	* Pattern is the same for Logo and Menu
	* @param {Object} me - setup object
	* @returns navSlidePanel instance
	*/
	const navSlidePanel = ( me ) => {
		return Object.assign( me, _change(), _show(), _hide() );
	};
	
	/**
	Init - Logo
	*/
	const logoBtn = '#js-openeyes-btn';
	
	const logo = navSlidePanel({
		btn: document.querySelector( logoBtn ),
		panel: document.querySelector('.oe-portal-info'),
		open: false,
	});
	
	// A little Bling: on Login page pop in the panel
	if( document.querySelector('.oe-login') !== null && window.innerWidth > 800 ){
		setTimeout( () => logo.show(), 1000 );	
	}
	
	// Events
	bj.userDown( logoBtn, () => logo.change());			
	bj.userEnter( logoBtn, () => logo.show());
	bj.userLeave('.openeyes-brand', () => logo.hide());
	
	
	/**
	Init - Menu
	*/
	const menuBtn = '#js-menu-btn';
	
	if( document.querySelector( menuBtn ) === null ) return; // login page
	
	const menu = navSlidePanel({
		btn: document.querySelector( menuBtn ),
		panel: document.querySelector('.menu-info'),
		open: false,
	});
	
	// Events
	bj.userDown( menuBtn, () => menu.change());			
	bj.userEnter( menuBtn, () => menu.show());
	bj.userLeave('.portal-menu', () => menu.hide());
	

})( bluejay ); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('textAreaResize');	
	
	/**
	* Resize textarea 
	* @param {HTMLElement} <textarea>
	*/ 
	const resize = ( textArea ) => {
		let h = textArea.scrollHeight;
		if(h < 32) return;
		textArea.style.height = 'auto';
		textArea.style.height = ( h + 5 ) + 'px';
	};
	
	/**
	Make resize available for comments that reveal a textarea
	*/
	uiApp.extend('resizeTextArea',resize);	
	

	/**
	* Resize textarea on 'input'
	*/
	document.addEventListener('input', (ev) => {
		if(ev.target.matches('textarea')){
			resize(ev.target);
		}
	},{capture:true});
	
	/**
	* Expand textareas that are overflowing onLoad
	*/
	document.addEventListener('DOMContentLoaded', () => {
		let all = uiApp.nodeArray( document.querySelectorAll('textarea') );
		all.forEach((t)=>{
			resize(t);
		});
	});
	
	
	
})(bluejay); 
/**
* Last loaded
*/
(function( bj ) {

	'use strict';
	
	// no need for any more extensions
	Object.preventExtensions(bj);
	
	// ready
	bj.ready();

})( bluejay );