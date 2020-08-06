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
	
		bluejay.log('[Custom Event] - "'+eventType+'"');
		
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
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseExpand');
	
	/*
	(Collapse) Data & Group DOMs: 
	.collapse-data
	- .collapse-data-header-icon (expand/collapse)
	- .collapse-data-content
	
	.collapse-group
	- .header-icon (expand/collapse)
	- .collapse-group-content
	*/
	const states = [];

	/*
	Methods	
	*/
	const _change = () => ({
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		show: function(){
			uiApp.show(this.content, "block");
			this.btn.classList.replace('expand','collapse');
			this.open = true;
		}
	});
	
	const _hide = () => ({
		hide: function(){
			uiApp.hide(this.content);
			this.btn.classList.replace('collapse','expand');
			this.open = false;
		}
	});
	
	/**
	* @Class
	* @param {Object} me - initialise
	* @returns new Object
	*/
	const Expander = (me) => {
		return Object.assign(	me, 
								_change(),
								_show(),
								_hide() );
	};

	/**
	* Callback for 'Click' (header btn)
	* @param {event} event
	*/
	const userClick = (ev, type) => {
		let btn = ev.target;
		let stateRef = uiApp.getDataAttr(btn);
		if(stateRef){
			// DOM already setup, change it's current state
			states[parseFloat(stateRef)].change();
		} else {
			// ...not set up yet, record state ref in DOM
			uiApp.setDataAttr(btn, states.length); 
			/*
			Data/Group are generally collapsed by default
			but can be set in the DOM to be expanded, check 
			this by the class used on the btn
			*/
			let me = {
				btn: btn,
				content: btn.parentNode.querySelector('.collapse-' + type + '-content'),
				open: btn.classList.contains('collapse')
			};
			
			// create new Expander
			let expander = Expander(me);
			expander.change(); 	
			
			// store state							
			states.push(expander); 			
		}
	};

	/*
	Events
	*/
	uiApp.userDown( ".collapse-data-header-icon", ev => userClick(ev, "data"));
	uiApp.userDown( ".collapse-group > .header-icon", ev => userClick(ev, "group"));

})(bluejay); 
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
(function (bj) {
	
	'use strict';
	
	bj.addModule('tooltip'); 
	
	/** 
	M.V.C
	*/
	const m = {
		selector: ".js-has-tooltip",
		/*
		OE tooltips: 1) Basic, 2) Bilateral (eyelat icons are optional)
		Tooltip widths are set by newnblue CSS	
		*/
		css: {
			basicWidth: 200, // match CSS
			bilateralWidth: 400, // match CSS
		},
		
		showing:false,
		target:null,
		type: "basic", // or, bilateral
		tip: null, // tooltip content
		eyeIcons: null, // only applies to bilateral popups
		 
		/**
		* a Model change notifies View, simple, but tight coupling
		* @param {Funciton} f - view callback
		*/
		onChange(f){
			if(typeof f !== "function") throw new Error('Tooltip Model requires View callback as funciton');
			this.onChange = f;
		},
		
		/**
		* Reset the Model
		*/
		reset(){
			this.showing = false;
			this.target = null;
			this.onChange();
		},
		
		/**
		* Update the Model
		* @param {EventTarget} target
		*/
		update(target){
			this.showing = true;
			this.target = target;
					
			if(target.dataset.ttType == "bilateral"){
				// split tooltip for R/L
				this.type = "bilateral";
				this.eyeIcons = target.dataset.ttEyeicons === 'no' ? false : true;
				this.tip = {
					r: target.dataset.ttRight,
					l: target.dataset.ttLeft
				};
			} else {
				// original tooltip
				this.type = "basic";
				this.tip = target.dataset.tooltipContent;
			}
			this.onChange();
		}
	};

	/**
	* View
	* @param {model} 
	*/
	const view = ((model) => {
		let div = null; // only build DOM when required
		let display = "block"; // bilateral requires 'flex'
		let width = model.css.basicWidth;
		let content; 
		
		// innerWidth forces a reflow, only update when necessary
		let winWidth = window.innerWidth;
		bj.listenForResize(() => winWidth = window.innerWidth);
		
		/**
		hide
		*/
		const hide = () => {
			div.innerHTML = "";
			div.className = "oe-tooltip"; // clear all CSS classes
			div.style.cssText = "display:none"; // clear ALL styles & hide
		};
		
		// only build DOM when needed
		const buildDOM = () => {
			div = document.createElement('div');
			bj.appendTo('body', div);
			hide();
			return div;
		};
		
		/**
		show
		*/
		const show = () => {
			// build the DOM, if not done already
			div = div || buildDOM();
			
			/*
			Content of the tooltip depends on the type:
			Basic is a straightforward HTML string
			Bilateral needs dividing with HTMLStrings assigned to each side
			*/
			if(display == "block"){
				// basic: HTML string, may contain basic tags
				div.innerHTML = model.tip;
			} else {
				/*
				Bilateral enhances the basic tooltip
				with 2 content areas for Right and Left 	
				*/
				div.classList.add('bilateral');
				
				// hide R / L icons?
				if(!model.eyeIcons){
					div.classList.add('no-icons');
				}
				
				div.innerHTML = '<div class="right"></div><div class="left"></div>';
				div.querySelector('.right').innerHTML = model.tip.r;
				div.querySelector('.left').innerHTML = model.tip.l; 
			}
			
			/*
			Check the tooltip height to see if content fits default positioning	
			*/
			let offsetW = width/2; 
			let offsetH = 8; // visual offset, which allows for the arrow
			
			// can't get the DOM height without some trickery...
			let h = bj.getHiddenElemSize(div).h;
							
			/*
			work out positioning based on icon
			this is a little more complex due to the hotlist being
			fixed open by CSS above a certain browser size, the
			tooltip could be cropped on the right side if it is.
			*/
			let domRect = model.target.getBoundingClientRect();
			let center = domRect.right - (domRect.width/2);
			let top = domRect.top - h - offsetH;
		
			// watch out for the hotlist, which may overlay the tooltip content
			let extendedBrowser = bj.settings("cssHotlistFixed");
			let maxRightPos = winWidth > extendedBrowser ? extendedBrowser : winWidth;
			
			/*
			setup CSS classes to visually position the 
			arrow correctly based on tooltip positoning
			*/
			
			// too close to the left?
			if(center <= offsetW){
				offsetW = 20; 			// position to the right of icon, needs to match CSS arrow position
				div.classList.add("offset-right");
			}
			
			// too close to the right?
			if (center > (maxRightPos - offsetW)) {
				offsetW = (width - 20); 			// position to the left of icon, needs to match CSS arrow position
				div.classList.add("offset-left");
			}
			
			// is there enough space above icon for standard posiitoning?
			if( domRect.top < h ){
				top = domRect.bottom + offsetH; // nope, invert and position below
				div.classList.add("inverted");
			} 
			
			// update DOM and show the tooltip
			div.style.top = top + 'px';
			div.style.left = (center - offsetW) + 'px';
			div.style.display = display;
		};

		/**
		Callback for any Model changes
		*/
		model.onChange(() => {
			// check the model state
			if(model.showing == false){
				hide();
			} else {
				content = model.tip;
				if(model.type == "basic"){
					display = "block";
					width = model.css.basicWidth;
				} else {
					display = "flex";
					width = model.css.bilateralWidth;
				}
				show();
			}
		});
		
	})(m); // link to Model, easy & basic
	
	/**
	* Controllers for user Events	
	* @param {Event} ev
	*/
	const userOver = (ev) => {
		m.update(ev.target); // update the Model with DOM data
		// if the user scrolls, remove the tooltip (as it will be out of position)
		window.addEventListener('scroll', userOut, {capture:true, once:true});
	};
	
	const userOut = (ev) => {
		if(!m.showing) return; 
		m.reset();  // reset the Model
	};
	
	const userClick = (ev) => {
		if(ev.target.isSameNode(m.target) && m.showing){
			userOut();
		} else {
			userOver(ev);
		}
	};
		
	/**
	Listeners 
	*/
	bj.userDown(m.selector, userClick);
	bj.userEnter(m.selector, userOver);
	bj.userLeave(m.selector, userOut);
	
	
})(bluejay); 
/**
* Using "oePloyly" as namespace
* @namespace
*/
const oePlotly = (function ( bj ) {

	'use strict';
	
	bj.log('[oePlotly]');
	
	
	const colours = {
		electricBlue: '#63d7d6',
		dark: {
			green: '#65d235',
			greenSeries: ['#65d235', '#94d712', '#36be8d', '#099f18', '#9bd727'],
			red: '#ea2b34',
			redSeries: ['#ea2b34','#D41C81','#F65B20','#D4341C'],
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#3f0aea','#7b3131'],
		}, 
		light: {
			green: '#418c20',
			greenSeries: ['#418c20','#99991C','#1DA323','#74A31D','#1C9944'],
			red: '#da3e43',
			redSeries: ['#da3e43', '#F0379A', '#E66735', '#F05037'],
			standard: ['#0a4198', '#1451b3', '#175ece'],
			varied: ['#0a2aea', '#ea0a8e', '#00b827','#890aea'],
			dual: ['#0a4198','#874e4e'],
		}
	};
	
	const getElectricBlue = () => {
		return colours.electricBlue;
	};
	
	/**
	* Get color series
	* @param {String} colour name
	* @param {Boolean} dark 
	* @returns {Array} of colour series
	*/
	const getColorSeries = ( colorName, dark ) => {
		let colorWay = null;
		
		switch( colorName ){
			case "varied": colorWay = dark ?  colours.dark.varied : colours.light.varied;
			break;	
			case "twoPosNeg": colorWay = dark ?  colours.dark.dual : colours.light.dual;   // assumes Postive trace is first! 
			break;
			case "rightEye": colorWay = dark ?  colours.dark.greenSeries : colours.light.greenSeries;
			break; 
			case "leftEye": colorWay = dark ?  colours.dark.redSeries : colours.light.redSeries;
			break; 
			default: 
				colorWay = dark ? colours.dark.standard : colours.light.standard;
		}	
		
		return colorWay;
	};
	
	/**
	* Some elements require colour setting to be made
	* in the data (trace) objects. This provides a way to 
	* theme and standardise 
	* @param {String} colour type e.g. "error_y"  for: error_y.color 
	* @param {String} theme - OE Theme setting "dark" || "light"?
	* @returns {String} colour for request element (or "pink" if fails)
	*/
	const getColorFor = (plotlyElement, dark) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		switch(plotlyElement){
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: 
				return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Can not just set layout to dark theme bases on oeTheme setting
	* layout may be used in "pro" area (such as patient popup)
	* @param {String} theme
	* @returns {Boolean}
	*/
	const isDarkTheme = ( theme ) => {
		return theme === "dark" ? true : false;	
	};
	
	/**
	* return settings for "line" style in data
	* @param {Number} optional
	* @returns {Object}
	*/
	const dashedLine = ( n ) => {
		return {
			dash: "2px,2px",
			width: 2,
		};
	};
	
	/**
	* Build an axis object IN layout lines 
	* @param {Object} customise - overwrite or add to default settings
	* @param {Boolean} dark - use dark theme options?
	*/
	const defaultAxis = ( customise, dark ) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		let axisDefaults = {
			// color: '#fff', // override base font
			linecolor: dark ? '#666' : '#999', // axis line colour
			linewidth:1,
			showgrid: true,
			gridcolor: dark ? '#292929' : '#e6e6e6',
			
			tickmode: "auto",
			nticks: 50, // number of ticks
			ticks: "outside",
			ticklen: 3, // px
			tickcolor: dark ? '#666' : '#ccc',
			automargin: true, //  long tick labels automatically grow the figure margins.
			
			mirror: true, //  ( true | "ticks" | false | "all" | "allticks" )
		};
		
		return Object.assign( axisDefaults, customise );
	};
	
	/**
	* set up to show all catorgies or just the ones with data
	* @param {Object} axis
	* @param {Array} categories (for axis)
	* @param {Boolean} all - show all categories (even if they don't have data)
	* @returns {Object} updated axis
	*/
	const makeCategoryAxis = ( axis, categories, all = true ) => {
		axis.type = "category";
		axis.categoryarray = categories;
		if(all) axis.range = [0, categories.length];
		return axis; 
	};
	
	/**
	* Change layout properties
	* Right and Left plot layouts are identical except for titles and colours, so ...
	*/
	const changeTitle = ( layout, newTitle ) => {
		if( layout.title.text ){
			layout.title.text = newTitle;
		}	
	};
	
	const changeColorSeries = ( layout, colorSeries, dark ) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		layout.colorway = getColorSeries( colorSeries, dark );
	};
	
	// public 
	return {
		isDarkTheme,
		getElectricBlue,
		getColorSeries, 
		getColorFor,
		dashedLine,
		defaultAxis,
		makeCategoryAxis, 
		changeTitle,
		changeColorSeries
	};

})( bluejay );

