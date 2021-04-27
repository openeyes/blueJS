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
* Handle DOM collections
* Modules tend to handle DOM collections. 
* this should be of help... 
*/
(function( bj ) {
	'use strict';
	/**
	* Generator to create unique ids 
	* Used as Keys and in DOM data-bjc 
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
		this.dataAttr =  'data-bjc';
	}
	
	/**
	* Add new Key / Value 
	* this is the reason behind the Facade: Link Key to DOM element.
	* @param {Object} value (anything)
	* @param {HTMLElement} el - linked DOM element
	* @returns {String} Key
	*/
	Collection.prototype.add = function( value, el ){
		const key = getKey(); // from Generator (see above)
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
	
	/**
	* Get value by key
	* @returns value
	*/
	Collection.prototype.get = function( key ){
		if( typeof key === "string") key = parseInt(key, 10);
		return this.map.get( key );
	};
	
	/**
	* Get the First added value
	* @returns value
	*/
	Collection.prototype.getFirst = function(){
		const iterator = this.map.values();
		return iterator.next().value;
	};
	
	/**
	* Get the 'next' value in collection
	* @param {Key} startKey - next key from here
	* @returns value
	*/
	Collection.prototype.next = function( startKey ){
		const it = this.map.keys();
		let key = it.next();
		
		while( !key.done ){
			if( key.value === startKey ) return it.next().value;
			key = it.next();
		}
	};
	
	/**
	* Get the 'previous' value in collection
	* @param {Key} startKey - previous key from here
	* @returns value
	*/
	Collection.prototype.prev = function( startKey ){
		const it = this.map.keys();
		let prevKey = false;
		
		for (const key of it ) {
		  if(key === startKey) return prevKey; // 
		  prevKey = key;
		}
	};
	
	/**
	* Has Key?
	* @returns {Boolean}
	*/
	Collection.prototype.has = function( key ){
		return this.map.has( key );
	};
	
	/**
	* Remove to allow GC
	* @returns {Boolean}
	*/
	Collection.prototype.delete = function( key ){
		return this.map.delete( key );
	};
	
	// API
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
* DOM Event Delegation
*/
(function( bj ) {

	'use strict';
	
	const urlHostName = new URL(window.location).hostname; // temporary for IDG, see "notifyListeners" below
	
	/**
	* Event Aggregation Pattern
	* To improve performance delegate all events for all Modules here.
	* Modules register selectors (to match) along with callbacks
	*/
	const mouseDown = new Map();	
	const mouseEnter = new Map();	
	const mouseLeave = new Map();	
	const click = new Map();
	const resize = new Set(); // no selectors to match too.

	/**
	* Register a Module callback with an Event
	* @param {May} map - for each EventListener
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = ( map, selector, cb ) => {
		
		if( map.has( selector )){
			throw new TypeError('Event Delegation: selector already added : ' + selector); 
		} 
		
		map.set( selector, cb );
	};

	/**
	* When Event fires check for registered listeners	
	* @param {Event} - event
	* @param {Map} - listeners
	*/
	const notifyListeners = ( event, listeners ) => {
		/*
		All mousedown, mouseenter, mouseleave events
		must be register here, therefore, there is no need to 
		let them continue to propagate throught the DOM.
		*/
		if( urlHostName === 'mac-oe' || urlHostName === 'idg.knowego.com' ){
			/*
			However, as this stops ALL: mousedown, mouseenter, mouseleave (& touchstart) events.
			Only do this on IDG for now, maybe in the future, it can be added into production...
			*/
			// event.stopPropagation(); 
		}
		
		// who?
		const target = event.target;
		
		// ignore if document
		if( target === document ) return false;
		
		listeners.forEach(( cb, key ) => {
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
	
	// Throttle high rate events
	window.onresize = () => resizeThrottle.delay();
	
	/**
	* Event handlers
	* Specific functions for each event, this is so that they can be removed on Touch
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
	
	/*
	With touch I'll get: touchstart, mouseenter then mousedown.
	This messes up the UI because of "mouseEnter" enhancment behaviour for mouse/track users.
	*/
	let handleTouchStart = ( e ) => {
		// remove mouse events
		document.removeEventListener('mouseenter', handleMouserEnter, { capture:true });
		document.removeEventListener('mousedown', handleMouserDown, { capture:true }); 
		document.removeEventListener('mouseleave', handleMouserLeave, { capture:true });
		
		// run basic "click" behaviour
		notifyListeners( e, mouseDown );
		
		// lazy load - only need the removeListeners once...
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
	document.addEventListener('click', ( e ) => notifyListeners( e, click ), { capture:true });

	// extend App
	bj.extend('userEnter', ( selector, cb ) => addListener( mouseEnter, selector, cb ));
	bj.extend('userDown', ( selector, cb ) => addListener( mouseDown, selector, cb ));
	bj.extend('userLeave', ( selector, cb ) => addListener( mouseLeave, selector, cb ));
	bj.extend('userClick', ( selector, cb ) => addListener( click, selector, cb ));
	
	// window resize, no need for selectors
	bj.extend('listenForResize', ( cb ) => resize.add( cb ));

})( bluejay );
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
	* Find an element
	* @param {String} selector  	
	* @param {DOMElement} base - base Element for search (optional)
	*/
	const find = ( selector, base ) => ( base || document ).querySelector( selector );
	
	/**
	* Remove a DOM Element 	
	* @param {DOM Element} el
	*/
	const remove = ( el ) => {
		el.parentNode.removeChild( el );
	};
	
	/**
	* <div> with className, this is so common made it easier
	* @param {String} className
	* @param {DOMString} html
	* @returns {Element} <div>
	*/
	const div = ( className, html = false ) => {
		const div = document.createElement('div');
		div.className = className;
		if( html ) div.innerHTML = html;
		return div;
	};
	
	/**
	* param {String} domElement
	* @param {String} className
	* @param {DOMString} html
	* @returns {Element} new DOM
	*/
	const dom = ( domElement, className = false, html = false ) => {
		const el = document.createElement( domElement );
		if( className )el.className = className;
		if( html ) el.innerHTML = html;
		return el;
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
	const show = ( el, displayType = '') => {
		if( el === null ) return;
		el.style.display = displayType;
	};
	
	/**
	* ! - DEPRECIATED
	* re-show a DOM Element - this assumes CSS has set display: "block" || "flex" || "inline-block" (or whatever)
	* @param {DOM Element} el
	*/
	const reshow = ( el ) => {
		if(el === null) return;
		el.style.display = ""; // in which case remove the style display and let the CSS handle it again (thanks Mike)
	};
	
	/**
	* Hide a DOM Element ()	
	* @param {DOM Element} el
	*/
	const hide = ( el ) => {
		if( el === null ) return;
		el.style.display = "none";
	};
	
	/**
	* clearContents
	* some discussion over this, this 'seems' a good approach and is faster than innerHTML
	* however, might have problems with <SVG> nodes. May need a removeChild() approach.
	* @param {DOM Element} el
	*/
	const clearContent = ( parentNode ) => {
		if( parentNode.firstChild ){ 
			parentNode.textContent = null;	
		}
	};
	
	/**
	* getParent - search UP the DOM (restrict to body) 
	* @param {HTMLElement} el
	* @parent {String} string to match
	* @returns {HTMLElement} or False
	*/
	const getParent = ( el, selector ) => {
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
	* @param {string} token - returned in Promise for crosschecking
	* @returns {Promise} resolve(responseText) or reject(errorMsg)
	*/
	const xhr = ( url, token = false ) => {
		bj.log('[XHR] - ' + url );
		// wrap XHR in Promise
		return new Promise(( resolve, reject ) => {
			let xReq = new XMLHttpRequest();
			xReq.open("GET", url );
			xReq.onreadystatechange = function(){
				
				if(xReq.readyState !== 4) return; // only run if request is fully complete 
				
				if(xReq.status >= 200 && xReq.status < 300){
					bj.log('[XHR] - Success');
					xReq.token = token;
					resolve({ html: xReq.responseText, token });
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
	* Unique tokens, use a generator to always create unique tokens
	* token will always return a unique token
	*/
	function *UniqueToken(){
		let id = 1;
		while( true ){
			++id;
			yield `bj${id}`;
		}
	}
	const tokenIterator = UniqueToken();
	const token = () => tokenIterator.next().value;

	/**
	* Load JS on request. 
	* @param {String} url - external JS file
	* @param {Boolean} crossorigin - used to load CDN JS (... ReactJS for demos)
	* @returns {Promise} resolve(responseText) or reject(errorMsg)
	*/
	const loadJS = ( url, crossorigin=false ) => {
		bj.log('[JS script] - ' + url );
		return new Promise(( resolve, reject ) => {
			const script = document.createElement('script');
		    script.src = url;
			if( crossorigin ){
				script.setAttribute('crossorigin', '');
			}
			/*
			Not bothering with catching errors here at the moment.
			*/
			script.onload = () => {
				setTimeout(() => {
					bj.log('[JS loaded] - ' + url);
					resolve();
				}, 100 ); // delay to allow time to run the JS
			}; 
			script.onerror = () => bj.log('[JS ERROR ] - ' + url );
			document.head.appendChild( script) ;
		});  
	};


	/**
	* Get dimensions of hidden DOM element
	* can only be used on 'fixed' or 'absolute'elements
	* @param {DOM Element} el 	currently out of the document flow
	* @returns {Object} width and height as {w:w,h:h}
	*/
	const getHiddenElemSize = ( el ) => {
		const inDOM = el.parentNode !== null ? true : false; 
		
		// need to render with all the right CSS being applied
		// displayed but hidden...
		el.style.visibility = 'hidden';
		el.style.display = ''; // use the CSS display (or default display)
			
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
	
	/** 
	* clock24 - show Date as time (24hr)
	* @param {Date} - Date
	* @returns {String} - e.g. '09:03'
	*/
	const clock24 = ( date ) => {
		return date.getHours().toString().padStart(2,'0')  + ':' + date.getMinutes().toString().padStart(2,'0');
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
	bj.extend('find', find );
	bj.extend('getParent', getParent );
	bj.extend('wrap', wrap );
	bj.extend('unwrap', unwrap );
	bj.extend('div', div);
	bj.extend('dom', dom);
	bj.extend('remove', remove );
	bj.extend('show', show );
	bj.extend('reshow', reshow );
	bj.extend('hide', hide );
	bj.extend('empty', clearContent );
	bj.extend('xhr', xhr );
	bj.extend('getToken', token );
	bj.extend('loadJS', loadJS );
	bj.extend('getHiddenElemSize', getHiddenElemSize );
	bj.extend('idgReporter', idgMsgReporter );
	bj.extend('clock24', clock24 );
	
})( bluejay );
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
		if( !namespace.has( name )) namespace.set( name, {} );
		return namespace.get( name );	
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
	const ObserverList = () => ({
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
	});
	 
	/**
	* Basic Model with Observer Pattern for Views
	*/
	const Model = () => ({
		views: Object.create( ObserverList() )
	});
		
	bj.extend( 'ModelViews', Model );	

})( bluejay );
/**
* Settings (useful globals)
*/
(function( bj ){

	'use strict';
	
	/**
	* Globally useful settings.
	* CSS setting MUST match newblue: openeyes/__config-all.scss
	* @param {String} setting request
	* @returns value || null
	*/ 
	const settings = ( request ) => {
		switch( request ){
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
	* Global window width & height. 
	* As these force reflow, only update onResize
	* then make available to the app.
	*/
	let w = window.innerWidth;
	let h = window.innerHeight;
	
	const windowSize = () => {
		w = window.innerWidth;
		h = window.innerHeight;
	};
	
	// make available to blueJS modules
	const getWinH = () => h;
	const getWinW = () => w;
	
	// update
	bj.listenForResize( windowSize );

	
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
	bj.extend('getWinH', getWinH );
	bj.extend('getWinW', getWinW );
	bj.extend('getDataAttributeName', domDataAttribute);
	bj.extend('setDataAttr', setDataAttr);
	bj.extend('getDataAttr', getDataAttr);


})( bluejay );
/**
* oePlot - a "black box" to correctly and consistently display
* all plot.ly charts. All required data for a chart is passed
* in to the appropriate blueJS template (in agreed JSON format) and 
* oePlotly will style and theme it correctly for plot.ly
* 
* This replaces a previous, simpler oePlotly helper in "newblue" 
* see: newblue/plotlyJS/oePlotly_v1.js
*
* https://plot.ly/javascript/reference/
* @namespace "oeplot"
* Note: this approach completely replaces the old "oePlotly" layout helper
*/
(function( bj, oePlot ){

	'use strict';
	
	bj.log('Plot.ly version: ' + Plotly.version );
	
	/**
	* oePlot styles plotly based on OE theme mode
	* However, I can not just style based on this, as oePlot might
	* be used in "pro" area (such as patient popup)
	* @returns {Boolean}
	*/
	oePlot.isDarkTheme = () => window.oeThemeMode === "dark" ? true : false;	
	
	/**
	* Theme colours
	*/
	const colours = {
		dark: {
			blue:'#63d7d6',
			highlight:'#fff',
			green: '#65d235',
			red: '#ea2b34',
			greenSeries: ['#65d235', '#A5D712','#02B546'],
			redSeries: ['#ea2b34','#F64A2D','#C92845'],
			yellowSeries: ['#FAD94B','#E8B131','#F1F555'], // BEO (Both Eyes Open)
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#1472DE','#2E4259'],
		}, 
		light: {
			blue: '#00f',
			highlight:'#000',
			green: '#418c20',
			red: '#da3e43',
			greenSeries: ['#418c20','#598617','#139149'],
			redSeries: ['#da3e43', '#E64C02', '#E64562'],
			yellowSeries: ['#FCCE14','#E69812','#FCBB21'], // BEO
			standard: ['#0a4198', '#1451b3', '#175ece'],
			varied: ['#0a2aea', '#ea0a8e', '#00b827','#890aea'],
			dual: ['#2126C2','#8FAEC2'],
		}
	};
	
	/**
	* Get oe "blue"
	* @param {Boolean} dark 
	* @returns {Array} of colour series
	*/
	oePlot.getBlue = ( dark ) => dark ? colours.dark.blue : colours.light.blue;
	
	/**
	* Get color series
	* @param {String} colour name
	* @param {Boolean} darkTheme 
	* @returns {Array} of colour series
	*/
	oePlot.getColorSeries = ( colorName, darkTheme ) => {
		let colorWay = null;
		const dark = colours.dark;
		const light = colours.light; 
		
		switch( colorName ){
			case "varied": 
				colorWay = darkTheme ? dark.varied : light.varied;
			break;	
			case "posNeg": 
				colorWay = darkTheme ? dark.dual : light.dual;   // assumes Postive trace is first! 
			break;
			case "rightEyeSeries": 
				colorWay = darkTheme ? dark.greenSeries : light.greenSeries;
			break; 
			case "leftEyeSeries": 
				colorWay = darkTheme ? dark.redSeries : light.redSeries;
			break; 
			case "BEOSeries": 
				colorWay = darkTheme ? dark.yellowSeries : light.yellowSeries;
			break; 
			
			default: 
				colorWay = darkTheme ? dark.standard : light.standard;
		}	
		
		return colorWay;
	};
	
	/**
	* Some elements require colour setting to be made
	* in the data (trace) objects. This provides a way to 
	* theme and standardise 
	* @param {String} colour type e.g. "error_y"  for: error_y.color 
	* @param {Boolean} dark
	* @returns {String} colour for request element (or "pink" if fails)
	*/
	oePlot.getColor = ( colour, dark ) => {
		switch( colour ){
			case 'highlight': return dark ? colours.dark.highlight : colours.light.highlight; 
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			//case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Temporary support added for IDG Glaucoma Visual Fields Demo which is still
	* using oePlot directly (until I have time to rebuild it!) 
	*/ 
	oePlot.getColorFor = ( color, dark ) => getColor( color, dark );
	

})( bluejay, bluejay.namespace('oePlot'));

(function( oePlot ) {
	
	'use strict';
	
	oePlot.selectableUnits = () => {
		/*
		Either Right and Left Eye layouts
		Or just one eye.
		*/
		const traces = new Map();
		const axes = [];
		let updatePlotly;
		let selectedTraceIndex = 0;
		
		/**
		* Data traces are built first in templates
		* @param {String} eye - 'right' or 'left'
		* @param {Object} trace
		*/
		const addTrace = ( eye, trace ) => {
			if( traces.has( eye )){
				traces.get( eye ).push( trace );
			} else {
				traces.set( eye, [ trace ]);
			}
		};
		
		const getTrace = ( eye ) => {
			return traces.get( eye )[ selectedTraceIndex ];
		};
		
		const getAxis = () => {
			return axes[ selectedTraceIndex ];
		};
		
		
		/**
		* Controller for <select> changes
		* @param {Event} ev
		*/
		const handleUserChange = ( ev ) => {
			// update current selected
			selectedTraceIndex = ev.target.selectedIndex;	
			for (const eyeSide of traces.keys()) {
				updatePlotly( eyeSide );
			}
		};

		/**
		* Build <select> for user to choose units
		* @param {Array} options
		*/
		const buildDropDown = ( options ) => {
			// Mustache template
			const template = [
				'<div class="plot-tool">',
				'<label>VA Scale</label>',
				'<select>',
				'{{#options}}',
				'<option>{{.}}</option>',
				'{{/options}}',
				'</select>', 
				'</div>'
			].join('');
		
			// build layout DOM
			const div = document.createElement('div');
			div.className = 'oeplot-toolbar'; // newblue provides styling for this class (but not positioning)
			div.innerHTML = Mustache.render( template, { 'options' : options });
			
			/*
			I think this is only used in OESscape so dump in 'oes-v2'
			note: if dropdown is for a single layout maybe use Plotly internal dropdown? 
			*/
			const oesParent = document.querySelector('.oeplot');
			oesParent.classList.add('with-toolbar');
			oesParent.append( div );
			
			
			/*
			Set <select> option and listen for changes
			*/
			let select = div.querySelector('select');
			select.options[ selectedTraceIndex ].selected = true;
			select.addEventListener('change', handleUserChange, false);
		};
		
		
		/**
		* init 
		* @param {Object} options e.g.
		* {
			plotlyUpdate: callback,
			axisDefaults: {
				type:'y',
				domain: [0.1, 0.46],
				title: 'VA', 
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges )),
			dark
		}
		*/
		const init = ( options ) => {
			
			// callback for updating Plotly
			updatePlotly = options.plotlyUpdate; 

			const dark = options.darkTheme;
			const axisDefault = options.axisDefaults;
			const title = axisDefault.title;
			const userOptions = [];
			
			/*
			loop through all unit ranges, build axes and options for <select>
			*/
			options.unitRanges.forEach(( unit, index ) => {
				// default units?
				if( unit.makeDefault ) selectedTraceIndex = index;
				
				// build options for <select> dropdown
				userOptions.push( unit.option );
				
				/*
				Build all the different Axes for the data traces	
				*/
				let newAxis;
				axisDefault.title = `${title} - ${unit.option}`;
				
				// the unit range will either be numerical or categories
				if( typeof unit.range[0] === 'number'){
					// numerical axis
					newAxis = Object.assign({}, axisDefault, {
						range: unit.range.reverse(), // e.g. [n1, n2];
						axisType: "linear", // set the axis.type explicitly here
					});
				} else {
					// category axis
					newAxis = Object.assign({}, axisDefault, {
						useCategories: {
							showAll: true, 
							categoryarray: unit.range.reverse()
						}
					});
				}
				
				// build axes array
				axes.push( oePlot.getAxis( newAxis, dark ));
			});
	
			// now build dropdown
			buildDropDown( userOptions );	
		};
		
		/*
		public
		*/
		return {
			init,
			addTrace, 
			selectedTrace: getTrace,
			selectedAxis: getAxis,
		};
	};
	
		
})( bluejay.namespace('oePlot'));
(function( oePlot ) {
	
	'use strict';
	
	/**
	* Build Regression lines for scatter data
	* @param {Array} values_x 
	* @param {Array} values_y
	* @returns {Object} - {[x],[y]}
	*/
	oePlot.findRegression = function(values_x, values_y){
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

})( bluejay.namespace('oePlot'));
(function( oePlot ) {
	
	'use strict';
	
	// tools need to use these colour helpers:
	oePlot.axisGridColor = ( dark ) => dark ? '#292929' : '#e6e6e6';
	oePlot.axisTickColor = ( dark ) => dark ? '#666' : '#ccc';
	
	/**
	* Build an axis object 
	* @param {Object} options - optional options for Axis
	* @param {Boolean} dark - use dark theme options?
	* @returns {Object} axis for layout
	*
	Options:
	{
		type: 'x' or 'y' 		// Required {String} axis 
		domain: false, 			// Optional {Array} e.g. [0, 0.75] (if subplot)
		title: false, 			// Optional {String}
		rightSide: false		// Options 	{String} - yAxis to overlay 'y'
		numTicks: false, 		// Optional {Number}
		useDates: false, 		// Options 	{Boolean}
		fixRange: false,		// Options 	{Boolean}
		range: false, 			// Optional {Array} e.g. [0, 100]
		axisType: false			// Optional {String} 
		useCategories: 			// Optional {Object} e.g. { showAll:true, categoryarray:[] }
		spikes: false, 			// Optional {Boolean}
		noMirrorLines: false	// Optional {Boolean}
	}
	*/
	
	
	oePlot.getAxis = function( options, dark ){ 
		
		// default 
		let axis = {
			linecolor: dark ? '#666' : '#999', // axis line colour
			linewidth:1,
			showgrid: true,
			gridcolor: oePlot.axisGridColor( dark ),
			tickmode: "auto",
			nticks: 10, // max. # of ticks. Actual # of ticks auto to be less than or equal to `nticks`. `tickmode` must be set to "auto".
			ticks: "outside",
			ticklen: 3, // px
			tickcolor: oePlot.axisTickColor( dark ),
			automargin: true, //  long tick labels automatically grow the figure margins.
			mirror: true, //  ( true | "ticks" | false | "all" | "allticks" )
			connectgaps: false, // this allows for 'null' value gaps! 
		};
		
		// axis? x or y
		const isY = options.type == 'y' ? true : false; 
		
		// balance axis lines on other side of plot area
		if( options.noMirrorLines ){
			axis.mirror = false;
		}
		
		// subplot?
		if( options.domain && isY ){
			axis.domain = options.domain;
		}
		
		// add titles to Axes?
		if( options.title ){
			axis.title = {
				text: options.title,
				standoff: isY ? 10 : 20, // px offset 
				font: {
					size: 12,
				}
			};
		}
		
		// mirror Y axis (left one has priority)
		if( options.rightSide && isY ){
			axis.overlaying = options.rightSide; // set to y1, y2, etc
			axis.side = 'right';
			axis.showgrid = false;
			axis.zeroline = false;
			axis.title.standoff = 15;
		}
		
		// set nticks
		if( options.maxAxisTicks ){
			axis.nticks = options.maxAxisTicks;
		}
		
		// use Dates? - OE data formatting
		if( options.useDates ){
			axis.tickformat = "%b %Y"; // d Mth Y	
		}
	
		// turn off zoom?
		if( options.fixRange ){
			axis.fixedrange = true;
		}
		
		// manually set axes data range
		if(options.range){
			axis.range = options.range;
		}
		
		// set range type... other wise Plotly will figure it out
		if(options.axisType){
			axis.type = options.axisType;
		}
		
		// categories (assuming this will only be used for yAxis)
		if(options.useCategories){
			let arr = options.useCategories.categoryarray;
			
			axis.type = "category";
			axis.categoryarray = arr;
			/*
			Category range. Each category is assigned a serial number from zero in the order it appears
			Using the "range" options I can "pad" the axis out or have fit the plot exactly
			*/
			if( options.useCategories.rangeFit ){
				switch( options.useCategories.rangeFit ){
					case "exact":		axis.range = [ 0, arr.length-1 ]; break;
					case "pad":			axis.range = [ -1, arr.length ]; break; 
					case "padTop":		axis.range = [ 0, arr.length ]; break;
					case "padBottom":	axis.range = [ -1, arr.length-1 ]; break; 
				}
			}
		}

		// spikes
		if(options.spikes){
			axis.showspikes = true; 
			axis.spikecolor = dark ? '#0ff' : '#00f';
			axis.spikethickness = dark ? 0.5 : 1;
			axis.spikedash = dark ? "1px,3px" : "2px,3px";
		}
		
		return axis;
	};
	
	
})( bluejay.namespace('oePlot'));
(function( oePlot ) {
	
	'use strict';
	
	/**
	* Build Plotly layout: colours and layout based on theme and standardised settings
	* @param {Object} options - quick reminder of 'options':
	* @returns {Object} layout themed for Plot.ly
	*
	Options:
	{
		darkTheme: "dark",  	// Required {Boolean} oePlot Theme  
		legend: false, 			// Optional {Boolean || Object} customise any of the defaults
		colors: 'varied', 		// Optional {String} varied" or "twoPosNeg" or "rightEye" (defaults to "blues")
		plotTitle: false, 		// Optional {String}
		xaxis: x1,				// Required {Object} xaxis
		yaxes: [ y1 ],			// Required {Array} all yaxes
		subplot: false,			// Optional {Number} number of 'rows' (number of verical plots)
		vLineLabel: false		// Optional {Object} e.g. { x: [ ... ], h: 0.75 }
		hLineLabel: false		// Optional {Object} e.g. { y: [ ... ], axis: 'y2' }
		rangeslider: false,		// Optional {Boolean || Array} e.g. [firstDate, lastDate]
		dateRangeButtons: false // Optional {Boolean}
	}
	*/
	oePlot.getLayout = function( options ){
		// set up layout colours based on OE theme settings: "dark" or "light"
		const dark = options.darkTheme;
		
		// build the Plotly layout obj
		const layout = {
			isDark: dark, // store OE dark theme in layout
			hovermode:'closest', // "x" | "y" | "closest" | false | "x unified" | "y unified"
			autosize:true, // onResize change chart size
			margin: {
				l:50, // 80 default, if Y axis has a title this will need more
				r:50, // change if y2 axis is added (see below)
				t:30, // if there is a title will need upping to 60
				b:40, // allow for xaxis title
				pad:4, // px between plotting area and the axis lines
				autoexpand:true, // auto margin expansion computations
			},
			// Paper = chart area. Set at opacity 0.5 for both, to hide the 'paper' set to: 0
			paper_bgcolor: dark ? 'rgba(30,46,66,0.5)' : 'rgba(255,255,255,0.5)',
			
			// actual plot area
			plot_bgcolor: dark ? 'rgb(10,10,30)' : '#fff',
			
			// base font settings
			font: {
				family: "Roboto, 'Open Sans', verdana, arial, sans-serif",
				size: 11,
				color: dark ? '#aaa' : '#333',
			},
			
			// default set up for hoverlabels
			hoverlabel: {
				bgcolor: dark ? "#003" : '#fff',
				bordercolor: dark ? '#009' : '#00f',
				font: {
					size: 11, // override base font
					color: oePlot.getBlue( dark ),
				}
			},
		    // Shapes and Annotations added through layoutAnnotations
			shapes: [],
			annotations: []
		};
	
		/*
		Colour theme	
		*/ 
		if( options.colors ){
			layout.colorway = oePlot.getColorSeries( options.colors, dark );			
		} else {
			layout.colorway = oePlot.getColorSeries( "default", dark );
		}
		
		/*
		Plot title
		*/
		if( options.plotTitle ){
			layout.title = {
				text: options.plotTitle,
				xref: 'paper', //  "container" | "paper" (as in, align too)
				yref: 'container', 
				x: 0, // 0 - 1
				y: 1,
				yanchor: 'top',
				pad: {
					t: 20 // px gap from top 
 				},
				font: {
					size: 15,
					// color:'#f00' - can override base font
				}, 		
			};
			// adjust the margin area
			layout.margin.t = 50;
		}
		
		/*
		Plot legend
		*/
		if( options.legend ){
			
			layout.showlegend = true; // default is true. 
			// basic set up for legend
			// note: if "legendgroup" is add to the data traces
			// the legends will be automatically grouped
			const legendDefaults = {
				font: {
					size: 9
				},
				itemclick: 'toggleothers', //  ( default: "toggle" | "toggleothers" | false )
 				orientation: 'h', // 'v' || 'h'		
				// traceorder: "grouped", // or "reversed+grouped"		
				xanchor:'right',
				yanchor:'bottom',
				x:1,
				y:1,
			};
			
			if( typeof options.legend === "boolean"){
				layout.legend = legendDefaults;
			} else {
				// customise the defaults
				layout.legend = Object.assign( legendDefaults, options.legend );				
			}
		} else {
			layout.showlegend = false; // defaults to true otherwise
		}
		
		
		/*
		Subplots (n charts on a single plot)
		Assumes always vertically stacked
		*/
		if( options.subplot ){
			layout.grid = {
		    	rows: options.subplot,
				columns: 1,
				pattern: 'independent',
			};
		}
		
		/*
		X & Y Axes
		*/
		if( options.xaxis ){
			layout.xaxis = options.xaxis; // only 1 axis per layout
			
			if( layout.xaxis.title ){
				layout.margin.b = 80;
			}
		}
		
		if( options.yaxes ){
			options.yaxes.forEach((y, index) => {
				if( index ){
					layout['yaxis'+(index + 1)] = y;
				} else {
					layout.yaxis = y;
				}
				
				if( y.title ){
					if( y.side == 'right' ){
						layout.margin.r = 80; // make spare for Y on the right?
					} else {
						layout.margin.l = 80; // make space for Y title
					}
				}	
			});
		}
		
		/*
		Add range slider to xaxis
		*/
		if(options.rangeSlider){
			
			const rangeslider = {
				thickness: 0.08
			};
			
			if(dark){
				// this is a pain. Plot.ly does not handles this well
				// can't find a setting to change the slide cover color!
				// it's set at a black opacity, so to make it usable...
				rangeslider.bgcolor = layout.paper_bgcolor;
				rangeslider.borderwidth = 1;
				rangeslider.bordercolor = layout.plot_bgcolor;
			} 
			
			
			/*
			if not a boolean assume a range array
			note: there is bug in Plot.ly (known) that this won't
			restrict the range, but it helps with the dateRangebuttons
			*/
			if( typeof options.rangeSlider !== "boolean" ){
				rangeslider.range = options.rangeSlider; 
			}
			
			// update layout:
			layout.xaxis.rangeslider = rangeslider;
			layout.margin.b = 15;
		}
		
		if( options.dateRangeButtons ){
			layout.xaxis.rangeselector = Object.assign({
				x:1,
				xanchor: 'right',
				buttons: [{
					label: 'Show all',
					step: "all",
				}, {
					label: '2 Yr',
					step: "year",
					count: 2, // 1 = year, 2 = 2 years
				}, {
					label: '1 Yr',
					step: "year",
					count: 1, // 1 = year, 2 = 2 years
				}, {
					label: '6 Mth',
					step: "month",
					count: 6, // 1 = year, 2 = 2 years
				}]
			}, oePlot.buttonStyling( dark ) );
		}
		
		// ok, all done
		return layout;
	};
	
	
})( bluejay.namespace('oePlot'));
(function( bj, oePlot ) {
	
	'use strict';
	
	/**
	* Build DIV
	* @param {String} hook - CSS hook for plot (just in case it's needed)
	* @returns {Element} <div>;
	*/
	oePlot.buildDiv = ( hook, width=false ) => {
		const div = bj.div('oeplot-wrap');
		div.classList.add( hook.toLowerCase());
		// force plotly to layout it's SVG container at the right width?
		if( width ) div.style.width = width;
		return div;
	};
	
	/**
	* Helper to work out first and last dates.
	* There is (was?) a bug in Plot.ly (known!) to do with the Navigator range
	* this helps fix that that issue, but it seems fixed in latest version 
	* @returns {Object} 
	*/
	oePlot.fullDateRange = () => ({
		all:[], 
		// pass in array of dates
		add( xArr ){
			this.all = this.all.concat( xArr );
			this.all.sort();
		}, 
		// used in the layout e.g: rangeSlider: helpers.dateRange.firstLast()
		// used on the xaxis e.g. range: helpers.dateRange.firstLast(),
		firstLast(){
			// watch out for null values
			let noNulls = this.all.filter(( i ) => i !== null );
			return [ noNulls[0], noNulls.pop() ];	
		},
	});
	
	/**
	* Click events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/ 
	oePlot.addClickEvent = ( div, eye ) => {
		div.on('plotly_click', (function( data ){
			const point = data.points[0];
			// pass back the JSON data relavant to the data clicked
			let obj = {
				eye,
				name: point.data.name,
				index: point.pointIndex,
				x: point.x,
				y: point.y 
			};
					
		    bj.customEvent('oePlotClick', obj );
		    bj.log('"oePlotClick" Event data: ' + JSON.stringify( obj ));
		}));
	};
	
	/**
	* Hover events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/
	oePlot.addHoverEvent = ( div, eye ) => {
		div.on('plotly_hover', (function( data ){
			const point = data.points[0];
			// pass back the JSON data relavant to the data clicked
			let obj = {
				eye,
				name: point.data.name,
				index: point.pointIndex,
				x: point.x,
				y: point.y 
			};
					
		    bj.customEvent('oePlotHover', obj );
		}));
	};
	
	
	/**
	* return setting for line in data
	* when multiple Eye data traces are added 
	* to a single plot they need to style themselves
	* @params {Object} args
	* @returns {Object} 'line'
	*/
	oePlot.dataLine = ( args ) => {
		let line = {};
		if( args.color )	line.color = args.color;
		if( args.dashed )	line = Object.assign( line, oePlot.dashedLine());
		return line;
	};
	
	/**
	* return settings for dashed "line" style in data
	* @returns {Object}
	*/
	oePlot.dashedLine = () => {
		return {
			dash: "2px,2px",
			width: 2,
		};
	};

	/**
	* return settings for "marker" style in data
	* @param {String} Event type: "Drugs", etc 
	* @returns {Object}
	*/
	oePlot.markerFor = ( type ) => {
		const marker = {};
		
		switch( type){
			case 'managment':
				marker.symbol = "square";
				marker.size = 9;
			break;
			case 'image':
				marker.symbol = "triangle-down";
				marker.size = 11;
			break;
			case 'drug':
				marker.symbol = "diamond";
				marker.size = 9;
			break;
			case 'injection':
				marker.symbol = "star-diamond";
				marker.size = 10;
			break; 
		}
		
		return marker;
	};
	
	
	/**
	* Consistent buttons styling
	* @param {String} type - 'image', 'drug', 'injection'  
	* @param {String} color - if data is styling itself
	* @returns {Object}
	*/
	oePlot.eventStyle = ( type, color=false ) => {
		const style = {
			marker: oePlot.markerFor( type )
		};
		
		switch( type ){
			case 'managment':
			case 'image':
			case 'injection':
				style.mode = "markers";
			break;
			case 'drug':
				style.mode = "lines+markers";
				style.line = {
					width: 3,
				};
			break; 
		}
		
		// add color, but preserve other properties
		if( color ){
			if( style.marker ) style.marker.color = color;
			if( style.line ) style.line.color = color;
		}
		
		return style;
	}; 
	
	/**
	* Consistent buttons styling
	* @param {Boolean} dark  
	* @returns {Object}
	*/
	oePlot.buttonStyling = ( dark ) => ({
		font: {
			color: dark ? '#ccc' : '#666',
		},
		bgcolor: dark ? 'rgb(30,46,66)' : 'rgb(255,255,255)', 
		activecolor: dark ? 'rgb(7,69,152)' : 'rgb(225,225,225)',
		bordercolor: dark ? 'rgb(10,26,36))' : 'rgb(255,255,255)',
		borderwidth: 2,
	}); 
	

	/**
	* Add Plotly dropdown to layouta
	* @param {Objec} layout
	*/
	oePlot.addDropDown = ( layout ) => {
	
		let buttons = [];
			
		buttons.push({ 	
			method: 'update', // 'data' & 'layout'
			args: ['visible', [true, false, false, false]],
			label: 'Option 1'						
		});
		
		buttons.push({ 	
			method: 'update', // update args: [data, layout] 
			// 'args' is an 
			args: [ {}, {
			    title: 'some new title', // updates the title
			    colorway: oePlot.getColorSeries( "default", true )
			}],
			//args2: layout,
			label: 'Options Title'						
		});
	
 		let menu = Object.assign({
			type: "dropdown",
			xanchor: 'left',
			yanchor: 'top',
			x: 0,
			y: 0.35,
			buttons: buttons, // add buttons to menu
 		}, oePlot.buttonStyling() );
 		
		
		// could be multiple menus
		layout.updatemenus = [ menu ];	
	};

	
})( bluejay, bluejay.namespace('oePlot'));
(function( oePlot ) {
	
	'use strict';
	
	/**
	* Highlight a point (marker) on a plotly chart.
	* This allows external JS to change a specific marker to blue
	* It needs to be externally controlled because of OCT viewing
	* i.e. the OCT stack will be controlled by another JS module
	* but as you go through the stack the associated marker on the
	* plotly chart should be flagged blue.
	* 
	* oePlot broadcasts a hover or click event. External JS then 
	* uses this to highlight the marker. It is returned from an init
	* in a template. see IDG Glaucoma OCT demo
	*/
	
	
	/**
	* Initiate with link to oePlot
	* @param {Map} myPlotly - to target
	* @returns {Function} for external API use
	*/
	oePlot.highlightPoint = ( myPlotly ) => {
		
		/**
		* External API 
		* @param {String} flattened objects e.g 'leftEye.OCT'
		* @param {Number} index of point
		*/
		return ( flattenedObj, indexPoint ) => {
			
			// find trace obj from flattened Object path
			let objPath = flattenedObj.split('.');
			
			if(objPath.length != 2){
				bj.log('oePlot - for highlightPoint to work it need side and trace name: "leftEye.OCT" ');
				return;
			}
			
			let eyeSide = objPath[0];
			let dataTraceName = objPath[1];
			let traceData, traceIndex;
			let i = 0;
			/*
			Have to loop through because i need an index ref to the array 
			passed in when Plotly is built
			*/
			myPlotly.get( eyeSide ).get('data').forEach((value, key) => {
				if( key === dataTraceName ){
					traceData = value;
					traceIndex = i;
				}
				i++;
			});
			
			/*
			Need do a bit of work with this.
			1) create an array of colors for ALL markers in trace in default eye colour
			2) set specific marker colour to blue
			3) re-layout	
			*/
			let eyeColor = oePlot.getColor( eyeSide, oePlot.isDarkTheme() );
			let markerColors = [];
			for( let i=0; i < traceData.x.length; i++ ){
				markerColors.push( eyeColor );
			}
			// set specific marker to blue
			markerColors[ indexPoint ] = oePlot.getColor( 'highlight', oePlot.isDarkTheme() );
			
			// get marker style for event type 
			let markerObj = oePlot.markerFor( traceData.oeEventType ); // added on creation of trace
			// add colors
			markerObj.color = markerColors;
			
			/**
			* RESTYLE Plotly directly!!
			*/
			Plotly.restyle( myPlotly.get( eyeSide ).get('div'), { 'marker': markerObj }, [ traceIndex ]);	
		};
	};
	
})( bluejay.namespace('oePlot'));
(function( oePlot ) {
	
	'use strict';
	
	/**
	* Add vertical annotations to plotly
	* @param {*} layout - plotly layout object
	* @param {Array} verticals - e.g. [ 'name' => 'SLT', 'x' => '2011-03-12' ]
	* @param {Number} height - the height of the line (0 to 1)
	*/ 
	oePlot.addLayoutVerticals = ( layout, verticals, height ) => {
		if( !Array.isArray( verticals) ) throw new Error('[oePlot] addLayoutVerticals - must be an Array');
		
		/**
		Map verticals against the templates:	
		*/
		const line = ({ x }) => {
			return {
		      type: 'line',
		      layer: 'above', // or "below"
		      yref: 'paper', // this means y & y0 are ratios of area (paper)
		      x0: x,
		      y0: 0,
		      x1: x,
		      y1: height,
		      line: {
		        color: oePlot.getBlue( oePlot.isDarkTheme()),
		        width: 0.5,
				//dash:"3px,4px,1px,4px,3px,1px",
		      }
		    };
		}; 
		const annotate = ({ name, x }) => {
			return {
			   showarrow: false,
			   text: name,
			   textangle: 90,
			   align: "left",
			   font: {
				   color: oePlot.getBlue( oePlot.isDarkTheme())
			   },
			   borderpad: 2,
			   x,
			   xshift: 8, // shift over so label isnt' on line? 
			   yref: "paper", // this means y is ratio of area (paper)
			   y: height 
		    };
		}; 
		
		/**
		* build layout arrays
		*/
		layout.shapes = layout.shapes.concat( verticals.map( line ));
	    layout.annotations = layout.annotations.concat( verticals.map( annotate ));
	};
	
	
	/**
	* Add vertical annotations to plotly
	* @param {*} layout - plotly layout object
	* @param {Array} horizontals - e.g. [ 'name' => 'Target IOP', 'y' => 15 ]
	* @param {String} yaxis - e.g. 'y3'
	*/ 
	oePlot.addLayoutHorizontals = ( layout, horizontals, yaxis ) => {
		if( !Array.isArray( horizontals )) throw new Error('[oePlot] addLayoutVerticals - must be an Array');
		
		/**
		Map horizontals against the templates:	
		*/
		// expecting an array of objects here
		const line = ({ y }) => {
			return {
		      type: 'line',
		      layer: 'below', // or "below"
		      xref: "paper", // this means x & x0 are ratios of area (paper)
		      yref: yaxis, // assign to a yaxis
		      x0: 0,
		      y0: y,
		      x1: 1,
		      y1: y,
		      line: {
		        color: oePlot.getBlue( oePlot.isDarkTheme()),
		        width: 2,
		        dash:"3px,12px",
		      }
		    };
		}; 
		const annotate = ({ name, y }) => {
			return {
			   showarrow: false,
			   text: name,
			   align: "left",
			   font: {
				   color: oePlot.getBlue( oePlot.isDarkTheme())
			   },
			   borderpad: 2,
			   xref: "paper",
			   x:0,
			   yshift: 8, // shift over so label isnt' too close to the axis 
			   yref: yaxis, // assign to the yaxis
			   y: y 
		    };
		}; 
			
		/**
		* build layout arrays
		*/	
		layout.shapes = layout.shapes.concat( horizontals.map( line ));
	    layout.annotations = layout.annotations.concat( horizontals.map( annotate ));
	};
	
})( bluejay.namespace('oePlot'));
(function( bj, oePlot ) {
	
	'use strict';
	
	oePlot.tools = () => {
		
		const toolbar = bj.div('oeplot-toolbar');
	
		/**
		* Update the associated oePlot
		* User changes to the tools require a re-rendering of the plot
		* There may be 2 plots. e.g. "rightEye", "leftEye".
		*/
		const plot = {
			_render: null, 
			_plots: null,
			setReacts( plotlyReacts, names = false ){
				this._render = plotlyReacts;
				this._plots = names;
			},
			update(){
				this._plots.forEach( plot => this._render( plot ));
			}
		};	
		
		/**
		* showToolbar (update DOM)
		* In OES the toolbar is fullwidth and fixed, requires "with-toolbar"
		* to add margin-bottom to not cover the plots
		*/
		const showToolbar = () => {
			const parent = document.querySelector('.oeplot');
			parent.classList.add('with-toolbar');
			parent.append( toolbar ); // reflow!
		};
		
		/**
		* Tabular data is provide by the PHP. It adds a <table> hidden
		* in the DOM. It's ID is passed into oePlot with the JSON
		* Here it's moved into a proper popup
		*/
		const tabularData = {
			_popup: null,
			/**
			* Move the <table> into popup DOM and build a button in the toolbar
			* @param {String} tableID
			*/
			add( tableID ){
				const popup = bj.div('oe-popup-wrap');
				this._popup = popup;
				
				popup.innerHTML = [
					'<div class="oe-popup">',
					'<div class="title">Tabular Data of plots</div>',
					'<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>',
					'<div class="oe-popup-content max"></div>',
					'</div>',
				].join('');
				
				const table = document.getElementById( tableID );
				popup.querySelector('.oe-popup-content').append( table ); // move <table> out of DOM and into the popup:
				bj.show( table );	
				
				// add a button to the toolbar
				const div = bj.div('plot-tool');
				const button = document.createElement('button');
				button.textContent = "View tabular data of plots";
				div.append( button );
				
				button.addEventListener('click', ( ev ) => {
					ev.preventDefault();
					ev.stopPropagation();
					this.show(); // all it can do it show. popup-wrap covers it
 				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}, 
			show(){
				document.body.append( this._popup );
				this._popup.querySelector('.close-icon-btn').addEventListener("mousedown", ( ev ) => {
					ev.stopPropagation();
					this.hide();
				}, {once:true} );
			}, 
			hide(){
				this._popup.remove();
			}
		};
		
		/**
		* Expose the plotly API for hoverMode options
		* Allows users to choose, but defaults to DA preferred option
		*/
		const hoverMode = {
			_mode: 'closest', // 'closest', // "x" | "y" | "closest" | false | "x unified" | "y unified"
			getMode(){
				return this._mode;	
			},
			add(){
				const div = bj.div('plot-tool');
				div.innerHTML = Mustache.render([
					'<label>Labels</label>',
					'<select>{{#options}}',
					'<option value="{{key}}" {{#selected}}selected{{/selected}}>{{option}}</option>',
					'{{/options}}</select>'
				].join(''), {
					options: [
						{ key: 'closest', option: 'Single', selected: true },
						{ key: 'x', option: 'Closest', selected: false },
						{ key: 'x unified', option: 'Grouped', selected: false },
					],
				});
				
				div.querySelector('select').addEventListener('change',  ( ev ) => {
					const select = ev.target;
					this._mode = select.options[ select.selectedIndex ].value;
					plot.update();
				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}
		};
		
		/**
		* User selectable units
		* Need to store the traces and the axies to update plotly
		*/
		const selectableUnits = {
			traces: new Map(),
			axes: new Map(),
			activeKey: null, // store the current activeKey
			
			/**
			Getters
			Traces will depend on the eye side
			Axis is the same for each eye side
			*/
			getTrace( eye, key ){
				return this.traces.get( eye ).get( this.activeKey );
			},
			getAxis( key ){
				return this.axes.get( this.activeKey );
			},
			
			/**
			* Setters
			*
			* addTrace, the trace object is built in the template
			* @param {String} eye - e.g. "rightEye" or "leftEye"
			* @param {String} key - the array 'key' from the JSON
			* @param {Object} trace - plotly trace object
			*/
			addTrace( eye, key, trace ){
				if( !this.traces.has( eye )) this.traces.set( eye, new Map());
				this.traces.get( eye ).set( key, trace );
			}, 

			/**
			* addAxes (same for both eye side)
			* @param {Object} deconstructed:
			* - axisDefaults are the defaults needed
			* - yaxes: the JSON from PHP
			* - prefix: e.g. "VA"
			*/
			addAxes({ axisDefaults, yaxes:json, prefix }){
				// store the user options for the dropdown UI
				const selectOptions = [];
				
				// loop through the JSON
				for( const [ key, unit ] of Object.entries( json )){
					
					// default unit?
					if( unit.makeDefault ) this.activeKey = key;
					
					// axis title
					axisDefaults.title = `${prefix} - ${unit.option}`;
					
					// based on the unit range type build axis:
					let axis; 
					if( typeof unit.range[0] === 'number'){
						// number range
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							range: unit.range, 	// e.g. [n1, n2];
							axisType: "linear", 			// set the axis.type explicitly here
						}), oePlot.isDarkTheme()); 
						
					} else {
						// category axis
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							useCategories: {
								showAll: true, 
								categoryarray: unit.range
							}
						}), oePlot.isDarkTheme()); 
					}
					
					// add the axis to unit axes
					this.axes.set( key, axis );
					// add to user options
					selectOptions.push({ key, option: unit.option, selected: unit.makeDefault });
				}
				
				this.buildDropDown( selectOptions, prefix );
			}, 
			
			/**
			* Build <select> for user to choose units
			* @param {Array} options { key, option }
			* @param {String} prefix
			*/
			buildDropDown( options, prefix ){
				const div = bj.div('plot-tool');
				div.innerHTML = Mustache.render([
					'<label>{{prefix}}</label>',
					'<select>{{#options}}',
					'<option value="{{key}}" {{#selected}}selected{{/selected}}>{{option}}</option>',
					'{{/options}}</select>'
				].join(''), { options, prefix });
				
				div.querySelector('select').addEventListener('change',  ( ev ) => {
					const select = ev.target;
					this.activeKey = select.options[ select.selectedIndex ].value;
					plot.update();
				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}, 
			
			/**
			* If there is a theme change these colours in the Axes need changing
			*/
			updateAxesColors(){
				const axesIterator = this.axes.values();
				for( const axis of axesIterator ){
					axis.gridcolor = oePlot.axisGridColor( oePlot.isDarkTheme());
					axis.tickcolor = oePlot.axisTickColor( oePlot.isDarkTheme());
				}
			},
			
			/**
			* If there is a theme change traces are rebuilt
			*/
			clearTraces(){
				this.traces.clear();
			}			
		};
	
		/*
		API
		*/
		return {
			plot,
			tabularData,
			hoverMode,
			selectableUnits,
			showToolbar,
		};
	};

	
		
})( bluejay, bluejay.namespace('oePlot'));
(function( bj, oePlot ){

	'use strict';
	
	const oesTemplateType = "Patient Popup"; // used in ID for div
	
	// oe CSS theme - fixed, because in Patient Popup
	const darkTheme = true; 
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye' or 'BEO'
	* @param {Array} colorsArr  
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide, colorsArr  ) => {
		
		// a helper to loop through the color array
		const getColour = (() => {
			let i = 0;
			return () => {
				let c = i++;
				if( i >= colorsArr.length ) i = 0; 
				return colorsArr[ c ];
			};
		})();
		
		
		/**
		* store data traces with own keys
		* traces can then be accessed by their JSON name
		*/
		myPlotly.get( eyeSide ).set('data', new Map());
		
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dataLine({
				color: getColour()
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.VA.offScale.name, VA_offScale);
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,	
			yaxis: 'y2',	
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dataLine({
				color: getColour(),
				dashed: true,
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);
		
		
		const VA = {
			x: eyeJSON.VA.units.x,
			y: eyeJSON.VA.units.y,
			name: eyeJSON.VA.units.name,
			yaxis: 'y3',		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dataLine({
				color: getColour()
			}),
		};
				
		myPlotly.get( eyeSide ).get('data').set( 'VA', VA );

	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = () => {
		/*
		Single plot can have RE, LE or BEO
		Update all available traces and build data trace array
		*/
		let eyeKeys = ['rightEye', 'leftEye' ];
		let data = [];
		
		eyeKeys.forEach(( key ) => {
			if( myPlotly.has( key )){
				
				let eyePlot = myPlotly.get( key ).get('data'); 
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		}); 
		
		// build new (or rebuild)
		Plotly.react(
			myPlotly.get('div'), 
			data, 
			myPlotly.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} axes
	*/
	const plotlyInitCombined = ( axes ) => {

		const layout = oePlot.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'top',
				y:1,
			},
			//plotTitle: 'Right, Left and BEO',
			xaxis: axes.x,
			yaxes: axes.y,
			subplot: 2,	 // offScale, VA 
		});
		
		/*
		For the popup I couldn't get plotly to resize to available width
		without adding a specific width!	
		*/
		const div = oePlot.buildDiv(`${oesTemplateType}`, '415px', '415px', '1020px'); // 1020px best guess based on 1280px layout
		document.getElementById('patient-popup-oeplolty').appendChild( div );
		
		/**
		Comnbined data plots, therefore only 1 <div> and only 1 'layout'
		*/
		myPlotly.set('div', div);
		myPlotly.set('layout', layout);
		
		// build
		plotlyReacts();
		
		// set up click through
		oePlot.addClickEvent( div, '?' );
		oePlot.addHoverEvent( div, '?' );
		
		// bluejay custom event (user changes layout)
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		return;
		
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}
		
		// for all subplot rows
		const domainRow = [
			[0, 0.15],
			[0.2, 1],
		];
		
		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye',
				oePlot.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlot.getColorSeries('leftEyeSeries', darkTheme)
			);
		}
		

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlot.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlot.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650], // hard coded range
			spikes: true,
		}, darkTheme );
		
		// y2 - VA
		const y2 = oePlot.getAxis({
			type:'y',
			domain: domainRow[1], 
			title: 'VA',
			rightSide: 'y2',
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.unitRanges.snellenMetre.range.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		
		plotlyInitCombined({
			x: x1, 
			y: [ y0, y1, y2 ],
		});	
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotPatientPopup', init);	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function( bj, oePlot ){

	'use strict';
	
	const oesTemplateType = "Bar Chart";
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
	
		const trace = {
			y: json.data.y,
			name: json.data.name,		
			type: 'bar'
		};
		
		// optional settings
		
		if( json.data.x ){
			trace.x = json.data.x;
		}
		
		if( json.data.hovertemplate ){
			trace.hovertemplate = json.data.hovertemplate;
		}
		
		/*
		Data trace array
		*/
		return [ trace ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
		});
		
		// stack the 2 yaxis
		layout.barmode = 'stack';
			
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			setup.data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 20,
		}, darkTheme );
		
		// y1
		const y1 = oePlot.getAxis({
			type:'y', 
			numTicks: 20,
		}, darkTheme );
		
		// optional
		if( json.title.xaxis ){
			x1.title = json.title.xaxis;
		}
		
		if( json.title.yaxis ){
			y1.title = json.title.yaxis;
		}
		
		
		/**
		* Layout & Build - Eyes
		*/	
		console.log( json );
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			title: json.title.plot,
			data,
			xaxis: x1, 
			yaxes: [ y1 ],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotBarChart', init);	
	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Bar Percent Complete";
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
		
		let percentIncomplete = json.percentComplete.map( p => 100 - p );
		
		const complete = {
			x: json.xAxis,
			y: json.percentComplete,
			name: '',		
			hovertemplate: 'Complete<br>%{y}%',
			type: 'bar'
		};
		
		const incomplete = {
			x: json.xAxis,
			y: percentIncomplete,
			name: '',		
			hovertemplate: 'Incomplete<br>%{y}%',
			type: 'bar'
		};
	
		/*
		Data trace array
		*/
		return [ complete, incomplete ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			colors: 'posNeg',
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
		});
		
		// stack the 2 yaxis
		layout.barmode = 'stack';
			
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			setup.data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 20,
		}, darkTheme );
		
		
		// y1
		const y1 = oePlot.getAxis({
			type:'y', 
			range: [0, 100],
			numTicks: 20,
		}, darkTheme );
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			data,
			xaxis: x1, 
			yaxes: [ y1 ],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotBarPercentComplete', init);	
	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Combined Medical Retina"; // used in ID for div
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	/**
	* Helpers
	*/
	const dateRange = oePlot.fullDateRange();
	const userSelecterUnits = oePlot.selectableUnits();
	
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye' or 'BEO'
	* @param {Array} colorsArr  
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide, colorsArr  ) => {
		
		// a helper to loop through the color array
		const getColour = (() => {
			let i = 0;
			return () => {
				let c = i++;
				if( i >= colorsArr.length ) i = 0; 
				return colorsArr[ c ];
			};
		})();
		
		
		/**
		* store data traces with own keys
		* traces can then be accessed by their JSON name
		*/
		myPlotly.get( eyeSide ).set('data', new Map());
		
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dataLine({
				color: getColour()
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.VA.offScale.name, VA_offScale);
		dateRange.add( eyeJSON.VA.offScale.x );
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,	
			yaxis: 'y2',	
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dataLine({
				color: getColour(),
				dashed: true,
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);
		dateRange.add( eyeJSON.CRT.x );
		
		/**
		* User selectable VA data traces
		*/
		
		const vaColorTrace = getColour();
		
		Object.values( eyeJSON.VA.units ).forEach(( unit, index ) => {
			
			userSelecterUnits.addTrace( eyeSide, {
				x: unit.x,
				y: unit.y,
				name: unit.name,	
				yaxis: 'y3',	
				hovertemplate: unit.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
				line: oePlot.dataLine({
					color: vaColorTrace
				}),
			});
			
			// only need to check one of these dates
			if( !index ) dateRange.add( unit.x );
		});
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', userSelecterUnits.selectedTrace( eyeSide ));

	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = () => {
		/*
		Single plot can have RE, LE or BEO
		Update all available traces and build data trace array
		*/
		let eyeKeys = ['rightEye', 'leftEye', 'BEO'];
		let data = [];
		
		eyeKeys.forEach(( key ) => {
			if( myPlotly.has( key )){
				
				let eyePlot = myPlotly.get( key ).get('data'); 
				
				// update VA data
				eyePlot.set('VA', userSelecterUnits.selectedTrace( key ));
				
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		}); 
		
		// make sure variable yAxis is updated
		myPlotly.get('layout').yaxis3 = Object.assign({}, userSelecterUnits.selectedAxis());
		
		// build new (or rebuild)
		Plotly.react(
			myPlotly.get('div'), 
			data, 
			myPlotly.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} axes
	*/
	const plotlyInitCombined = ( axes ) => {

		const layout = oePlot.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'top',
				y:1,
			},
			plotTitle: 'Right, Left and BEO',
			xaxis: axes.x,
			yaxes: axes.y,
			subplot: 2,	 // offScale, VA 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
		});
		
		
		const div = oePlot.buildDiv(`${oesTemplateType}`, '80vh', '650px');
		document.querySelector( '.oes-left-side' ).appendChild( div );
		
		/**
		Comnbined data plots, therefore only 1 <div> and only 1 'layout'
		*/
		myPlotly.set('div', div);
		myPlotly.set('layout', layout);
		
		// build
		plotlyReacts();
		
		// set up click through
		oePlot.addClickEvent( div, '?' );
		oePlot.addHoverEvent( div, '?' );
		
		// bluejay custom event (user changes layout)
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}
		
		// for all subplot rows
		const domainRow = [
			[0, 0.15],
			[0.2, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			darkTheme,
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
				rightSide: 'y2',
				domain: domainRow[1],
				title: 'VA',  // prefix for title
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges ),
		});


		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye',
				oePlot.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlot.getColorSeries('leftEyeSeries', darkTheme)
			);
		}
		
		if( json.BEO ){
			myPlotly.set('BEO', new Map());
			buildDataTraces( json.BEO, 'BEO', 
				oePlot.getColorSeries('BEOSeries', darkTheme)
			);
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			range: dateRange.firstLast(), 
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlot.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlot.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650], // hard coded range
			spikes: true,
		}, darkTheme );
		
		/*
		* Dynamic axis
		* VA axis depends on selected unit state
		*/
		const y2 = userSelecterUnits.selectedAxis();
		
		
		plotlyInitCombined({
			x: x1, 
			y: [ y0, y1, y2 ],
		});	
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotCombinedMedRet', init);	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Combined Medical Retina"; // used in ID for div
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye' or 'BEO'
	* @param {Array} colorsArr  
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide, colorsArr  ) => {
		
		// a helper to loop through the color array
		const getColour = (() => {
			let i = 0;
			return () => {
				let c = i++;
				if( i >= colorsArr.length ) i = 0; 
				return colorsArr[ c ];
			};
		})();
		
		
		/**
		* store data traces with own keys
		* traces can then be accessed by their JSON name
		*/
		myPlotly.get( eyeSide ).set('data', new Map());
		
		const VA = {
			x: eyeJSON.VA.x,
			y: eyeJSON.VA.y,
			name: 'VA',		
			hovertemplate: 'Mean ± SD<br>VA: %{y}<br>(N: %{x})',
			type: 'scatter',
			mode: 'lines+markers',
			yaxis:'y2',
			line: oePlot.dataLine({
				color: getColour()
			}),
			error_y: {
			  type: 'data',
			  array: eyeJSON.VA.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', VA );
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: 'CRT',		
			hovertemplate: 'Mean ± SD<br>CRT: %{y}<br>(N: %{x})',
			type: 'scatter',
			line: oePlot.dataLine({
				color: getColour(),
				dashed: true,
			}),
			error_y: {
			  type: 'data',
			  array: eyeJSON.CRT.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);

	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = () => {
		/*
		Single plot can have RE, LE or BEO
		Update all available traces and build data trace array
		*/
		let eyeKeys = ['rightEye', 'leftEye', 'BEO'];
		let data = [];
		
		eyeKeys.forEach(( key ) => {
			if( myPlotly.has( key )){
				
				let eyePlot = myPlotly.get( key ).get('data'); 
				
				// update VA data
				eyePlot.set('VA', userSelecterUnits.selectedTrace( key ));
				
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		}); 
		
		// make sure variable yAxis is updated
		myPlotly.get('layout').yaxis3 = Object.assign({}, userSelecterUnits.selectedAxis());
		
		// build new (or rebuild)
		Plotly.react(
			myPlotly.get('div'), 
			data, 
			myPlotly.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			legend: true,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			rangeSlider: true,
		});
		
		// build the combined data for Left and Right into a single data array
		let data = [];
		
		['rightEye', 'leftEye'].forEach(( key ) => {
			
			if( myPlotly.has( key )){
				let eyePlot = myPlotly.get( key ).get('data'); 
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		});
		
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}
		
		// for all subplot rows
		const domainRow = [
			[0, 0.15],
			[0.2, 1],
		];


		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye',
				oePlot.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlot.getColorSeries('leftEyeSeries', darkTheme)
			);
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );

		
		// y1 - CRT
		const y1 = oePlot.getAxis({
			type:'y',
			title: 'CRT', 
			range: json.yaxis.CRT, // hard coded range
			spikes: true,
		}, darkTheme );
		
		// y2 - VA (logMar or whatever is passed in)
		const y2 = oePlot.getAxis({
			type:'y',
			title: 'VA', 
			range: json.yaxis.VA, // hard coded range
			rightSide: 'y1',
			spikes: true,
		}, darkTheme );
		
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			xaxis: x1, 
			yaxes: [ y1, y2 ],
		});
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotCombinedOutcomesWithErrors', init);	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Outcomes with Error bars";
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
		
		const VA = {
			x: json.VA.x,
			y: json.VA.y,
			name: 'VA',		
			hovertemplate: 'Mean ± SD<br>VA: %{y}<br>(N: %{x})',
			type: 'scatter',
			yaxis:'y1',
			error_y: {
			  type: 'data',
			  array: json.VA.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		const IOP = {
			x: json.IOP.x,
			y: json.IOP.y,
			name: 'IOP',		
			hovertemplate: 'Mean ± SD<br>IOP: %{y}<br>(N: %{x})',
			type: 'scatter',
			yaxis:'y2',
			error_y: {
			  type: 'data',
			  array: json.IOP.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
	
		/*
		Data trace array
		*/
		return [ VA, IOP ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			colors: 'varied',
			legend: true,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			rangeSlider: true,
		});
		
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			setup.data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			title: 'Weeks',
			numTicks: 20,
			range: [-20, 220],
		}, darkTheme );
		
		
		// y1
		const y1 = oePlot.getAxis({
			type:'y', 
			title: 'VA (change) from baseline (LogMAR)',
			range: [70, 110],
			numTicks: 20,
		}, darkTheme );
		
		// y2
		const y2 = oePlot.getAxis({
			type:'y', 
			title: 'IOP (mm Hg))',
			rightSide: 'y1',
			numTicks: 20,
		}, darkTheme );
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			data,
			xaxis: x1, 
			yaxes: [ y1, y2],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotOutcomesWithErrors', init);	
	
		
})( bluejay, bluejay.namespace('oePlot')); 
(function( bj, oePlot ){

	'use strict';
	
	// oePlot required. Tools needs this
	if( document.querySelector('.oeplot') == null ) return;
	
	/**
	* OES Glaucoma
	* Sub-plot layout
	* |- Events: Injection, Images (OCT), Managment (Inj Mgmt & Clinical Mgmt)
	* |- CRT & VA (VA has multiple units)
	* |- Offscale: CF, HM, PL, NPL
	* |- [Navigator] 
	*
	* Domain allocation for layout: (note: 0 - 1, 0 is the bottom)
	* Using subploting within plot.ly - Navigator outside this
	*/
	const domainLayout = [
		[0.82, 1],		// Events		y5
		[0.47, 0.77],	// IOP			y4
		[0.1, 0.42],	// VFI | VA		y2 | y3
		[0, 0.1],		// Offscale		y1 (y)
	];
	
	// Plotly: hold all parameters for each plot (R & L)
	const myPlotly = new Map();	
	
	// tools
	let tools = null; 
	
	/**
	* Build data traces for Plotly
	* traces are stored in myPlotly Map.
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye'
	*/
	const buildDataTraces = ( eyeJSON, eyeSide ) => {
	
		// VA offscale: CF, HM, PL, NPL
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}<extra></extra>', // "<extra>" - is the "extra" box that shows trace name
			yaxis: 'y', //  default is "y", not "y1"!! ... "y2" would refer to `layout.yaxis2`
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const VFI = {
			x: eyeJSON.VFI.x,
			y: eyeJSON.VFI.y,
			name: eyeJSON.VFI.name,	
			yaxis: 'y2',	
			hovertemplate: '%{y}<br>%{x}<extra></extra>',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dashedLine(),
		};
		
		const IOP = {
			x: eyeJSON.IOP.x,
			y: eyeJSON.IOP.y,
			name: eyeJSON.IOP.name,		
			yaxis: 'y4',
			hovertemplate: 'IOP: %{y}<br>%{x}<extra></extra>', 	
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		/**
		VA data traces can be changed by the User, e.g. Snellen Metre, logMAR, etc
		the trace AND it's axis layout need to be stored together. This is what
		userSelectedUnits handles.
		*/
		for (const [ key, trace ] of Object.entries( eyeJSON.VA.units )){
			tools.selectableUnits.addTrace( eyeSide, key, {
				x: trace.x,
				y: trace.y,
				name: trace.name,	
				yaxis: 'y3',	
				hovertemplate: trace.name + ': %{y}<br>%{x}<extra></extra>',
				type: 'scatter',
				mode: 'lines+markers',
			});
		}

		/**
		Store data traces in myPlotly
		*/
		myPlotly.set( eyeSide, new Map());
		myPlotly.get( eyeSide ).set('data', new Map());
		myPlotly.get( eyeSide ).get('data').set( VA_offScale.name, VA_offScale);
		myPlotly.get( eyeSide ).get('data').set( VFI.name, VFI);
		myPlotly.get( eyeSide ).get('data').set( IOP.name, IOP);
		myPlotly.get( eyeSide ).get('data').set( 'VA', tools.selectableUnits.getTrace( eyeSide ));
		
		/**
		Event data are all individual traces
		all the Y values are are the SAME, so that are shown on a line
		extra data for the popup can be passed in with customdata
		*/
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			const newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y5',
					hovertemplate: event.customdata ? '%{y}<br>%{customdata}<br>%{x}<extra></extra>' : '%{y}<br>%{x}<extra></extra>',
					type: 'scatter',
					showlegend: false,
				}, oePlot.eventStyle(  event.event ));
			
			myPlotly.get( eyeSide ).get('data').set( newEvent.name, newEvent);
		});		
	};
		
	/**
	* React to user request to change VA scale 
	* @callback: Tools will update this
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		if( !myPlotly.has( eyeSide )) return;
		
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide );
		
		// Check the user selected units for VA and update the correct axis
		eyePlot.get('data').set('VA', tools.selectableUnits.getTrace( eyeSide ));
		eyePlot.get('layout').yaxis3 = tools.selectableUnits.getAxis();
		
		// Check hoverMode setting
		eyePlot.get('layout').hovermode = tools.hoverMode.getMode();
		
		/**
		* Plot.ly!
		* Build new (or rebuild) have to use react()
		*/
		Plotly.react(
			eyePlot.get('div'), 
			Array.from( eyePlot.get('data').values()), // Data Array of ALL traces
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	
	/**
	* After init - build layout and initialise Plotly 
	* @param {Object} setup - deconstructed
	*/
	const plotlyInit = ({ title, eyeSide, colors, xaxis, yaxes, procedures, targetIOP, parentDOM }) => {
		/*
		Ensure parentDOM is empty (theme switch re-build issue otherwise!)
		*/
		const parent = document.querySelector( parentDOM );
		bj.empty( parent );
		
		// Need a wrapper to help with the CSS layout		
		const div = oePlot.buildDiv(`oes-${eyeSide}`);
		parent.append( div );
	
		/*
		Build layout
		*/
		const layout = oePlot.getLayout({
			darkTheme: oePlot.isDarkTheme(), // link to CSS theme
			legend: {
				traceorder: "reversed",
				yanchor:'bottom',
				y:domainLayout[1][1],
			},
			colors,
			plotTitle: title,
			xaxis: xaxis,
			yaxes: yaxes,
			subplot: domainLayout.length, // num of sub-plots 
			rangeSlider: true,
			dateRangeButtons: true,
		});
		
		// e.g vertical lines with labels
		if( procedures ){
			oePlot.addLayoutVerticals( layout, Object.values( procedures ), domainLayout[1][1]);
		}
		
		// e.g horizontal lines with labels
		if( targetIOP ){
			oePlot.addLayoutHorizontals( layout, Object.values( targetIOP ), 'y4');
		}
					
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
	
		/* 
		bluejay custom event
		User changes layout arrangement (top split view, etc)
		*/
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	* @param {Boolean} isThemeChange - user event requires a rebuild
	*/
	const init = ( json, isThemeChange = false ) => {
		if( json === null ) throw new Error('[oePlot] Sorry, no JSON data!');
		bj.log(`[oePlot] - OES Glaucoma`);
		
		/**
		* When a users changes themes EVERYTHING needs rebuilding
		* the only way (I think) to do this is to re-initialise
		*/
		myPlotly.clear();
		
		/**
		* oePlot tools
		* Allows the user to access extra chart functionality
		* tools will add a fixed toolbar DOM to the page.
		*
		* Tools are not effected by a theme switch, CSS will 
		* re-style them, but the traces and axes need updating
		*/
		if( tools == null ){
			tools = oePlot.tools();
			tools.plot.setReacts( plotlyReacts, ['rightEye', 'leftEye']);
			tools.hoverMode.add(); // user hoverMode options for labels
			
			// VA has dynamic axis based, e.g. SnellenMetre, LogMAR, etc
			tools.selectableUnits.addAxes({
				axisDefaults: {
					type:'y',
					rightSide: 'y2',
					domain: domainLayout[2],
					title: 'VA',  // prefix for title
					spikes: true,
				}, 
				yaxes: json.yaxis.VA,
				prefix: 'VA',
			});
			
			// check for tabular data:
			if( json.tabularDataID ){
				tools.tabularData.add( json.tabularDataID );
			}
			
			tools.showToolbar(); // update DOM
		} else {
			// rebuilding...
			tools.selectableUnits.clearTraces();
			tools.selectableUnits.updateAxesColors();
		}
		
		/**
		* Traces - build data traces from JSON 
		*/
		
		if( json.rightEye ){
			buildDataTraces( json.rightEye, 'rightEye' );
		}
		
		if( json.leftEye ){
			buildDataTraces( json.leftEye, 'leftEye' );
		}
	
		/**
		* Axes 
		*/
		
		// VA
		// set Y3 to the "makeDefault" unit. User can change this with the "tools"
		const y3 = tools.selectableUnits.getAxis();
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true, 
			spikes: true,
			noMirrorLines: true,
		}, oePlot.isDarkTheme());
		
		
		// offscale y1 ("y")
		const y1 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[3], 
			useCategories: {
				categoryarray: json.yaxis.offScale,
				rangeFit: "padTop", // "exact", etc,
			},
			spikes: true,
		}, oePlot.isDarkTheme());
		
		// VFI
		const y2 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[2],
			title: 'VFI',
			range: json.yaxis.VFI,
			spikes: true,
			maxAxisTicks: 12,
		}, oePlot.isDarkTheme());
		
		// IOP
		const y4 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[1],
			title: 'IOP', 
			range: json.yaxis.IOP,
			maxAxisTicks: 12,
			spikes: true,
		}, oePlot.isDarkTheme());
		
		// Events
		const y5 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[0],
			useCategories: {
				categoryarray: json.allEvents,
				rangeFit: "pad", // "exact", etc
			},
			spikes: true,
		}, oePlot.isDarkTheme());
		
	
		/**
		* Layout & Build - Eyes
		*/	
		if( myPlotly.has('rightEye') ){
			
			plotlyInit({
				title: "Right Eye",
				eyeSide: 'rightEye',
				colors: "rightEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4, y5 ],
				procedures: json.rightEye.procedures,
				targetIOP: json.rightEye.targetIOP,
				parentDOM: '.oes-left-side',
			});
		} 
	
		if( myPlotly.has('leftEye') ){
			
			plotlyInit({
				title: "Left Eye",
				eyeSide: 'leftEye',
				colors: "leftEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4, y5 ],
				procedures: json.leftEye.procedures,
				targetIOP: json.leftEye.targetIOP,
				parentDOM: '.oes-right-side',
			});
		}
		
		/**
		* OE Theme change
		* Users changes the theme, re-initialise with the stored JSON
		* note: once!
		*/
		document.addEventListener('oeThemeChange', () => {
			// give the browser time to adjust the CSS
			setTimeout(() => init( json, true ), 100 ); 
		}, { once: true });
		
		
		/**
		* First init... 
		*/
		if( isThemeChange == false ){
			
			bj.log('[oePlot] Click and Hover Events available (click point to see data structure)');
			
			['rightEye', 'leftEye'].forEach( eyeSide => {
				if( !myPlotly.has( eyeSide )) return;
				const div = myPlotly.get( eyeSide ).get('div');
				oePlot.addClickEvent( div, eyeSide );
				oePlot.addHoverEvent( div, eyeSide );
			});
			
			/* 
			API, allow external JS to be able to highlight a specific marker
			*/
			return { highlightPoint: oePlot.highlightPoint( myPlotly )};
		}
	};

	
	/**
	* Extend blueJS
	* PHP will call this directly with JSON when DOM is loaded
	*/
	bj.extend('plotSummaryGlaucoma', init );	
	
	
})( bluejay, bluejay.namespace('oePlot')); 
(function( bj, oePlot ){

	'use strict';
	
	// oePlot required. Tools needs this
	if( document.querySelector('.oeplot') == null ) return;
	
	/**
	* OES Medical Retina R/L template
	* Sub-plot layout
	* |- Events: Injection, Images (OCT), Managment (Inj Mgmt & Clinical Mgmt)
	* |- CRT & VA (VA has multiple units)
	* |- Offscale: CF, HM, PL, NPL
	* |- [Navigator] 
	*
	* Domain allocation for layout: (note: 0 - 1, 0 is the bottom)
	* Using subploting within plot.ly - Navigator outside this
	*/
	const domainLayout = [
		[0.7, 1], 		// Events		y4
		[0.15, 0.64],	// CRT | VA		y2 | y3 
		[0, 0.15],		// Offscale		y1 (y) 
	];
	
	// Plotly: hold all parameters for each plot (R & L)
	const myPlotly = new Map();	
	
	// tools
	let tools = null; 
	
	/**
	* Build data traces for Plotly
	* traces are stored in myPlotly Map.
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye'
	*/
	const buildDataTraces = ( eyeJSON, eyeSide  ) => {
		
		// VA offscale: CF, HM, PL, NPL
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}<extra></extra>', // "<extra>" - is the "extra" box that shows trace name 
			yaxis: 'y', //  default is "y", not "y1"!! ... "y2" would refer to `layout.yaxis2`
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,	
			yaxis: 'y2',	
			hovertemplate: 'CRT: %{y}<br>%{x}<extra></extra>',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dashedLine(),
		};
	
		/**
		VA data traces can be changed by the User, e.g. Snellen Metre, logMAR, etc
		the trace AND it's axis layout need to be stored together. This is what
		userSelectedUnits handles.
		*/
		for (const [ key, trace ] of Object.entries( eyeJSON.VA.units )){
			tools.selectableUnits.addTrace( eyeSide, key, {
				x: trace.x,
				y: trace.y,
				name: trace.name,	
				yaxis: 'y3',	
				hovertemplate: trace.name + ': %{y}<br>%{x}<extra></extra>',
				type: 'scatter',
				mode: 'lines+markers',
			});
		}
		
		/**
		Store data traces in myPlotly
		*/
		myPlotly.set( eyeSide, new Map());
		myPlotly.get( eyeSide ).set('data', new Map());
		myPlotly.get( eyeSide ).get('data').set( VA_offScale.name, VA_offScale );
		myPlotly.get( eyeSide ).get('data').set( CRT.name, CRT );
		myPlotly.get( eyeSide ).get('data').set('VA', tools.selectableUnits.getTrace( eyeSide ));
		
		/**
		Event data are all individual traces
		all the Y values are are the SAME, so that are shown on a line
		extra data for the popup can be passed in with customdata
		*/
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			const newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
					hovertemplate: event.customdata ? '%{y}<br>%{customdata}<br>%{x}<extra></extra>' : '%{y}<br>%{x}<extra></extra>',
					type: 'scatter',
					showlegend: false,
				}, oePlot.eventStyle(  event.event ));
			
			myPlotly.get( eyeSide ).get('data').set( newEvent.name, newEvent);
		});
	};
	
	/**
	* React to user request to change VA scale 
	* @callback: Tools will update this
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		if( !myPlotly.has( eyeSide )) return;
		
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide ); 
		
		// Check the user selected units for VA and update the correct axis
		eyePlot.get('data').set('VA', tools.selectableUnits.getTrace( eyeSide ));
		eyePlot.get('layout').yaxis3 = tools.selectableUnits.getAxis();
		
		// Check hoverMode setting
		eyePlot.get('layout').hovermode = tools.hoverMode.getMode();

		/**
		* Plot.ly!
		* Build new (or rebuild) have to use react()
		*/
		Plotly.react(
			eyePlot.get('div'), 
			Array.from( eyePlot.get('data').values()), // Data Array of ALL traces
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* After init - build layout and initialise Plotly 
	* @param {Object} setup - deconstructed
	*/
	const plotlyInit = ({ title, eyeSide, colors, xaxis, yaxes, parentDOM }) => {
		/*
		Ensure parentDOM is empty (theme switch re-build issue otherwise!)
		*/
		const parent = document.querySelector( parentDOM );
		bj.empty( parent );
		
		// Need a wrapper to help with the CSS layout		
		const div = oePlot.buildDiv(`oes-${eyeSide}`);
		parent.append( div );
		
		/*
		Build layout
		*/
		const layout = oePlot.getLayout({
			darkTheme: oePlot.isDarkTheme(), // link to CSS theme
			legend: {
				yanchor:'bottom',
				y: domainLayout[1][1], // position relative to subplots
			},
			colors,
			plotTitle: title,
			xaxis,
			yaxes,
			subplot: domainLayout.length, // num of sub-plots 
			rangeSlider: true, 
			dateRangeButtons: true,
		});
		
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
		
		/* 
		bluejay custom event
		User changes layout arrangement (top split view, etc)
		*/
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	/**
	* init
	* @callback: from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	* @param {Boolean} isThemeChange - user event requires a rebuild
	*/
	const init = ( json, isThemeChange = false ) => {
		if( json === null ) throw new Error('[oePlot] Sorry, no JSON data!');
		bj.log(`[oePlot] - OES Medical Retina`);
		
		/**
		* When a users changes themes EVERYTHING needs rebuilding
		* the only way (I think) to do this is to re-initialise
		*/
		myPlotly.clear();
		
		/**
		* oePlot tools
		* Allows the user to access extra chart functionality
		* tools will add a fixed toolbar DOM to the page.
		*
		* Tools are not effected by a theme switch, CSS will 
		* re-style them, but the traces and axes need updating
		*/
		if( tools == null ){
			tools = oePlot.tools();
			tools.plot.setReacts( plotlyReacts, ['rightEye', 'leftEye']);
			tools.hoverMode.add(); // user hoverMode options for labels
			
			// VA has dynamic axis based, e.g. SnellenMetre, LogMAR, etc
			tools.selectableUnits.addAxes({
				axisDefaults: {
					type:'y',
					rightSide: 'y2', // CRT & VA plot 
					domain: domainLayout[1],
					title: 'VA',
					spikes: true,
				}, 
				yaxes: json.yaxis.VA,
				prefix: 'VA',
			});
			
			// check for tabular data:
			if( json.tabularDataID ){
				tools.tabularData.add( json.tabularDataID );
			}
			
			tools.showToolbar(); // update DOM
		} else {
			// rebuilding...
			tools.selectableUnits.clearTraces();
			tools.selectableUnits.updateAxesColors();
		}
	
		/**
		* Traces - build data traces from JSON 
		*/
		
		if( json.rightEye ){
			buildDataTraces( json.rightEye, 'rightEye' );
		}
		
		if( json.leftEye ){
			buildDataTraces( json.leftEye, 'leftEye' );
		}
	
		/**
		* Axes 
		*/
		
		// VA
		// set Y3 to the "makeDefault" unit. User can change this with the "tools"
		const y3 = tools.selectableUnits.getAxis();
		
		// x1 - Timeline
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			spikes: true,
			noMirrorLines: true,
		}, oePlot.isDarkTheme());
		
		// y1 - offscale 
		const y1 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[2], 
			useCategories: {
				categoryarray: json.yaxis.offScale,
				rangeFit: "padTop", // "exact", etc
			},
			spikes: true,
		}, oePlot.isDarkTheme());
		
		// y2 - CRT
		const y2 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[1],
			title: 'CRT', 
			range: json.yaxis.CRT, 
			spikes: true,
		}, oePlot.isDarkTheme());
		
		// y4 - Events
		const y4 = oePlot.getAxis({
			type:'y',
			domain: domainLayout[0],
			useCategories: {
				categoryarray: json.allEvents,
				rangeFit: "pad", // "exact", etc
			},
			spikes: true,
		}, oePlot.isDarkTheme());
		
		/**
		* Layout & Initiate
		*/	
		
		if( myPlotly.has('rightEye') ){
			plotlyInit({
				title: "Right Eye",
				eyeSide: "rightEye",
				colors: "rightEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4 ],
				parentDOM: '.oes-left-side',
			});	
		} 
		
		if( myPlotly.has('leftEye') ){
			plotlyInit({
				title: "Left Eye",
				eyeSide: "leftEye",
				colors: "leftEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4 ],
				parentDOM: '.oes-right-side',
			});			
		}
		
		/**
		* OE Theme change
		* Users changes the theme, re-initialise with the stored JSON
		* note: once!
		*/
		document.addEventListener('oeThemeChange', () => {
			// give the browser time to adjust the CSS
			setTimeout( () => init( json, true ), 100 ); 
		}, { once: true });
		
		/**
		* First init... 
		*/	
		if( isThemeChange == false ){
		
			bj.log('[oePlot] Click and Hover Events available (click point to see data structure)');
			
			['rightEye', 'leftEye'].forEach( eyeSide => {
				if( !myPlotly.has( eyeSide )) return;
				const div = myPlotly.get( eyeSide ).get('div');
				oePlot.addClickEvent( div, eyeSide );
				oePlot.addHoverEvent( div, eyeSide );
			});
			
			/* 
			API, allow external JS to be able to highlight a specific marker
			*/
			// return { highlightPoint: oePlot.highlightPoint( myPlotly )};
		}

		
	};

	/**
	* Extend blueJS
	* PHP will call this directly with JSON when DOM is loaded
	*/
	bj.extend('plotSummaryMedicalRetina', init );	
	
		
})( bluejay, bluejay.namespace('oePlot')); 
/**
* Last loaded
*/
(function( bj ) {

	'use strict';
	
	// no need for any more extensions
	Object.preventExtensions( bj );
	
	// ready
	bj.ready();

})( bluejay );