(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build Regression lines for scatter data
	* @param {Array} values_x 
	* @param {Array} values_y
	* @returns {Object} - {[x],[y]}
	*/
	oePlotly.findRegression = function(values_x, values_y){
		// Find Line By Least Squares
	    let sum_x = 0,
	    	sum_y = 0,
			sum_xy = 0,
			sum_xx = 0,
			count = 0,
			x = 0,	// speed up read/write access
			y = 0,
			values_length = values_x.length;
	
		// check we have what we need
	    if (values_length != values_y.length)  throw new Error('The parameters values_x and values_y need to have same size!');
		// nothing!
	    if (values_length === 0) return [ [], [] ];
	
	    /*
	     * Calculate the sum for each of the parts necessary.
	     */
	    for (let v = 0; v < values_length; v++) {
	        x = values_x[v];
	        y = values_y[v];
	        sum_x = sum_x + x;
	        sum_y = sum_y + y;
	        sum_xx = sum_xx + x*x;
	        sum_xy = sum_xy + x*y;
	        count++;
	    }
	
	    /*
	     * Calculate m and b for the formular:
	     * y = x * m + b
	     */
	    const m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
	    const b = (sum_y/count) - (m*sum_x)/count;
	
	    /*
	     * We will make the x and y result line now
	     */
	    let result_values_x = [];
	    let result_values_y = [];
	    
	    for (let v = 0; v < values_length; v++) {
	        x = values_x[v];
	        y = x * m + b;
	        result_values_x.push(parseFloat(Number.parseFloat(x).toFixed(2)));
	        result_values_y.push(parseFloat(Number.parseFloat(y).toFixed(2)));
	    }
	
	    return {x: result_values_x, y: result_values_y};
	};

})( oePlotly );
(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build Plotly layout: colours and layout based on theme and standardised settings
	* @param {Object} options - quick reminder of 'options':
	* @returns {Object} layout themed for Plot.ly
	* All options...
	{
		theme: "dark",  		// OE Theme  
		colors: 'varied', 		// Optional {String} varied" or "twoPosNeg" or "rightEye" (defaults to "blues")
		plotTitle: false, 		// Optional {String}
		legend: true, 			// Required {Boolean}
		titleX: false, 			// Optional {String}
		titleY: false, 			// Optional {String}
		numTicksX: 20, 			// Required {Number}
		numTicksY: 20, 			// Required	{Number}
		rangeX: false, 			// Optional {Array} e.g. [0, 100]
		rangeY: false, 			// Optional {Array} e.g. [0, 100]
		useCategories: 			// Optional {Object} e.g. {showAll:true, categoryarray:[]}
		y2: false,				// Optional {Object} e.g {title: "y2 title", range: [0, 100], useCategories: {showAll:true, categoryarray:[]}}
		rangeslider: false,		// Optional {Boolean}
		zoom: false, 			// Optional {Boolean}
		subplot: false,			// Optional {Boolean}
		domain: false, 			// Optional {Array} e.g. [0, 0.75] (if subplot)
		spikes: false, 			// Optional {Boolean} 
	}
	*/
	oePlotly.getLayout = function(options){
		// set up layout colours based on OE theme settings: "dark" or "light"
		const dark = oePlotly.isDarkTheme( options.theme );
		
		// build the Plotly layout obj
		let layout = {
			hovermode:'closest', // get single point rather than all of them
			autosize:true, // onResize change chart size
			margin: {
				l:60, // 80 default, if Y axis has a title this will need more
				r:60, // change if y2 axis is added
				t:30, // if there is a title will need upping to 60
				b:80, // allow for xaxis title
				pad:5, // px between plotting area and the axis lines
				autoexpand:true, // auto margin expansion computations
			},
			// Paper = chart area. Set at opacity 0.5 for both, to hide the 'paper' set to: 0
			paper_bgcolor: dark ? 'rgba(30,46,66,0.5)' : 'rgba(255,255,255,0.5)',
			
			// actual plot area
			plot_bgcolor: dark ? 'rgb(10,10,30)' : '#fff',
			
			// base font settings
			font: {
				family: "Roboto, 'Open Sans', verdana, arial, sans-serif",
				size: dark ? 11 : 13,
				color: dark ? '#aaa' : '#333',
			},
			
			// legend?
			showlegend: options.legend,
			// if so, it will be like this:
			legend: {
				font: {
					size: 10
				},
				orientation: 'h', // 'v' || 'h'				
				xanchor:'right',
				yanchor:'top',
				x:1,
				y:1,
			}, 
			
			// default set up for hoverlabels
			hoverlabel: {
				bgcolor: dark ? "#003" : '#fff',
				bordercolor: dark ? '#003' : '#00f',
				font: {
					size:11, // override base font
					color: dark ? oePlotly.getElectricBlue() : '#00f',
				}
			},
			
		};
	
		/*
		Colour themes!	
		*/ 
		if(options.colors){
			layout.colorway = oePlotly.getColorSeries( options.colors, dark );			
		} else {
			layout.colorway = oePlotly.getColorSeries( "default", dark );
		}
		
		/*
		Plot title
		*/
		if(options.plotTitle){
			layout.title = {
				text: options.plotTitle,
				xref: 'paper', //  "container" | "paper" (as in, align too)
				yref: 'container', 
				x: 0, // 0 - 1
				y: 0.96,
				font: {
					size:dark ? 15 : 17,
					// color:'#f00' - can override base font
				}, 		
			};
			// adjust the margin area
			layout.margin.t = 60;
		}
		
		/*
		Axes
		*/
		let axis = oePlotly.defaultAxis( {}, dark );
		
		// spikes
		if(options.spikes){
			axis.showspikes = true; 
			axis.spikecolor = dark ? '#0ff' : '#00f';
			axis.spikethickness = dark ? 0.5 : 1;
			axis.spikedash = dark ? "1px,3px" : "2px,3px";
		}

		// set up X & Y axis
		layout.xaxis = Object.assign({},axis); 
		layout.xaxis.nticks = options.numTicksX;
		
		layout.yaxis = Object.assign({},axis); 
		layout.yaxis.nticks = options.numTicksY;
		
		// turn off zoom?
		if(options.zoom === false){
			layout.xaxis.fixedrange = true;
			layout.yaxis.fixedrange = true;
		}
		
		// manually set axes data range
		if(options.rangeX){
			layout.xaxis.range = options.rangeX;
		}
		
		if(options.rangeY){
			layout.yaxis.range = options.rangeY;
		}
		
		// categories (assuming this will only be used for yAxis)
		if(options.useCategories){
			layout.yaxis = oePlotly.makeCategoryAxis( layout.yaxis, options.useCategories.categoryarray, options.useCategories.showAll);
		}
		
		// OE data formatting
		if(options.datesOnAxis){
			switch(options.datesOnAxis){
				case "x": layout.xaxis.tickformat = "%e %b %Y";
				break; 
				case "y": layout.yaxis.tickformat = "%e %b %Y";
				break; 
			}	
		}
			
		// add titles to Axes?
		if(options.titleX){
			layout.xaxis.title = {
				text: options.titleX,
				standoff:20, // px offset 
				font: {
					size:dark ? 12 : 13,
				}
			};
		}
		
		if(options.titleY){
			layout.yaxis.title = {
				text: options.titleY,
				standoff: 15, // px offset 
				font: {
					size:dark ? 12 : 13,
				}
			};
			// make space for Y title
			layout.margin.l = 80;
		}
		
		// two Y axes? 
		if(options.y2){
			
			layout.yaxis2 = Object.assign({}, axis);
			layout.yaxis2.nticks = options.numTicksY;
			layout.yaxis2.overlaying = 'y';
			layout.yaxis2.side = 'right';
			layout.yaxis2.showgrid = false;
			
			if(options.y2.range){
				layout.yaxis2.range = options.y2.range; 
			}
			
			// categories
			if(options.y2.useCategories){
				layout.yaxis2 = oePlotly.makeCategoryAxis( layout.yaxis2, options.y2.useCategories.categoryarray, options.y2.useCategories.showAll );
			}


			// and need a title as well??
			if(options.y2.title){
				layout.yaxis2.title = {
					text: options.y2.title,
					standoff: 15, // px offset 
					font: {
						size:dark ? 12 : 13,
					}
				};
				// make space for Y title
				layout.margin.r = 80;
			}
		}
		
		/*
		Subplots (2 charts on a single plot)
		*/
		if(options.subplot){
			layout.grid = {
		    	rows: 2,
				columns: 1,
				pattern: 'independent',
			};
			
			layout.yaxis.domain = options.domain;
			if(layout.yaxis2){
				layout.yaxis2.domain = options.domain;
			}
		}
		
		// add range slider
		if(options.rangeslider){
			if(dark){
				// this is a pain.
				// can't find a setting to change the slide cover color!
				// it's set at a black opacity, so to make this usable:
				layout.xaxis.rangeslider = {
					bgcolor: layout.paper_bgcolor,
					borderwidth: 1,
					bordercolor: layout.plot_bgcolor,
					thickness: 0.1, // 0 - 1, default 0.15 (height of area)
				};
			} else {
				// Plot.ly handles this well in 'light' theme mode
				layout.xaxis.rangeslider = {
					thickness: 0.1, // 0 - 1, default 0.15 (height of area)
				};
			}
			// adjust the margin because it looks better:
			layout.margin.b = 40;
		}
		
		// ok, all done
		return layout;
	};
	
	
})( oePlotly );
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