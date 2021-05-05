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
		//bluejay.log('[Custom Event] - "'+eventType+'"');
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
/*
Add Select Search insert Popup (v2)
Updated to Vanilla JS for IDG
*/

(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('addSelect');
	const addSelect = uiApp.namespace( 'addSelect' );	
	
	/*
	keep a track of all popups	
	*/
	addSelect.all = [];
		
	/*
	Close all popups. Keep the interface tidy. 
	Actually there should be a popup controller... but for now:
	*/
	addSelect.closeAll = function(){
		this.all.forEach( popup  => {
			if( popup.close == undefined ) throw 'Every button defined with "js-add-select-btn" needs a popup DOM!';
			else popup.close();
		});
	};
		
	/*
	initialise	
	*/
	addSelect.init = function(){
			/*
			Find all the green + buttons
			*/
			const greenBtns = uiApp.nodeArray( document.querySelectorAll('.js-add-select-btn'));
			if(greenBtns.length < 1) return;
			
			greenBtns.forEach((btn) => {
				let newPopup = new addSelect.Popup( btn );
				this.all.push( newPopup );
			});
	};
	
	/*
	onLoad initialise
	*/
	document.addEventListener('DOMContentLoaded', () => addSelect.init(), {once:true});
	
		
})(bluejay); 

(function( bj ){

	'use strict';	
	
	bj.addModule('collapseExpand');
	
	/*
	Collapse and Expanding data is a common UI pattern
	Initially I approached this with "data", I then used 'group'
	Both are supported:
	
	.collapse-data
	|- .collapse-data-header-icon (expand/collapse)
	|- .collapse-data-content
	
	.collapse-group
	|- .header-icon (expand/collapse)
	|- .collapse-group-content
	
	Hotlist also required this but needed it's own styling:
	.collapse-hotlist
	|- .header-icon (expand/collapse)
	|- .collapse-group-content
	
	*/
	const collection = new bj.Collection();

	/*
	Methods	
	*/
	const _change = () => ({
		change: function(){
			if( this.open )	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		show: function(){
			bj.show( this.content, "block" );
			this.btn.classList.replace('expand','collapse');
			this.open = true;
		}
	});
	
	const _hide = () => ({
		hide: function(){
			bj.hide( this.content );
			this.btn.classList.replace('collapse','expand');
			this.open = false;
		}
	});
	
	/**
	* @Class
	* @param {Object} me - initialise
	* @returns new Object
	*/
	const Expander = (me) => Object.assign( me, _change(), _show(), _hide());

	/**
	* Callback for 'Click' (header btn)
	* @param {event} event
	*/
	const userClick = (ev, type) => {
		let btn = ev.target;
		let key = collection.getKey( btn );
		let expander;
		
		if( key ){
			// already setup
			expander = collection.get( key );
		} else {
			/*
			Data/Group are generally collapsed by default
			but might be setup in the DOM to be expanded, check btn class to see
			*/
			// create new Expander
			expander = Expander({
				btn: btn,
				content: bj.find('.collapse-' + type + '-content', btn.parentNode ),
				open: btn.classList.contains('collapse') // inital state
			});
	
			// update collection 	
			collection.add( expander, btn );	
		}
		
		// either way it's a click...
		expander.change(); 
	
	};

	/*
	Events
	*/
	bj.userDown( ".collapse-data-header-icon", ev => userClick( ev, "data"));
	bj.userDown( ".collapse-group > .header-icon", ev => userClick( ev, "group"));
	bj.userDown( ".collapse-hotlist > .header-icon", ev => userClick( ev, "hotlist"));

})( bluejay ); 
(function( bj ) {

	'use strict';	
	
	bj.addModule('comments');	

	/**
	Comments icon is clicked on to reveal 
	comments input field. Either:
	1) Textarea switches places with icon button
	2) Textarea is shown in different DOM placement  
	
	update: 
	New Diagnosis Element need comments for both sides
	see: Ophthalmic & Systemic Diagnosis EDIT
	**/
	
	const userClick = (ev) => {
		const btn = ev.target;
		const json = JSON.parse(btn.dataset.idgdemo);
		
		bj.hide( btn );
		
		if(json.bilateral){
			// Find 2 comment inputs (I assume suffix of "-left" & '-right')
			const commentsR = document.querySelector('#' + json.id + '-right');
			const commentsL = document.querySelector('#' + json.id + '-left');
			
			bj.show( commentsR, 'block');
			bj.show( commentsL, 'block');
			
			commentsR.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( commentsR );
				bj.hide( commentsL );
			}, { once:true });
			
			commentsL.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( commentsR );
				bj.hide( commentsL );
			}, { once:true });
				
		} else {
			// single comment input
			const comments = document.querySelector('#' + json.id);
			bj.show( comments, 'block' );
			comments.querySelector('textarea').focus();
			comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( comments );
			},{ once:true });	
		}
	};
	
	bj.userDown('.js-add-comments', userClick );
	
})( bluejay ); 
(function( bj ) {
	'use strict';	
	
	bj.addModule('commentHotlist');	

	// DOM collection
	const collection = new bj.Collection();
	
	/**
	* Methods
	*/
	const _reset = () => ({
		/**
		* VIEW: Reset the comment. 
		*/
		reset(){
			this.editMode = false;
			this.icon('comment');
			bj.hide( this.elem.textarea );
			bj.hide( this.elem.userComment );
		}
	});
	
	const _show = () => ({
		/**
		* VIEW: Show the comment. 
		*/
		show(){
			this.editMode = false;
			this.icon('edit');
			/*
			Show the comment text back to User. 
			Need to style offical qtags. 
			bj.wrapQtags() returns {
				text: {Basic string, tags are re-organsied}
				DOMString: {DOMstring, qtags are organised and styled}
			}
			*/
			let wrapQtags = bj.wrapQtags( this.comment );
			this.elem.userComment.innerHTML = wrapQtags.DOMString;
			
			this.comment = wrapQtags.text;
			
			bj.hide( this.elem.textarea );
			bj.show( this.elem.userComment, 'block' );
		}
	});
	
	const _edit = () => ({
		/**
		* VIEW: Edit the comment. 
		*/
		edit(){
			this.editMode = true;
			this.icon('save');
			bj.show( this.elem.textarea, 'block' );
			bj.hide( this.elem.userComment );
			
			// set the comment text
			this.elem.textarea.value = this.comment;
			
			// check the resize
			bj.resizeTextArea( this.elem.textarea );
			
			// and set focus for cursor
			setTimeout( () => this.elem.textarea.focus() , 20);
			
			/*
			Allow user to update comments with an Enter press
			(alternative to icon click)
			*/
			const keyPress = ( ev ) => {
				if( ev.key === "Enter" ){
					ev.preventDefault();
					ev.stopPropagation();
					this.update();
					this.elem.textarea.removeEventListener("keydown", keyPress, false );
				}
			};
			// must match the removeEventListener.
			this.elem.textarea.addEventListener("keydown", keyPress, false );				
		}
	});
	
	const _icon = () => ({
		/**
		* VIEW: Icon state. 
		*/
		icon( state ){
			this.elem.icon.classList.remove('comments', 'comments-added', 'save', 'active');
			switch( state ){
				case 'comment': this.elem.icon.classList.add('comments');
				break;
				case 'edit': this.elem.icon.classList.add('comments-added');
				break;
				case 'save': this.elem.icon.classList.add('save', 'active');
				break;
				
				default: bj.log(`commentHotlist - unknown icon: ${state}`);
			}
		}
	});
	
	
	const _userClick = () => ({
		/**
		* Clicking icon can only have two options
		*/
		userClick(){
			// icon clicked, update based on current state
			if( this.editMode ){
				this.update();
			} else {
				this.edit();
			}
		}
	});
	
	const _update = () => ({
		/**
		* Update the comment text and the state depending 
		* the text... if it's an empty string then reset
		*/
		update(){
			let text = this.elem.textarea.value.trim();
			if( text.length ){
				this.comment = text;
				this.show();
			} else {
				this.comment = "";
				this.reset();
			}
		}
	});
	

	/**
	* @Class 
	* @param {Element} icon
	* @param {Element} <td>
	* @param {String} comments to initalise template with.
	* @returns new Object
	*/
	const PatientComment = ( icon, td, comment = "" ) => {
		// Mustache template
		const template = [
			'<textarea placeholder="Comments" rows="1" class="cols-full js-allow-qtags" style="display:none"></textarea>',
			'<div class="user-comment" style="display:none">{{comment}}</div>',
		].join('');
		
		/*
		Initalise the DOM for comments
		*/
		let div = document.createElement('div');
		div.className = 'patient-comments';
		div.innerHTML = Mustache.render( template, { comment:  comment });
		td.appendChild( div );
		
		// get the new Elements
		let textarea = div.querySelector('textarea');
		let userComment = div.querySelector('.user-comment');
		
		return Object.assign({ 
				editMode: false,
				comment,
				elem: { 
					icon, textarea, userComment 
				}
			},
			_reset(),
			_show(),
			_edit(), 
			_icon(),
			_userClick(),
			_update()
		);
	};
	
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		const icon = ev.target;
		let key = collection.getKey( icon );
		
		if( key ){
			let patientComment = collection.get( key );
			patientComment.userClick();
		} else {
			// Not Setup.
			let tr = bj.getParent(icon, 'tr');
			let td = tr.querySelector('.js-patient-comment');
			let patientComment = PatientComment( icon, td );
			patientComment.edit(); // user clicked on comment icon

			// update collection 	
			collection.add( patientComment, icon );	
		}		
	};

	bj.userDown('.oe-hotlist-panel .js-comment-icon', userClick);
	
	
	/**
	* Check to see if PHP static comments are added 
	* if so initalise them, but need to wait to make 
	* available the qtags wrapper
	*/
	document.addEventListener('DOMContentLoaded', () => {
		
		let hotlistPatients = bj.nodeArray( document.querySelectorAll( '.oe-hotlist-panel .activity-list tr' ));
	
		hotlistPatients.forEach( (tr) => {
			if ( tr.hasAttribute("data-comment") ){
				let json = JSON.parse( tr.dataset.comment );
				if( json.comment ){
					let icon = tr.querySelector('.oe-i.comments');
					let td = tr.querySelector('.js-patient-comment');
					let patientComment = PatientComment( icon, td, json.comment );
					patientComment.show();
					
					// init and record Key
					collection.add( patientComment, icon );
				}	
			}
			
		});
		
	}, { once: true });
	
})( bluejay ); 

(function( bj ) {

	'use strict';
	
	bj.addModule('copyToClipboard');
	
	/**
	current: "js-copy-to-clipboard"
	new: "js-clipboard-copy"
	*/
	
	const selector = '.js-clipboard-copy';
	
	if( document.querySelector( selector ) === null ) return;
	
	/*
	Added to the hospital number and nhs number, provide a UI clue	
	*/
	const all = bj.nodeArray( document.querySelectorAll( selector ));
	all.forEach( ( elem )=>{
		elem.style.cursor = "copy";	
	});
	
	/**
	* Copy success!
	* @param {Element} elem - <span>
	*/
	const success = ( elem ) => {
		
		let domRect = elem.getBoundingClientRect();
		let center = domRect.right - (domRect.width/2);
		let top = domRect.top - 5;
		let tipHeight = 30;
		
		const div = document.createElement( 'div' );
		div.className = "oe-tooltip fade-out copied";
		div.innerHTML = 'Copied';
		div.style.width = '80px'; // overide the newblue CSS
		div.style.top = ( top - tipHeight )+ 'px';
		div.style.left = ( center - 40 ) + 'px';
		
		document.body.appendChild( div );
		
		setTimeout(() => bj.remove( div ) , 2500 ); // CSS fade out takes 2 secs.
	};
	

	/**
	* Use the clipboard API (if available)
	* @param {Element} elem - <span>
	*/
	const copyToClipboard = ( elem ) => {
		/*
		Note that the API only works when served over secured domains (https) 
		or localhost and when the page is the browser's currently active tab.
		*/
		if(navigator.clipboard){
			// if availabld use ASYNC new API
			navigator.clipboard.writeText( elem.textContent )
				.then(() => {
					bj.log('[ASYNC] copied text to clipboard');
					success( elem );
				})
				.catch(err => {
					bj.log('failed to copy text to clipboard');
				});
		} else {
			// or use the old skool method
			const input = document.createElement('input');
			input.value = elem.textContent;
			input.style.position = "absolute";
			input.style.top = '-200px';
			
			document.body.appendChild( input );
			
			input.select();
	
			document.execCommand("copy");
			
			success( elem );
			
			// clean up DOM
			bj.remove( input );
		}		
	};
	
	/*
	Events
	*/
	
	bj.userDown( selector, ( ev ) => copyToClipboard( ev.target ));
		
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('elementTiles');
	
	/*
	Tile Elements
	As a row they can be collapsed
	They are also height restricted and if data
	overflows this needs flagging using "restrictDataFlag"
	*/
	
	const states = [];
	
	/*
	DOM
	- element-tile-group
	-- element view tile
	--- element-data
	---- tile-data-overflow (CSS set at max-height 160px)
	-- collapse-tile-group
	*/
	
	/*
	Methods	
	*/
	const _showTile = () => ({
		/**
		* Show the tile content (data)
		*/
		show: function(){
			this.h3.textContent = this.title;
			uiApp.show(this.content, 'block');
		}
	});
	
	const _hideTile = () => ({
		/**
		* Hide the tile content (data)
		*/
		hide: function(){
			this.h3.innerHTML = this.title + " <small>["+ this.count +"]</small>";
			uiApp.hide(this.content);
		}
	});

	/**
	* @Class 
	* @param {Node} .element
	* @returns new Object
	*/
	const Tile = (el) => {
		// set up Tile
		const	h3 = el.querySelector('.element-title'),
				title = h3.textContent,
				content = el.querySelector('.element-data'),
				dataRows = content.querySelectorAll('tbody tr').length;
	
		return Object.assign(	{	h3: h3,
									title: title,
									content: content,
									count: dataRows.toString(),
								},
								_showTile(),
								_hideTile() );
	};
	
	/*
	Methods	
	*/
	const _changeGroup = () => ({
		/**
		* Change the group state (Expand or Collapse)
		*/
		change:function(){
			this.tiles.forEach((tile) => {
				if(this.collapsed){
					this.btn.classList.replace('increase-height','reduce-height');
					tile.show();
				} else {
					this.btn.classList.replace('reduce-height','increase-height');
					tile.hide();
				}
			});
			
			this.collapsed = !this.collapsed;
		}
	});
	
	const _addTile = () => ({
		/**
		* addTile
		* @param {Tile} tile - instanceOf Tile
		*/
		addTile:function(tile){
			this.tiles.push(tile);
		}
	});
	
	/**
	* @Class 
	* @param {Node} .element-tile-group
	* @returns new Object
	*/
	const Group = (btn) => {
		return Object.assign({ 	tiles:[],
								btn:btn,
								collapsed:false,
							},
							_addTile(),
							_changeGroup() );
	};
	
	
	/*
	Events
	*/	
	const userClick = (ev) => {
		let parent = uiApp.getParent(ev.target, '.element-tile-group');
		let dataAttr = uiApp.getDataAttr(parent);
		
		if(dataAttr){
			/*
			Setup already, change it's state
			*/
			states[parseFloat(dataAttr)].change();
		} else {
			/*
			No DOM attribute, needs setting up
			note: it's been clicked! 
			*/
			let group = Group(ev.target);
			// get all Tile Elements in groups
			let elements = uiApp.nodeArray(parent.querySelectorAll('.element.tile'));
			elements.forEach((item) => {
				group.addTile(Tile(item));
			});
			
			group.change(); 	// a click! so change
			uiApp.setDataAttr(parent, states.length);
			states.push(group); // store new state	
		}
		
	};
	

	// Regsiter for Events
	uiApp.userDown('.collapse-tile-group .oe-i', userClick);
	
	
})(bluejay); 

(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDatePicker');	

	/*
	values in milliseconds 
	remember: server timestamps PHP work in seconds
	*/
	const now = Date.now(); // should we be using a Server timestamp?
	const today = new Date( now );

	/** 
	* Model - extended with MV views
	*/	
	const model = Object.assign({ 
		pickDate:null, 	// currently picked date
		inputDate:null, // if a valid date already exists in <input>
	
		get date(){
			return this.pickDate;
		}, 
		set date( val ){
			this.pickDate = val;
			this.views.notify();	
		}, 
		get userDate(){
			if( this.inputDate == null ) return false;
			return this.inputDate;
		},
		set userDate( val ){
			this.inputDate = val;
		},
		changeMonth( n ){
			this.pickDate.setMonth( n );
			this.views.notify();
		},
		
		changeFullYear( n ){
			this.pickDate.setFullYear( n );	
			this.views.notify();	
		}
	}, bj.ModelViews());

	
	/**
	* Date grid - calendar of dates in weekly grid
	*/
	const dateGrid = (() => {
		let div;
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
		};
		
		/**
		* Build DOM, and pre-fill grid with blanks
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			div = bj.div("date-grid");
			div.innerHTML = Mustache.render( '{{#divs}}<div class="prev">{{.}}</div>{{/divs}}', { divs: new Array(42).fill('') });
			wrap.appendChild( div );
		};
		
		/**
		* Flag a date in the grid 
		* @param {Date} mydate
		* @param {String} className
		*/
		const flagDate = ( mydate, className ) => {
			if( mydate.getMonth() == model.date.getMonth() && 
				mydate.getFullYear() == model.date.getFullYear()){
				
				// flag date in UI
				const dateDiv = div.querySelector('#js-fast-date-' + mydate.getDate());
				dateDiv.classList.add( className ); 
			}
		};
		
		/**
		* Observer the model. 
		* Build the date grid based on the current picked Date
		*/
		const dates = () => {
			const 
				y = model.date.getFullYear(),
				m = model.date.getMonth(), 
				mthStartDay = new Date(y, m, 1).getDay(),
				mthLastDate = new Date(y, m +1, 0).getDate(),
				prevEndDate = new Date(y, m, 0).getDate(),
				prev = [],
				current = [],
				next = [];
				
			// in JS sundays start the week (0), re-adjust to a Monday start
			let startDay = mthStartDay ? mthStartDay : 7;	
				 
			// Previous month dates to fill first week line to the start day of current month
			for( let i = startDay-1, j = prevEndDate; i > 0; i--, j-- ) prev.push( j );
			
			// Current Month dates
			for( let i = 1; i <= mthLastDate; i++ ) current.push( i );
			
			// Next Month dates fill remaining spaces - date grid is 7 x 6 (42)
			const fillDays = 42 - (prev.length + current.length);
			for( let i = 1; i <= fillDays; i++ ) next.push( i );
			
			// order previous dates correctly
			prev.reverse(); 
				
			// build DOM
			const datesPrev = Mustache.render( '{{#prev}}<div class="prev">{{.}}</div>{{/prev}}', { prev });
			const datesCurrent = Mustache.render( '{{#current}}<div id="js-fast-date-{{.}}">{{.}}</div>{{/current}}', { current });
			const datesNext = Mustache.render( '{{#next}}<div class="next">{{.}}</div>{{/next}}', { next });
			
			div.innerHTML = datesPrev + datesCurrent + datesNext;
			
			// flag today 
			flagDate( today, 'today' );
			
			// if there is valid user date...
			if( model.userDate != false ) flagDate( model.userDate, 'selected' );
		};
		
		// add to observers
		model.views.add( dates );
		
		// public
		return { reset, build };
		
	})();
	
	/**
	* Months
	*/
	const month = (() => {
		const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		let div, active;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
			active = null;
		};
		
		/**
		* Build DOM
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			div = bj.div("month");
			div.innerHTML = Mustache.render( '{{#months}}<div>{{.}}</div>{{/months}}', { months });
			wrap.appendChild( div );
		};
		
		/**
		* Picker needs to find the month number from the btn name
		* @param {String} mthStr - e.g. 'Jan'
		* @returns {Number}
		*/
		const getMonthNum = ( mthStr ) =>  months.indexOf( mthStr );
		
		/**
		* Picker needs to know the month name
		* @param {Number} n 
		* @returns {String}
		*/
		const getMonthName = ( n ) =>  months[ n ];
		
		/**
		* Update DOM to show selected Month
		*/
		const update = () => {
			const mth = div.children[ model.date.getMonth() ];
			if( active ) active.classList.remove('selected');
			mth.classList.add('selected');
			active = mth;
		};
		
		// add to observers
		model.views.add( update );
		
		return { reset, build, getMonthNum, getMonthName };
		
	})();
	
	/**
	* Year
	* @returns API
	*/
	const year = (() => {
		let div, nodes, yearList;
		let slideYears = false;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
			nodes = null;
			yearList = null;
			slideYears = false;
		};

		/**
		* Build DOM
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			const template = [
				'<div class="century">{{#century}}<div>{{.}}</div>{{/century}}</div>',
				// '<ul class="decade">{{#ten}}<li>{{.}}</li>{{/ten}}</ul>',
				'<ul class="years">{{#years}}<li>{{.}}</li>{{/years}}</ul>',
			].join('');

			//const ten = Array.from( Array(10).keys() ); // 0 - 9
			const hundred = Array.from( Array(100).keys() ); // 0 - 99;
			const years = hundred.map( x => x < 10 ? `0${x}` : x );
			
			div = bj.div("year");
			div.innerHTML = Mustache.render( template, { century: ['19', '20'], years });
			
			yearList = div.querySelector('.years');
			
			// store reference to nodelists (should be OK, use Array.from otherwise)
			nodes = {
				c: div.querySelector('.century').childNodes, 
				//d: div.querySelector('.decade').childNodes,
				y: yearList.childNodes,
			};
			
			wrap.append( div );
			
		};
		
		/**
		* Years need to used in centuries, decades and single years
		* @retures {Object} year units
		*/
		const getYearUnits = () => {
			const fullYear =  model.date.getFullYear();
			return {
				c: Math.floor( fullYear / 100 ),
				//d: parseFloat( fullYear.toString().charAt(2) ),
				y: parseFloat( fullYear.toString().substring(2))
			};
			
			
		};
		
		/**
		* Update DOM to show selected Year
		*/
		const update = () => {
			const yr = getYearUnits();
			
			// convert '19' and '20' century to UI nodelist places
			yr.c = yr.c == 20 ? 1 : 0; 

			nodes.c.forEach((n) => n.classList.remove('selected'));
			//nodes.d.forEach((n) => n.classList.remove('selected'));
			nodes.y.forEach((n) => n.classList.remove('selected'));
		
			nodes.c[ yr.c ].classList.add('selected');
			//nodes.d[ yr.d ].classList.add('selected');
			nodes.y[ yr.y ].classList.add('selected');
			
			// and center scrolling years (based on CSS height settings)

			yearList.scrollTo({
			  top: (yr.y * 38.5) - 95,
			  left: 0,
			  behavior: slideYears ? 'smooth' : 'auto' // first time jump to position
			});
			
			slideYears = true;
		};
		
		
		// add to observers
		model.views.add( update );
		
		return { reset, build, getYearUnits };
		
	})();
	
	
	/**
	* Picker (controller)
	*/
	const picker = (() => {
		let input, div;
		/*
		Using 'blur' event to remove picker popup. But if user 
		clicks on a picker date this needs to be ignored
		*/
		let ignoreBlurEvent = false;
		
		/**
		* Remove and reset
		* Either called directly when user selects a Date or by 'blur'
		* Or by 'blur' event
		*/
		const remove = () => {
			/*
			If part of an Event chain from Month 
			or Year change then ignore this	'blur' request
			*/
			if( ignoreBlurEvent ){
				ignoreBlurEvent = false;
				input.focus(); // instantly return focus so that we can use 'blur'
				return;
			}
			
			// help JS with GC
			dateGrid.reset();
			month.reset();
			year.reset();
			
			// clean up and reset 
			document.removeEventListener('blur', picker.remove, { capture: true });
			//window.removeEventListener('scroll', picker.remove, { capture:true, once:true });
			bj.remove( div );
			div = null;
			input = null;
		};
		
		/**
		* initCalender when DOM is built.
		* check <input> for a valid or use 'today'
		*/
		const initCalendar = () => {
			let timeStamp;
			let validUserInputDate = false;
			
			// <input> - test for valid date format: '1 Jan 1970' pattern
			if( input.value ){
				if( /^\d{1,2} [a-z]{3} \d{4}/i.test( input.value )){
					timeStamp = Date.parse( input.value ); 
					if( !isNaN( timeStamp )){
						/*
						Seems valid, but is it reasonable?
						it could be '1 Jan 2328', check within year range
						*/
						const userDate = new Date( timeStamp );
						const userFullYear = userDate.getFullYear();
						if( userFullYear > 1900 && userFullYear < 2099 ){
							validUserInputDate = userDate;
						} 
					}
				}
			}
			
			// set up Model with Date 
			if( validUserInputDate ){
				model.userDate = validUserInputDate;
				model.date = new Date( timeStamp ); // note: this will trigger Views notifications, must be set last!
			} else {
				model.date = new Date( now );
			}
		};
		
		/**
		* Show Fast Date picker - callback from 'focus' event
		* @param {Element} el - event.target (input.date)
		*/
		const show = ( el ) => {
			/*
			Note: refocusing on the input, after ignoring a blur event
			will trigger the input event again, ignore this	
			*/
			if( el.isSameNode( input )) return;

			// OK new <input>
			input = el;
	
			/*
			CSS height and width is fixed. 	
			Default position is below, left (follows Pick me up)
			*/
			const h = 240;
			const w = 430;
			const rect = input.getBoundingClientRect();
			
			div = bj.div("fast-date-picker");
			div.style.left = (rect.right - w ) + 'px';
			div.style.top = rect.bottom + 'px';
			
			// check default positioning is available, if not shift position
			if( rect.left < w ) div.style.left = rect.left + 'px';
			if( (rect.bottom + h) > bj.getWinH())	div.style.top = (rect.top - h) + 'px';
			
			
			// build popup elements 
			year.build( div );
			month.build( div );
			dateGrid.build( div );	
			
			
			// show picker
			document.body.appendChild( div );  
			
			// initCalendar (set the Model)
			initCalendar();
							
			// use blur to remove picker
			document.addEventListener('blur', picker.remove, { capture: true });
			//window.addEventListener('scroll', picker.remove, { capture:true, once:true });
		};
		
		/**
		* Callback for Events on Month and Year
		* @param {Element} target - event.target
		* @param {String} unit - unit type
		*/
		const changeDate = ( target, unit ) => {
			/*
			This event will trigger 'blur' must ignore it
			in this Event chain, otherwise it will close picker
			*/
			ignoreBlurEvent = true;
			
			const btnNum = parseFloat( target.textContent );
			const yearParts = year.getYearUnits();
			
			switch( unit ){
				case 'month':
					model.changeMonth( month.getMonthNum( target.textContent )); 
				break;
				
				case 'century': 
					if( btnNum == yearParts.c ) return;
					if( btnNum == 19 ){
						model.changeFullYear( 1999 );
					} else {
						model.changeFullYear( today.getFullYear() );
					}
				break;
/*
				case 'decade':
					let decadeChange = (btnNum - yearParts.d) * 10;
					model.changeFullYear( model.date.getFullYear() + decadeChange );
				break;
*/
				case 'year':
					let yearChange = btnNum - yearParts.y;
					model.changeFullYear( model.date.getFullYear() + yearChange );
				break;
			}
		};
		
		/**
		* oeDate
		* @param {Date} date
		* @returns {String} "dd Mth YYYY"
		*/
		const oeDate = date => date.getDate() + ' ' + month.getMonthName( date.getMonth()) + ' ' + date.getFullYear();
		
		/**
		* Callback for Events on Dates
		* instantly sets the input date value
		* @param {Element} target - event.target
		*/
		const selectDate = ( target ) => {
			const date = parseFloat( target.textContent );
			let m = model.date.getMonth(); 
			
			if( target.classList.contains('prev')){
				model.changeMonth( m - 1 ); // JS handles Year change
			}
			if( target.classList.contains('next')){
				model.changeMonth( m + 1 ); // JS handles Year change
			}
			
			/* 
			Update Model with the selected Date 
			and insert date into input
			*/
			model.date.setDate( date );
			input.value = oeDate( model.date );
			
			bj.customEvent('idg:DatePickerChange', model.date );
			
			remove(); // done! 
		};
		
		// public
		return { show, remove, changeDate, selectDate };
	
	})();
	
	/*
	Events
	*/
	
	document.addEventListener('focus', ( ev ) => {
		if( ev.target.matches('input.date')){
			picker.show( ev.target );
		}
	}, { capture: true });

	bj.userDown('.fast-date-picker .month > div', ev => picker.changeDate( ev.target, 'month' ));
	bj.userDown('.fast-date-picker .century > div', ev => picker.changeDate( ev.target, 'century' ));
	//bj.userDown('.fast-date-picker .decade li', ev => picker.changeDate( ev.target, 'decade' ));
	bj.userDown('.fast-date-picker .years li', ev => picker.changeDate( ev.target, 'year' ));
	bj.userDown('.fast-date-picker .date-grid > div', ev => picker.selectDate( ev.target ));

})( bluejay ); 

(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDateRange');	

	const div = document.querySelector('.set-date-range');
	
	if( div == null ) return;
	
	// DOM elements
	const inputTo = div.querySelector('.js-filter-date-to');
	const inputFrom = div.querySelector('.js-filter-date-from');
	
	/* 
	values in milliseconds 
	remember: server timestamps PHP work in seconds
	*/
	const now = Date.now();
	const today = new Date( now );
	const day = 1000 * 60 * 60 * 24;
	const week = 1000 * 60 * 60 * 24 * 7;
	const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	
	/**
	* Make oeDate
	* @param {Date} date
	* @returns {String}
	*/
	const oeDate = date => date.getDate() + ' ' + months[ date.getMonth() ] + ' ' + date.getFullYear();

	/**
	* Set the 'to' and 'from' date inputs
	* @param {Date} dateTo
	* @param {Date} dateFrom
	*/
	const setDateRange = ( dateFrom, dateTo ) => {	
		inputFrom.value = oeDate( dateFrom ); 
		if( dateTo ){
			inputTo.value = oeDate( dateTo );
		} else {
			inputTo.value = "";
		}
		
	};
	
	/**
	* Single day
	* @param {Date} day
	*/
	const singleDay = day => setDateRange( day, false );
	
	/**
	* Week: Mon to Fri
	* @param {Number} weekoffset
	*/
	const weekRange = ( offset ) => {
		let dayNum = today.getDay();
		let monday = now + ( day * (1 - dayNum ));
		let weekStart = monday + ( day * offset);
		setDateRange( new Date( weekStart ), new Date( weekStart + ( day * 6 )));
	};
	
	/**
	* Month
	* @param {Number} monthOffset
	*/
	const monthRange = ( offset ) => {
		let y = today.getFullYear(); 
		let m = today.getMonth() + offset;
		// watch out for year changes
		if( m > 11 ){
			m = 0;
			y = y + 1;
		}
		if( m < 0){
			m = 11; 
			y = y - 1;
		}
		setDateRange( new Date(y, m, 1), new Date(y, m + 1, 0 ));
	};

	/**
	* Handle user event
	* @param {Event} ev (div.range)
	*/
	const userClicks = ( range ) => {
		switch( range ){
			case 'yesterday': singleDay( new Date( now - day ));
			break;
			case 'today': singleDay( today );
			break; 
			case 'tomorrow': singleDay( new Date( now + day ));
			break;
			
			case 'next-4-days': 
			case 'next-7-days': 
			case 'next-12-days': 
				const days = range.split('-')[1];
				const add = parseInt( days , 10 );
				setDateRange( today, new Date( now + ( day * add )));
			break; 
			
			case 'last-week': weekRange( -7 );		
			break;
			case 'this-week': weekRange( 0 );	
			break; 
			case 'next-week': weekRange( 7 );		
			break; 
			
			case 'last-month': monthRange( -1 );
			break; 
			case 'this-month': monthRange( 0 );
			break; 
			case 'next-month': monthRange( +1 );
			break;

			default: bj.log('[fastDateRange] unknown range request: ' +  range );
		}
	
	};
	
	// If this is being used on the new worklist page, create a quick iDG UIX demo: 
	const setHeaderDateRange = ( msg ) => {
		const showDate = document.querySelector('.clinic-context .date-range');
		if( showDate == null ) return; 
	
		showDate.textContent = msg == "custom" ? 
			`${inputFrom.value} - ${inputTo.value}`: 
			msg;
	};
	
	/*
	Initiate date range based on the checked date selector
	*/
	(() => {
		const checkedSelector = div.querySelector('input:checked');
		if( checkedSelector != null ){
			userClicks( checkedSelector.value );
		}
	})();
	

	/*
	Events	
	*/
	div.addEventListener('change', ev => {
		userClicks( ev.target.value );
		setHeaderDateRange( ev.target.nextSibling.textContent );
	});
	
	// if the use clicks on the DatePicker this means 
	// it's now a custom date range
	document.addEventListener('idg:DatePickerChange', ev => {
		setHeaderDateRange( "custom" );
	});
		
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
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('messagePreview');	
	
	/*
	Message hub... view all the message
	*/
	if( document.querySelector('.home-messages') === null ) return;
	
	/*
	Does message need expanding?
	*/
	const msgs = uiApp.nodeArray(document.querySelectorAll('.js-message .message'));
	msgs.forEach((msg) => {
		if( msg.scrollWidth <= msg.clientWidth ){
			// message fits in available space!
			msg.parentNode.nextSibling.querySelector('.js-expand-message').style.display = "none";
		} 
	});
	
	const userClick = (ev) => {
		let icon = ev.target;
		let message = uiApp.getParent(icon,'tr').querySelector('.message');
		if(icon.classList.contains('expand')){
			message.classList.add('expand');
			icon.classList.replace('expand','collapse');
		} else {
			message.classList.remove('expand');
			icon.classList.replace('collapse','expand');
		}		
	};

	/*
	Events
	*/
	uiApp.userDown(	'.js-expand-message',	userClick );

})(bluejay); 
(function( bj ){

	'use strict';	
	
	bj.addModule('navHotlist');
			
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-nav-hotlist-btn';
	const wrapper = '#js-hotlist-panel-wrapper';
	const btn = document.querySelector( selector );
	
	if(btn === null) return;
	
	/*
	Methods	
	*/
	
	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			if(this.isFixed) return;
			this.btn.classList.add( cssActive );
			this.show();
		}	
	});
	
	const _changeState = () => ({
		/**
		* Callback for 'click'
		* Hotlist can be quickly viewed or 'locked' open
		*/
		changeState:function(){
			if( this.isFixed ){
				bj.customEvent('idg:hotlistViewFixed');// navWorklists needs this
				return;
			}
			if( !this.open ){
				this.makeLocked();
				this.over();
			} else {
				if( this.isLocked ){
					this.isLocked = false;
					this.hide();
				} else {
					this.makeLocked();
				}
			}
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if( this.open ) return;
			this.open = true;
			bj.show(this.content, 'block');
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if( !this.open || this.isLocked || this.isFixed ) return;
			this.open = false;
			this.btn.classList.remove( cssActive, cssOpen );
			bj.hide( this.content );
		}
	});
	
	const _makeLocked = () => ({
		/**
		* 'locked' open if user clicks after opening with 'hover'
		*/
		makeLocked: function(){
			this.isLocked = true; 
			this.btn.classList.add( cssOpen );
			bj.customEvent('idg:hotlistLockedOpen'); // navWorklists needs this
		}
	});
	
	const _fixedOpen= () => ({
		/**
		* Automatically 'fixed' open if there is space and it's allowed
		* @param {boolean}
		*/
		fixedOpen: function(b){
			this.isFixed = b; 
			if(b){
				this.isLocked = false;
				this.btn.classList.add( cssOpen );
				this.btn.classList.remove( cssActive );
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	/**
	* IIFE
	* builds required methods 
	* @returns {Object} 
	*/
	const hotlist = (() => {
		return Object.assign({	
			btn:btn,
			content: document.getElementById('js-hotlist-panel'),
			open: false,
			isLocked: false,
			isFixed: false,
		},
		_changeState(),
		_over(),
		_makeLocked(),
		_show(),
		_hide(),
		_fixedOpen() );
	})();
	
	/*
	Hotlist can be Locked open if: 
	1) The browser is wide enough
	2) The content area allows it (DOM will flag this via data-fixable attribute)
	*/
	const checkBrowserWidth = () => {
		// note: Boolean is actually a string! 
		if(btn.dataset.fixable === "true"){
			hotlist.fixedOpen(( window.innerWidth > bj.settings("cssHotlistFixed" )));
		}
	};
	
	/*
	Events
	*/
	bj.userDown(selector, () => hotlist.changeState());			
	bj.userEnter(selector, () => hotlist.over());
	bj.userLeave( wrapper, () => hotlist.hide());
	
	bj.listenForResize( checkBrowserWidth );
	
	checkBrowserWidth();

})( bluejay ); 
(function ( bj ) {

	'use strict';	
	
	bj.addModule('navLogo');
	
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-openeyes-btn';
	const wrapper = '.openeyes-brand';
	
	/**
	Bling.
	Login Page: Flag the logo
	*/
	if(document.querySelector('.oe-login') !== null){
		document.querySelector(selector).classList.add( cssActive );	
	}
	
	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Callback for 'click'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});

	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			this.btn.classList.add( cssActive );
		}	
	});
	
	const _out = () => ({
		/**
		* Callback for 'exit'
		*/
		out: function(){
			this.btn.classList.remove( cssActive );
		}	
	});

	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if( this.open ) return;
			this.open = true;
			this.btn.classList.add( cssOpen );
			bj.show( this.content, 'block' );
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if( !this.open ) return;
			this.open = false;
			this.btn.classList.remove( cssOpen, cssActive );
			bj.hide( this.content );			
		}
	});
	
	/**
	* IIFE
	* builds required methods 
	* @returns {Object} 
	*/
	const oelogo = (() => {
		
		return Object.assign({	
			btn: document.querySelector( selector ),
			content: document.querySelector('#js-openeyes-info'),
			open: false
		},
		_over(),
		_out(),
		_change(),
		_show(),
		_hide());
		
	})();
	
	/*
	Events
	*/
	bj.userDown( selector, () => oelogo.change());			
	bj.userEnter( selector, () => oelogo.over());
	bj.userLeave( selector, () => oelogo.out());
	// wrapper
	bj.userLeave( wrapper, () => oelogo.hide());
	
})( bluejay) ; 
(function( bj ){

	'use strict';	
	
	bj.addModule('navWorklists');
	
	const worklistsPanel = document.getElementById('js-worklists-panel');
	if( worklistsPanel === null ) return;
	
	const btn = document.getElementById('js-nav-worklists-btn');
	let open = false;
	
	const show = () => {
		bj.show( worklistsPanel, 'block');
		btn.classList.add('active');
		open = true;
	};
	
	const hide = () => {
		bj.hide( worklistsPanel );
		btn.classList.remove('active');
		open = false;
	};

	/*
	Events
	*/
	bj.userDown('#js-nav-worklists-btn', () => open ? hide() : show() );	
	
	
	/**
	Worklist panel completely obscures the hotlist.
	therefore if the User clicks on the hotlist make sure
	worklist panel hides otherwise they can't see the 
	the hotlist!
	*/
	document.addEventListener('idg:hotlistLockedOpen', hide );
	
	// user clicks on hotlist icon (it's fixed but they can't see it)
	document.addEventListener('idg:hotlistViewFixed', hide );


})( bluejay ); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('notificationBanner');	
	
	if(document.querySelector('#oe-admin-notifcation') === null) return;
	
	const selector = '#oe-admin-notifcation .oe-i';
	const shortInfo = document.querySelector('#notification-short');
	const longInfo = document.querySelector('#notification-full');
	
	/*
	*** Login Page?
	Show the full notification, no interaction!
	*/
	if(document.querySelector('.oe-login') !== null){
		uiApp.hide(shortInfo);
		uiApp.show(longInfo, 'block');
		document.querySelector(selector).style.display = "none";	
		return; // exit!
	}
	
	/*
	Set up interaction on the 'info' icon
	*/
	let defaultDisplay = shortInfo, 
		otherDisplay = longInfo,
		shortDesc = true;
		
	/**
	* show/hide switcher
	* @param {HTMLELement} a - show
	* @param {HTMLELement} b - hide
	*/	
	const showHide = (a,b) => {
		a.style.display = "block";
		b.style.display = "none";
	};
	
	/*
	Events
	*/
	const changeDefault = () => {
		// clicking changes the default state "view" state
		defaultDisplay 	= shortDesc ? longInfo : shortInfo;
		otherDisplay 	= shortDesc ? shortInfo : longInfo;
		shortDesc = !shortDesc;
		
		// Update View (may not change view but is now default IS updated)
		showHide(defaultDisplay,otherDisplay);
	};
	
	uiApp.userEnter(	selector,	() => showHide(otherDisplay,defaultDisplay) );
	uiApp.userLeave(	selector,	() => showHide(defaultDisplay,otherDisplay) );	
	uiApp.userDown(	selector,	changeDefault );

})(bluejay); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('overlayPopup');
	
	/*
	Pretty simple. Click on something (by id), load in some PHP demo content, assign a selector to close
	*/
	const pops = [ 	
		{id:'#js-idg-popup-content-template',php:'_popup-content-template.php'}, // template (standardisation)
		{id:'#js-change-context-btn', php:'change-context.php' },	// change context (firm)
		{id:'#copy-edit-history-btn', php:'previous-history-elements.php' }, // duplicate history element
		{id:'#copy-edit-anterior-segment-btn', php:'previous-ed-anterior.php' }, // duplicate history element ED
		{id:'#js-virtual-clinic-btn', php:'virtual-clinic.php' }, // virtual clinic change:
		{id:'#js-delete-event-btn', php:'delete-event.php'}, // Delete Event generic example:
		{id:'#js-close-element-btn', php:'close-element.php' }, // Remove element confirmation
		{id:'#js-add-new-event', php:'add-new-event.php' }, // Add New Event in SEM view mode
		{id:'#js-idg-preview-correspondence', php:'letter-preview.php' }, // duplicate history element
		{id:'#js-idg-exam-complog', php:'exam-va-COMPlog.php' }, // Duplicate Event
		{id:'#js-duplicate-event-btn', php:'duplicate-event-warning.php' }, 
		{id:'#js-idg-worklist-ps-add', php:'worklist-PS.php' }, // Worklist PSD / PSG	
		{id:'#analytics-change-filters', php:'analytics-filters.php' }, // Analytics Custom Filters	
		{id:'#js-idg-add-new-contact-popup', php:'add-new-contact.php' }, // Add new contact
		{id:'#js-idg-admin-queset-demo',php:'admin-add-queue.php'},
		{id:'#js-idg-search-query-save',php:'query-save.php'}, // Search, manage Queries popup 
		{id:'#js-idg-search-all-searches',php:'query-all-searches.php'}, // Search, manage Queries popup 
	];

	const overlayPopup = (id,php) => {	
		const showPopup = () => {
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/' + php)
				.then( xreq => {
					const div = document.createElement('div');
					div.className = "oe-popup-wrap";
					div.innerHTML = xreq.html;
					div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.remove(div);
					}, {once:true} );
					
					// reflow DOM
					document.body.appendChild( div );
				})
				.catch(e => console.log('OverlayPopup failed to load: Err msg -',e));  // maybe output this to UI at somepoint, but for now... 
		};
		
		// register Events
		uiApp.userDown(id,showPopup);
	};
	
	/*
	Init IDG popup overlay demos, if element is in the DOM
	*/
	
	for(let i=0,len=pops.length;i<len;i++){
		let p = pops[i];
		let el = document.querySelector(p.id);
		if(el !== null){
			overlayPopup(	p.id,
							p.php);
		}
	}
			
})(bluejay); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('overlayPopupJSON');
	
	/*
	New approach to loading Popups (class based, rather than id) 
	Assumes node has a data-idgDemo={JSON}
	in JSON should be a PHP file path e.g, /file.php?name=value
	it also assumes the standard popup close btn structure (... JSON could provide)
	*/
	
	const showPopup = (ev) => {
		let php; 
		
		if(ev.target.dataset.idgDemo !== undefined){
			php = JSON.parse(ev.target.dataset.idgDemo).php;
		} else {
			throw new Error('overlayPopupJSON: No php file info? Needs data-idg-demo=json');
		}

		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/' + php)
			.then( xreq => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = xreq.html;
				// reflow DOM
				document.body.append( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-icon-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.remove(div);
					}, {once:true} );
				}
			})
			.catch(e => console.log('overlayPopupJSON: Failed to load',e));  // maybe output this to UI at somepoint, but for now... 
	};
	
	
	uiApp.userDown('.js-idg-demo-popup-json', showPopup);
			
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientPopups');	
	
	const cssActive = 'active';
	const cssOpen = 'open';
	
	/*
	Patient popup (icons at the top next to the Patient name)
	Originally, hover interaction was only on the icon but this 
	has been changed to allow 'hover' over the popup content	
	uses unique IDs for DOM elements
	*/
	const map = [
		{btn:'#js-quicklook-btn', content:'#patient-summary-quicklook' },
		{btn:'#js-demographics-btn', content:'#patient-popup-demographics'},
		{btn:'#js-management-btn', content:'#patient-popup-management'},
		{btn:'#js-allergies-risks-btn', content:'#patient-popup-allergies-risks'},
		{btn:'#js-charts-btn', content:'#patient-popup-charts'},
		{btn:'#js-patient-extra-btn', content:'#patient-popup-trials'},
	];
	
	
	/*
	Methods	
	*/
	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			this.btn.classList.add( cssActive );
			this.show();
		}	
	});
	
	const _out = () => ({
		/**
		* Callback for 'exit'
		*/
		out: function(e){
			if(e.relatedTarget === this.content) return;
			this.hide();
			this.btn.classList.remove( cssActive );
			
		}	
	});
	
	const _change = () => ({
		/**
		* Callback for 'click'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			hideOtherPopups(this);
			this.btn.classList.add( cssOpen );
			uiApp.show(this.content, 'block');
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false || this.isLocked ) return;
			this.open = false;
			this.btn.classList.remove( cssActive, cssOpen );
			uiApp.hide(this.content);
		}
	});
	
	const _makeLocked = () => ({
		/**
		* 'locked' open if user clicks after opening with 'hover'
		*/
		makeLocked: function(){
			this.isLocked = true; 
			this.btn.classList.add( cssOpen );
		}
	});	
	
	const _makeHidden = () => ({
		makeHidden:function(){
			if(this.open){
				this.isLocked = false;
				this.hide();
			}
		}
	});
	

	/**
	* @class
	* PatientPopups
	* @param {object} me - set up
	*/
	const PatientPopup = (me) => {
		me.open = false;
		me.isLocked = false;
		return Object.assign( 	me,
								_change(),
								_over(),
								_out(),
								_makeLocked(),
								_show(),
								_hide(),
								_makeHidden() );
	};

	
	/**
	* group control all popups
	*/
	const hideOtherPopups = (showing) => {
		map.forEach((item) => {
			if(item.popup != showing){
				item.popup.makeHidden();
			}
		});
	};
	
	/**
	* Init
	*/
	map.forEach((item) => {
		// only init if there is a btn in the DOM
		let btn = document.querySelector(item.btn);
		if(btn !== null){
			let popup = PatientPopup({	
				btn: btn,
				content: document.querySelector(item.content) 
			});					
			uiApp.userDown(item.btn, () => popup.change());
			uiApp.userEnter(item.btn, () => popup.over());
			uiApp.userLeave(item.btn, (e) => popup.out(e));
			uiApp.userLeave(item.content, (e) => popup.out(e));
			item.popup = popup; // store.
		}	
	});
	

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientQuickMeta');
	
	let	open = false,
		fixed = false,
		currentIcon = null,
		div = null,
		closeBtn = null,
		winHeight = window.innerHeight; // forces reflow, only update onResize
		
	const text = {};
	
	const buildDOM = () => {
		const div = document.createElement('div');
		div.className = "oe-patient-quick-overview";
		div.style.display = "none";
		div.innerHTML = [
			'<div class="close-icon-btn"><i class="oe-i remove-circle medium"></i></div>',
			'<div class="oe-patient-meta">',
			'<div class="patient-name">',
			'<a href="/v3-SEM/patient-overview"><span class="patient-surname">SURNAME</span>, <span class="patient-firstname">First (M.)</span></a>',
			'</div><div class="patient-details">',
			'<div class="hospital-number"><span>ID</span>0000000</div>',
			'<div class="nhs-number"><span>NHS</span>111 222 3333</div>',
			'<div class="patient-gender"><em>Gen</em>Male</div>',
			'<div class="patient-age"><em>Age</em>00y</div>',
			'</div></div>',
			'<div class="quick-overview-content"></div>',].join('');
			
		document.body.appendChild( div );
		
		closeBtn = div.querySelector('.close-icon-btn');
		
		text.surname = div.querySelector('.patient-surname');
		text.first = div.querySelector('.patient-firstname');
		text.hospital = div.querySelector('.hospital-number');
		text.nhs = div.querySelector('.nhs-number');
		text.gender = div.querySelector('.patient-gender');
		text.age = div.querySelector('.patient-age');
		
		return div;
	};
	
	const hide = () => {
		div.style.display = "none";
		open = fixed = false;
		currentIcon = null;
	};

	const show = (icon, clicked) => {
		// is click to fix open?
		if(currentIcon === icon && open){
			fixed = true;
			uiApp.show(closeBtn, 'block');
			return;
		}
		
		div = div || buildDOM();
		open = true;
		fixed = clicked;
		currentIcon = icon;
		 
		
		let dataSet = icon.dataset;
		let rect = icon.getBoundingClientRect();
		let mode = dataSet.mode;
		let php = dataSet.php;
		let patient = JSON.parse( dataSet.patient );
		
		/*
		set up patient meta
		*/
		text.surname.textContent = patient.surname;
		text.first.textContent = patient.first;
		text.hospital.innerHTML = '<span>ID</span> '+ patient.id;
		text.nhs.innerHTML = '<span>NHS</span> '+ patient.nhs;
		text.gender.innerHTML = '<em>Gen</em> '+ patient.gender;
		text.age.innerHTML = '<em>Age</em> '+ patient.age;
		
		/*
		The CSS approach is different for float / sidepanel
		wipe any inline styles before setting up
		*/
		div.style.cssText = " ";
		
		/*
		CSS can handle a mode of "side"
		it will lock the panel to the RHS
		just add "side-panel" class...
		However, mode = "float" requires a 
		JS positioning relative to the icon.
		*/ 
		if( mode == "float"){
			/*
			floating fixed, calculate position
			in relation to the icon,
			*/
			div.classList.remove("side-panel");
			
			// check not too close the bottom of the screen:
			if(winHeight - rect.y > 300){
				div.style.top 	= (rect.y + rect.height + 5) + "px";
			} else {
				div.style.bottom = (winHeight - rect.top) + 10 + "px";
			}
			
			div.style.left 	= (rect.x - 250 +  rect.width/2)  + "px";

		} else {
			div.classList.add("side-panel"); 			
		}
		
		let content = div.querySelector('.quick-overview-content');
		content.innerHTML = "";
		
		// slow loading??
		let spinnerID = setTimeout( () => content.innerHTML = '<i class="spinner"></i>', 400);	
		
		if(clicked){
			uiApp.show(closeBtn, 'block');
		} else {
			uiApp.hide(closeBtn);
		}
		
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/' + php)
			.then( xreq => {
				clearTimeout(spinnerID);
				if(open){
					content.innerHTML = xreq.html;
					div.style.display = "block";
				}
				
			})
			.catch(e => console.log('ed3app php failed to load',e));  // maybe output this to UI at somepoint, but for now...
	};
	
	/**
	* Callback for 'Click'
	* @param {event} event
	*/
	const userClick = (ev) => {
		let icon = ev.target;
		if(open && fixed && currentIcon === icon) {
			hide(); // this is an unclick!
		} else {
			show(icon, true); // new 
		}
	};
	
	/**
	* Callback for 'Hover'
	* @param {event} event
	*/
	const userHover = (ev) => {
		if(fixed) return;
		show(ev.target, false);
	};
	
	/**
	* Callback for 'Exit'
	* @param {event} event
	*/
	const userOut = (ev) => {
		if(fixed) return;
		hide();
	};
	

	uiApp.userDown('.js-patient-quick-overview',userClick);
	uiApp.userEnter('.js-patient-quick-overview',userHover);
	uiApp.userLeave('.js-patient-quick-overview',userOut);
	uiApp.userDown('.oe-patient-quick-overview .close-icon-btn .oe-i',hide);
	
	// innerWidth forces a reflow, only update when necessary
	uiApp.listenForResize(() => winHeight = window.inneHeight );
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('proView');	
	
	/**
	Generally Pro view has 2 states: Collapsed (pro) list and Exapanded (normal) of the SAME data
	However, there are situations where the Pro view remains open and more data is shown by expanding 
	AND the View change is controlled BILATERALY! ... e.g. PCR Risks 
	*/

	const states = []; // store UI states
	
	/*
	Methods	
	*/
	const _hideShow = () => ({
		/**
		* hide/show content areas
		* @param {HTMLElement} to hide 
		* @param {HTMLElement} to show
		*/
		hideShow: function(hide,show){
			if(hide) hide.style.display = "none";
			if(show) show.style.display = "block";
		}	
	});
	
	const _icon = () => ({
		/**
		* Update icon state
		* @param {string}  
		* @param {string} 
		*/
		icon: function(find,replace){
			this.oei.classList.replace(find,replace);
		}	
	});
	
	const _change = () => ({
		/**
		* Change state 
		*/
		change: function(){
			if(this.inPro){
				this.hideShow(this.pro,this.standard);
				this.icon('expand','collapse');
			} else {
				this.hideShow(this.standard,this.pro);
				this.icon('collapse','expand');
			}
			
			if(this.linked){
				this.linkedProView.change();
			}
			
			this.inPro = !this.inPro;
		}	
	});
	
	const _changeContent = () => ({
		/**
		* Basic state change, 
		* only changes content and only used by LinkedProView
		*/
		change: function(){
			if(this.inPro){
				this.hideShow(this.pro,this.standard);
			} else {
				this.hideShow(this.standard,this.pro);
			}
			this.inPro = !this.inPro;
		}	
	});
	
	const _options = (json) => ({
		/**
		* Customise based on JSON settings in the DOM
		* @param {Obj} json
		*/
		options: function(json){
			/*
			Lock Pro view open?
			i.e. Standard data expands data shown (PCR Risk)
			*/
			if(json.lock) this.pro = null;	// hide/show will ignore it
			 
			/*
			DOM will provide ID for linked ProView 
			then this ProView will control 2 ProViews (Bilateral)
			*/
			if(json.linkID != false){
				this.linked = true; 
				this.linkedProView = LinkedProView( document.querySelector('#' + json.linkID));
				if(json.lock) this.linkedProView.pro = null; // set up to behave the same
			}
		}
	});
	
	/**
	* @Class 
	* @param {Node} .pro-data-view
	* @returns new Object
	*/
	const ProView = (parentNode) => {
		
		let btn = parentNode.querySelector('.pro-view-btn');
		let pro = parentNode.querySelector('.data-pro-view');
		let standard = parentNode.querySelector('.data-standard-view');
		
		let me = {	btn: btn,
					oei: btn.querySelector('.oe-i'),
					pro: pro,
					standard: standard,		
					inPro: true,
					linked: false };
		
		return Object.assign(	me,
								_change(),
								_hideShow(),
								_icon(),
								_options() );
	};
	
	/**
	* @Class
	* Provide a basic version of ProView for when they are 'linked'
	* This will be controlled through the ProView instance
	* @param {Node} .pro-data-view
	* @returns new Objec
	*/
	const LinkedProView = (parentNode) => {
		let me = {	pro: parentNode.querySelector('.data-pro-view'),
					standard: parentNode.querySelector('.data-standard-view'),		
					inPro: true };
					
		return Object.assign(	me,
								_changeContent(),
								_hideShow() 
							);
	};
	
	

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		const btn = ev.target;
		let dataAttr = uiApp.getDataAttr(btn);
		if(dataAttr){
			// DOM already setup, change it's current state
			states[parseFloat(dataAttr)].change();
		} else {
			// ...not setup yet, record state ref in DOM
			uiApp.setDataAttr(btn, states.length);
			
			let pro = ProView(uiApp.getParent(btn, '.pro-data-view'));
			pro.options(JSON.parse(btn.dataset.proview));
			pro.change();		// update UI (because this a click)
			states.push(pro);	// store 
		}
	};

	// Regsiter for Events
	uiApp.userDown('.pro-view-btn', userClick);


})(bluejay); 
(function( bj ) {

	'use strict';	
	
	bj.addModule('syncData');	
	
	if( document.getElementById('js-sync-data') == null ) return;
	
	/**
	Sync widget for use on screens that needs auto-refreshing
	e.g. Worklists and Clinic Manager
	For Opening it using the general-ui pattern
	*/
	
	const syncBtn = document.querySelector('.sync-data .sync-btn');
	const syncTime = document.querySelector('.sync-data .last-sync');
	const syncInterval = document.querySelector('.sync-data .sync-interval');
	let timerID = null;
	
	const setSyncTime = () => syncTime.textContent = bj.clock24( new Date( Date.now()));

	const setSyncInterval = ( mins ) => {
		clearInterval( timerID );
		if( mins ){
			const suffix = mins > 1 ? 'mins' : 'min';
			syncInterval.textContent = `${mins} ${suffix}`;
			timerID = setInterval(() => setSyncTime(), mins * 60000 );
			setSyncTime();
			syncBtn.classList.add('on');
		} else {
			syncInterval.textContent = 'Sync OFF';
			syncBtn.classList.remove('on');
		}	
	};
	
	// default is always 1 minute
	setSyncInterval( 1 );
		
	bj.userClick('.sync-options button', ( ev ) => {
		setSyncInterval( parseInt( ev.target.dataset.sync, 10));
	});


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
		// check for line jumps
		if( (h - textArea.clientHeight) > 15 ){
			textArea.style.height = 'auto';
			textArea.style.height = h + 5 + 'px';
		}		
	};
	
	/**
	Make resize available for comments that reveal a textarea
	*/
	uiApp.extend('resizeTextArea',resize);	
	

	/**
	* Resize textarea on 'input'
	*/
	document.addEventListener('input', ( ev ) => {
		if(ev.target.tagName == "TEXTAREA"){
			resize( ev.target );
		}
	}, false );
	
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
(function( bj ){
	
	'use strict';
	
	bj.addModule('tooltip'); 
	
	/** 
	* Model
	* extended with views
	*/
	const model = Object.assign({
		selector: ".js-has-tooltip",
		showing:false,
		target:null,
		type: null, // or, bilateral
		clickThrough: false, // does tooltip click through to a popup showing full details? Note: important for touch!
		tip: null, // tooltip content
		eyeIcons: null, // only applies to bilateral popups
		
		/**
		* Reset the Model
		*/
		reset(){
			this.showing = false;
			this.type = null;
			this.target = null;
			this.views.notify();
		},
		
		/**
		* Update the Model
		* @param {EventTarget} target
		*/
		update( target ){
			this.showing = true;
			this.target = target;
			

			if( target.hasAttribute('data-tooltip-content')){
				/*
				Support the old data attribute for basic tooltips
				*/
				this.type = "basic";
				this.tip = target.dataset.tooltipContent;
				
			} else {
				/*
				New JSON approach for more advanced tooltips
				*/
				const json = JSON.parse( target.dataset.tt );
				this.type = json.type;
				this.clickThrough = json.clickPopup; // click through to a popup?
				
				if( this.type == 'bilateral' ){
					this.tip = {
						r: json.tipR,
						l: json.tipL
					};
					this.eyeIcons = json.eyeIcons;
				} else {
					// basic
					this.tip = json.tip;
				}	
			}
			
			this.views.notify();
		}
		
	}, bj.ModelViews());
	
	
	/**
	* Views 
	*
	* Only one tooltip DIV: Basic and Bilateral both use it
	* @returns API
	*/
	const tooltip = (() => {
		const div = document.createElement('div');
		
		// innerWidth forces a reflow, only update when necessary
		let winWidth = window.innerWidth;
		bj.listenForResize( () => winWidth = window.innerWidth );
	
		/**
		* Reset the tooltip DOM
		*/
		const reset = () => {
			div.innerHTML = "";
			div.className = "oe-tooltip"; // clear all CSS classes
			div.style.cssText = "display:none"; // clear ALL styles & hide
		};
		
		/**
		* Show the tip and position
		*/
		const show = ( display, width ) => {
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
			let center = domRect.right - ( domRect.width/2 );
			let top = domRect.top - h - offsetH;
		
			// watch out for the hotlist, which may overlay the tooltip content
			let maxRightPos = winWidth > bj.settings("cssHotlistFixed") ? bj.settings("cssExtended") : winWidth;
			
			/*
			setup CSS classes to visually position the 
			arrow correctly based on tooltip positoning
			*/
			
			// too close to the left?
			if( center <= offsetW ){
				offsetW = 20; 			// position to the right of icon, needs to match CSS arrow position
				div.classList.add("offset-right");
			}
			
			// too close to the right?
			if ( center > ( maxRightPos - offsetW )){
				offsetW = ( width - 20 ); 			// position to the left of icon, needs to match CSS arrow position
				div.classList.add("offset-left");
			}
			
			// is there enough space above icon for standard posiitoning?
			if( domRect.top < h ){
				top = domRect.bottom + offsetH; // nope, invert and position below
				div.classList.add("inverted");
			} 
			
			/*
			update DOM and show the tooltip
			*/
			div.style.top = top + 'px';
			div.style.left = (center - offsetW) + 'px';
			div.style.display = display;
		};
		
		/**
		* Reset tooltip if model resets
		*/
		model.views.add(() => {
			if( !model.showing ) reset();
		});
		
		/**
		* intialise and append to DOM
		*/
		reset();
		document.body.appendChild( div );
		
		// public	
		return { div, reset, show };
	})();
	
	
	/**
	* Basic tooltip
	*/
	const basic = () => {
		if( model.type === 'basic' ){
			/*
			* basic: HTML 'tip' may contain HTML tags
			*/
			tooltip.reset();
			tooltip.div.innerHTML = model.tip;
			tooltip.show( "block", 200 ); // CSS width: must match 'newblue'
		}
	};
	
	// observe model
	model.views.add( basic );
	
	/**
	* Bilateral tooltip
	* Use Mustache template
	*/
	const bilateral = (() => {
		const template ='<div class="right">{{&r}}</div><div class="left">{{&l}}</div>';
		
		const update = () => {
			if( model.type === 'bilateral'){
				/** 
				* Bilateral enhances the basic tooltip
				* with 2 content areas for Right and Left 	
				*/
				tooltip.reset();
				tooltip.div.classList.add('bilateral');
				tooltip.div.innerHTML = Mustache.render( template, model.tip );
				
				// hide R / L icons?
				if( !model.eyeIcons ) tooltip.div.classList.add('no-icons');
				
				tooltip.show( "flex", 400 ); // CSS width: must match 'newblue'
			}
		};
		
		// observe model
		model.views.add( update );
	
	})();
	
	/**
	* Out (or click toggle tip)
	* @param {Event} ev
	*/
	const userOut = (ev) => {
		if( model.showing === false ) return; 
		model.reset();  // reset the Tooltip
		window.removeEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Over (or click toggle tip)
	* if the user scrolls, remove the tooltip (as it will be out of position)
	* @param {Event} ev
	*/
	const userOver = ( ev ) => {
		model.update( ev.target ); 
		window.addEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Covers touch behaviour
	* @param {Event} ev
	*/
	const userClick = ( ev ) => {
		if( ev.target.isSameNode( model.target ) && model.showing ){
			// this will need updating to support clickThrough on touch.
			// tooltip should not get shown.
			userOut();
		} else {
			userOver( ev );
		}
	};
		
	/**
	Events
	*/
	bj.userDown( model.selector, userClick );
	bj.userEnter( model.selector, userOver );
	bj.userLeave( model.selector, userOut );
	
	
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('whiteboard');
	
	if(document.querySelector('main.oe-whiteboard') === null) return;
	
	/*
	In Whiteboard mode hide these DOM Elements
	*/
	uiApp.hide(document.querySelector('#oe-admin-notifcation'));
	
	/*
	Set up Whiteboard 
	2 states: Standard & Biometry report
	Handling both... 
	*/
	
	// Actions panel (bottom) is standard for both:
	const actionsPanel = document.querySelector('.wb3-actions');
	const actionsBtn = document.querySelector('#js-wb3-openclose-actions');
	
	const openClosePanel = (ev) => {
		if(actionsBtn.classList.contains('up')){
			actionsBtn.classList.replace('up','close');
			actionsPanel.classList.replace('down','up'); // CSS animation
		} else {
			actionsBtn.classList.replace('close','up');
			actionsPanel.classList.replace('up','down'); // CSS animation
		}
	};
	
	uiApp.userDown('#js-wb3-openclose-actions', openClosePanel);
	
	// provide a way to click around the whiteboard demos:		
	uiApp.userDown('.wb-idg-demo-btn',(ev) => {
		window.location = '/v3-whiteboard/' + ev.target.dataset.url;
	});
	
	/*
	Standard
	Demo the editible text concept
	*/
	uiApp.userDown('.edit-widget-btn .oe-i', (ev) => {
		// check the state.
		let oei = ev.target;
		let widget = uiApp.getParent(oei, '.oe-wb-widget');
		let view = widget.querySelector('.wb-data ul');
		let edit = widget.querySelector('.wb-data .edit-widget');
		
		if(oei.classList.contains('pencil')){
			oei.classList.replace('pencil','tick');
			uiApp.hide(view);
			uiApp.show(edit, 'block');
		} else {
			oei.classList.replace('tick','pencil');
			uiApp.hide(edit);
			uiApp.show(view, 'block');
		}
	});

	/*
	Overflow popup?
	--- MOVED, into a seperate script in newblue! 
	*/
/*
	const overflowPopup = ( ev ) => {
		const json = JSON.parse( ev.target.dataset.overflow );
		let div = document.createElement('div');
		div.className = "oe-popup-wrap clear";
		div.innerHTML = `<div class="wb-data-overflow-popup">${json.data}</div>`;
		document.body.appendChild( div );	
	};
	
	uiApp.userDown('.overflow-icon-btn', overflowPopup );
	uiApp.userDown('.wb-data-overflow-popup', ( ev ) => {
		let wrap = uiApp.getParent( ev.target, '.oe-popup-wrap' );
		uiApp.remove( wrap );
	});
*/

	/*
	Biometry Report?
	*/
	if(document.querySelector('.multipage-nav') === null) return;
	
	let stack = document.querySelector('.multipage-stack');
	let pages = uiApp.nodeArray(stack.querySelectorAll('img'));
	
	/*
	Get first IMG height Attribute to work out page scrolling.
	note: CSS adds 20px padding to the (bottom) of all images
	*/
	let pageH = pages[0].height + 20;
	uiApp.listenForResize(() => pageH = pages[0].height + 20 );

	// scrollJump 
	let scrollPos = 0;
	const scrollJump = (px) => {
		scrollPos = scrollPos + px;
		if(scrollPos < 0) scrollPos = 0;
		if(scrollPos > (pages.length * pageH)) scrollPos = pages.length * pageH;
		stack.scrollTop = scrollPos; // uses CSS scroll behaviour
	};

	uiApp.userDown('#js-scroll-btn-down', () => scrollJump(200) );
	uiApp.userDown('#js-scroll-btn-up', () => scrollJump(-200) );
	
	let pageJump = document.querySelector('.page-jump');
	
	pages.forEach((page, i) => {
		let div = document.createElement('div');
		div.className = "page-num-btn";
		div.setAttribute('data-page', i);
		div.textContent = i + 1;
		pageJump.appendChild(div);
	});
	
	uiApp.userDown('.page-num-btn', (e) => {
		scrollPos = 0;
		let pageScroll = parseInt(e.target.dataset.page * pageH);
		scrollJump(pageScroll);
	});
	
	
	
	
	
		
})(bluejay); 



(function( bj ){

	'use strict';	
	
	bj.addModule('GUI-btnShowContent');
	
	const cssActive = 'active';
	
	/**
	Common interaction pattern for all these Elements
	*/
	const mapElems = [
		{ // Nav, shortcuts
			btn: 'js-nav-shortcuts-btn',
			wrapper: 'js-nav-shortcuts',
			contentID: 'js-nav-shortcuts-subnav',
		}, 
		{ // Print Event options
			btn: 'js-header-print-dropdown-btn',
			wrapper: 'js-header-print-dropdown',
			contentID: 'js-header-print-subnav',
		},
		{ // Fancy new Event sidebar filter (IDG)
			btn: 'js-sidebar-filter-btn',
			wrapper: 'js-sidebar-filter',
			contentID: 'js-sidebar-filter-options',
		},
		// Sync, in header (Worklist)
		{
			btn: 'js-sync-btn',
			wrapper: 'js-sync-data',
			contentID: 'js-sync-options',
		}
	];

	
	/**
	Methods	
	*/
	const _change = () => ({
		/**
		* Callback for mousedown
		*/
		change: function(){
			if(this.open) this.hide();
			else this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		* Callback for Mouseenter
		*/
		show:function(){
			if( this.open ) return;
			this.open = true;
			this.btn.classList.add( cssActive );
			bj.show( this.content, 'block');
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		* Callback for Mouseleave
		*/
		hide:function(){
			if( !this.open ) return;
			this.open = false;
			this.btn.classList.remove( cssActive );
			bj.hide( this.content );
		}
	});

	/**
	* @Class
	* builds generic pattern for these elements
	* @returns {Object} 
	*/
	const btnShowContent = ( me ) => Object.assign( me, _change(), _show(), _hide());
	
	/**
	* Init common elems
	* but only if there is a btn in the DOM
	*/
	mapElems.forEach(( item ) => {
		
		const btn = document.getElementById( item.btn );
		
		if( btn !== null ){

			const obj = btnShowContent({	
				btn: btn,
				content: document.getElementById( item.contentID ),
				open: false, 
			});
		
			bj.userDown(`#${item.btn}`, () => obj.change());			
			bj.userEnter(`#${item.btn}`, () => obj.show());
			bj.userLeave(`#${item.wrapper}`, () => obj.hide());
		}	
	});
		

})( bluejay ); 
(function( bj ) {

	'use strict';	
	
	if( document.querySelector('.openers-menu') === null ) return;

	
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
	Init - Menu
	*/
	const menuBtn = '#js-openers-menu-btn';
	
	if( document.querySelector( menuBtn ) === null ) return; // login page
	
	const menu = navSlidePanel({
		btn: document.querySelector( menuBtn ),
		panel: document.querySelector('.menu-info'),
		open: false,
	});
	
	// Events
	bj.userDown( menuBtn, () => menu.change());			
	bj.userEnter( menuBtn, () => menu.show());
	bj.userLeave('.openers-menu', () => menu.hide());
	

})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('attachmentThumbnail');
	
	/*
	Attachments Thumbnails
	Open up a fullscreen popup up of PNG or PDF
	*/
	
	const css = {
		thumb: "oe-attachment-thumbnail",
	};
	
	let div,open = false;
	const btn = {};
		
	/*
	Pretty sure, these won't be dynamically loaded later...
	*/
	let thumbs = uiApp.nodeArray(document.querySelectorAll('.'+css.thumb));
	if(thumbs.length < 1) return; // no elements, bail.
	
	/**
	* Show file attachment
	* @param {JSON object} 
	*/
	const showAttachment = (json) => {
		open = true;
		// create DOM (keep out of reflow)
		div = document.createElement('div');
		div.className = "oe-popup-wrap";
		
		/*
		The popup attachment in it's basic form shows the file attachment (PNG or PDF)
		If PDF then the browser will handle it, if PNG provide re-scale options.
		"Annotation" mode (edit) adds Element inputs and adjust the layout to fit everything in
		*/
	
		// DOM template
		let html = '<div class="oe-popup-attachment">';
		html += '<div class="title">'+json.title+'</div>';
		html += '<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>';
		html += '<div class="file-attachment-content"></div>';
		html += '<div class="file-size-controls"></div>';
		html += '</div>';	
		
		div.innerHTML = html;
	
		const attachment = div.querySelector('.file-attachment-content');
		const controls =  div.querySelector('.file-size-controls');
		
		// build btns
		const btnFragment = new DocumentFragment();
		const addBtn = (text,css,id=false) => {
			let myBtn = document.createElement('button');
			myBtn.className = css;
			if(id) myBtn.id = id;
			myBtn.textContent = text;
			btnFragment.appendChild(myBtn);
			return myBtn;
		};	
		
		/*
		Load in PNG or PDF
		PNG needs the resize options
		*/
		if(json.type !== "pdf"){
			/*
			Load PNG as a background AND as an IMG
			*/
			let bgImgUrl = "url('"+json.file+"')";
			attachment.style.backgroundImage = bgImgUrl;
			attachment.innerHTML = '<img src="'+json.file+'" style="display:none"/>';
			const img = div.querySelector('img');
			
			// set up resize functionality 
			const fitToScreen = addBtn("Fit to screen","pro-theme selected","oe-att-fit");
			const actualSize = addBtn("Actual size","pro-theme","oe-att-actual");
			
			const changeImgState = (bg,display,selectedBtn,resetBtn) => {
				attachment.style.backgroundImage = bg;
				img.style.display = display;
				selectedBtn.classList.add('selected');
				resetBtn.classList.remove('selected');
			};
			
			// change image size buttons
			actualSize.addEventListener("mousedown",(e) => {
				e.stopPropagation();
				changeImgState("none","block",actualSize,fitToScreen);
			});
			
			fitToScreen.addEventListener("mousedown",(e) => {
				e.stopPropagation();
				changeImgState(bgImgUrl,"none",fitToScreen,actualSize);
			});
			
		} else {
			// PDF, easy, let Browser handle it
			attachment.innerHTML = '<embed src="'+json.file+'" width="100%" height="100%"></embed>';
			addBtn("PDF","pro-theme selected");
		}
		
		/*
		Annotate mode (edit)
		*/
		if(json.annotate){
			attachment.classList.add('annotation');
			
			let notes = document.createElement('div');
			notes.className = "attachment-annotation";
			let base = uiApp.find('.oe-popup-attachment', div);
			base.appendChild( notes );
		
			// load in PHP using XHR (returns a Promise)	
			uiApp.xhr(json.idgPHP)
				.then( xreq => {	notes.innerHTML = xreq.html;
									// IDG demo eyelat inputs...
									if(json.eyelat == "L")	notes.querySelector('#annotation-right').style.visibility = "hidden"; // maintain layout?
									if(json.eyelat == "R")	notes.querySelector('#annotation-left').style.visibility = "hidden";
								})
				.catch( e => console.log("XHR failed: ",e) );
			
			// add annotation btns
			btn.save = addBtn("Save annotations","green hint");
			btn.cancel = addBtn("Cancel","red hint");
			btn.save.addEventListener("mousedown",removeAttachment, {once:true});
			btn.cancel.addEventListener("mousedown",removeAttachment, {once:true});	
		}
		
		/*
		Is there an image stack?
		Demo how to Choose Report dropdown
		*/
		if(json.stack){
			// for demo, use the title to create fake report linksv
			let title = json.title.split(' - ');
			
			// build fake report options for <select>
			let options = '<option>'+json.title+'</option>';
			for(let i=json.stack;i;i--){
				options += '<option>' + title[0] + ' - (' + i +' Jan 1975 09:30)</option>';
			}
			
			// create a image "date" stack demo
			let stack = document.createElement('div');
			stack.className = "attachment-stack";
			stack.innerHTML = 'Choose report: <select class="pro-theme">' + options + '</select>';
			
			let base = uiApp.find('.oe-popup-attachment', div );
			base.appendChild( stack );
		}
	
		// setup close icon btn
		btn.close = div.querySelector('.close-icon-btn');
		btn.close.addEventListener("mousedown",removeAttachment, {once:true});
		
		// Add all required buttons
		controls.appendChild(btnFragment);
		
		// reflow DOM
		document.body.appendChild( div );
	}; 
	
	/**
	* Remmove popup DOM and reset
	*/
	const removeAttachment = () => {
		// clean up Eventlisteners
		btn.close.removeEventListener("mousedown",removeAttachment);
		if(btn.save){
			btn.save.removeEventListener("mousedown",removeAttachment);
			btn.cancel.removeEventListener("mousedown",removeAttachment);
		}
		// clear DOM
		uiApp.remove(div);
		open = false;
	};
	
	
	/**
	* Callback for Event
	* @param {event} event
	*/
	const userClick = (event) => {
		if(open) return;
		showAttachment(	JSON.parse(event.target.dataset.attachment ));
	};	
	
	// register for Event delegation
	uiApp.userDown('.' + css.thumb, userClick);
	
	/*
	If there is an "Annotate" button under the thumbail
	*/
	if(document.querySelectorAll('.js-annotate-attachment')){
		uiApp.userDown('.js-annotate-attachment',userClick); 
	}
	
		
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('ed3');	
	
	/*
	Side Nav Select List filtering
	Used in Worklist, Messages, Trials, etc
	Anywhere you have a bunch of "lists" that need filtering. 
	*/
	
	let ed3app = false;
	
	const buildDOM = () => {
		let div = document.createElement('div');
		div.className = "oe-eyedraw-app spinner-loader";
		document.body.appendChild( div );
		return div;
	};
	
	const userClick = (ev) => {
		let btn = ev.target;
		ed3app = ed3app || buildDOM();
		/*
		CSS handles the x (left) positioning but we to position the 
		popup near the button, rather than centered.	
		*/
		let btnY = btn.getBoundingClientRect().bottom;
		/*
		ed3 app height fixed at 532px;
		it can not go above 60px (OE Header)
		*/
		let top = btnY - 532;
		ed3app.style.top = top < 60 ? '60px' : top + "px";
		uiApp.show(ed3app, 'block');
		
		// get demo JSON data
		let json = JSON.parse(btn.dataset.idgDemo);
		// then pass it back into PHP...
		var queryString = Object.keys(json).map(key => key + '=' + json[key]).join('&');
		
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/ed3/ed3-app.php?' + queryString)
			.then( xreq => {
				ed3app.innerHTML = xreq.html;
				ed3app.querySelector('.close-icon-btn').addEventListener('mousedown', () => {
					ed3app.style.display = "none";
				},{once:true});
			})
			.catch(e => console.log('ed3app php failed to load', e));  // maybe output this to UI at somepoint, but for now...			
	};

	uiApp.userDown('.js-idg-ed3-app-btn', userClick);

})(bluejay); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('elementSelector');
	
	/*
	Element Selector 2.0
	Manager & Sidebar Nav
	*/

	const _loadPHP = () => ({
		/**
		* Loads in PHP file into DOM wrapper
		*/
		loadPHP:function(demo){
			// xhr returns a Promise... 
			uiApp.xhr(demo)
				.then( xreq => {
					// in the meantime has the user clicked to close?
					if(this.open === false) return; 
					
					this.nav = document.createElement('nav');
					this.nav.className = this.wrapClass;
					this.nav.innerHTML = xreq.html;
					// reflow DOM
					this.btn.classList.add('selected');	
					
					document.body.appendChild( this.nav );
							
				})
				.catch(e => console.log('PHP failed to load', e));  // maybe output this to UI at somepoint, but for now...
		}
	});
	
	const _close = () => ({
		/**
		* Close overlay
		* @param {Object} Event
		*/
		close:function(){
			this.open = false;
			this.btn.classList.remove('selected');
			uiApp.remove(this.nav);	
		}
	});
	
	const _change = () => ({
		/**
		* Change state
		* @param {Object} Event
		*/
		change:function(ev){
			if(this.btn === null)	
				this.btn = ev.target;

			if(this.open){
				this.close();
			} else {
				this.open = true;
				let demoPHP = JSON.parse(this.btn.dataset.demophp);
				if(demoPHP !== false){
					this.loadPHP(demoPHP);
				} else {
					this.elementSideNav();
				}
				
			}
		}
	});
	
	const _elementSideNav = () => ({
		elementSideNav:function(){
			this.nav = document.createElement('nav');
			this.nav.className = this.wrapClass;
			
			const elementTitles = uiApp.nodeArray(document.querySelectorAll('.element .element-title'));
			const listItems = elementTitles.map((title) => {
				return '<li class="element" id="side-element-contacts"><a href="#" class="selected">' + title.textContent + '</a></li>';
			});
		
			this.nav.innerHTML = [
				'<div class="element-structure">',
				'<ul class="oe-element-list">',
				listItems.join(''),
				'</ul>',
				'</div>'].join('');	
				
			document.body.appendChild( this.nav );
		}
	});
	
	/**
	* @Class 
	* @param {Object} set up
	* @returns new Object
	*/	
	const ElementOverlay = (wrap) => {
		return Object.assign({
			btn: null, 
			open: false,
			wrapClass: wrap
		}, 
		_change(),
		_loadPHP(), 
		_elementSideNav(),
		_close());			
	};

	/*
	Element manager is only required (currently) in Examination
	Only set up if DOM is available
	*/
	if(document.querySelector('#js-manage-elements-btn') !== null){
		const manager = ElementOverlay('oe-element-selector');
		// register Events
		uiApp.userDown('#js-manage-elements-btn', (ev) => manager.change(ev) );
		uiApp.userDown('.oe-element-selector .close-icon-btn button', () => manager.close() );
	}
		
	/*
	Sidebar Element view should be available in all Events
	Only set up if DOM is available
	*/
	if(document.querySelector('#js-element-structure-btn') !== null){
		const sidebar = ElementOverlay('sidebar element-overlay');
		// register Events
		uiApp.userDown('#js-element-structure-btn', (ev) => sidebar.change(ev) );
	}
	

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('eventAuditTrial');	
	
	/*
	Only 1 of these per Event page
	*/
	const selector = '#js-event-audit-trail-btn';
	const icon = document.querySelector(selector);
	if(icon === null) return; 
	
	/*
	'popup' content should be pre-loaded in the DOM
	*/
	const popup = document.querySelector('#js-event-audit-trail');
	if(popup === null) uiApp.log('Audit Trail content not available in DOM?');
	
	let showing = false;
	
	/**
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => showing ? hide(ev) : show(ev);

	/**
	* Callback for 'hover'
	* @param {Event} ev
	*/
	const show = (ev) => {
		uiApp.show(popup, 'block');
		icon.classList.add('active');
		showing = true;
	};
	
	/**
	* Callback for 'ext'
	* @param {Event} ev
	*/
	const hide = (ev) => {
		uiApp.hide(popup);
		icon.classList.remove('active');
		showing = false;
	};
	
	/*
	Events	
	*/
	uiApp.userDown(selector,userClick);
	uiApp.userEnter(selector,show);
	uiApp.userLeave(selector,hide);


})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('eventsUserTrail');	
	
	/*
	Provide a popup for a USER event activity in VIEW	
	*/
	const iconBtn = document.querySelector('#js-events-user-trail');
	if(iconBtn === null) return;
	
	let div = null;	

	const toggleEventDetails = (ev) => {
		let icon = ev.target;
		let trail = div.querySelector('#' + icon.dataset.auditid);
		
		// Did try mouseenter but it was causing a layout flicker!	
		if(trail.style.display === "block"){
			trail.style.display = "none";
		} else {
			trail.style.display = "block";
		}
	};
	
	const show = () => {
		// Build DOM
		div = document.createElement('div');
		div.className = "oe-popup-wrap";
		
		let content = document.createElement('div');
		content.className = "oe-popup oe-events-user-trail";
		
		div.appendChild(content);
		document.body.appendChild( div );
			
		// slow loading??
		let spinnerID = setTimeout( () => content.innerHTML = '<i class="spinner"></i>', 400);
		
		// xhr returns a Promise... 	
		uiApp.xhr('/idg-php/v3/_load/sidebar/events-user-trail-v2.php')
			.then( xreq => {
				clearTimeout(spinnerID);
				content.innerHTML = xreq.html;
			})
			.catch(e => console.log('ed3app php failed to load',e));  // maybe output this to UI at somepoint, but for now...	
	};
	
	const hide = () => {
		uiApp.remove(div);
	};
	

	uiApp.userDown('#js-events-user-trail', show);
	uiApp.userDown('.js-idg-toggle-event-audit-trail',toggleEventDetails);
	uiApp.userDown('.oe-events-user-trail .close-icon-btn .oe-i', hide);
		

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('examElementSearch');	
	
	/*
	Exam Element Search (pre OE 3.0
	IDG basic demo. DOM is pre-loaded
	*/
	
	if(document.querySelector('#js-search-in-event-popup') === null) return;

	const userClick = (ev) => {
		const	hdBtn = ev.target,
				popup = document.querySelector('#js-search-in-event-popup'),
				mainEvent = document.querySelector('.main-event'),
				closeBtn = popup.querySelector('.close-icon-btn');
		
		hdBtn.classList.add('selected');
		uiApp.show(popup, 'block');
		// the pop will overlay the Event.. add this class to push the Exam content down
		mainEvent.classList.add('examination-search-active');
		
		closeBtn.addEventListener('mousedown',(ev) => {
			ev.stopPropagation();
			mainEvent.classList.remove('examination-search-active');
			uiApp.hide(popup);
			hdBtn.classList.remove('selected');
			
		},{once:true});		
	};
	
	/*
	Events
	*/
	uiApp.userDown(	'#js-search-in-event',	userClick );

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('filterOptions');
	
	/*
	Filter options is kinda like the Adder 
	but it's a filter icon and it postions smarter 
	it can anchor to any of the four corners and the content
	updates appropriately	
	*/
	
	const states = [];
	const cssActive = 'active';
	
	/*
	Methods	
	*/
	
	const _change = () => ({
		/**
		* Callback for 'click'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Callback for 'hover'
		* Enhanced behaviour for mouse/trackpad
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( cssActive );
			this.positionContent();
			uiApp.show(this.content, 'block');
			this.mouseOutHide();
			this.closeIconBtn();
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false) return;
			this.open = false;
			this.btn.classList.remove( cssActive );
			uiApp.hide(this.content);
		}
	});
	
	const _closeIconBtn = () => ({
		closeIconBtn: function(){
			this.wrapper.querySelector('.close-icon-btn').addEventListener('mousedown',(ev) => {
				ev.stopPropagation();
				this.hide();
			},{once:true});
		}
	});
	
	const _mouseOutHide = () => ({
		/**
		* Enhanced behaviour for mouse/trackpad
		*/
		mouseOutHide: function(){
			this.wrapper.addEventListener('mouseleave',(ev) => {
				ev.stopPropagation();
				this.hide();
			},{once:true});
		}
	});
	
	const _positionContent = () => ({
		positionContent:function(){
			this.defaultCSS = this.defaultCSS || this.content.className;

			// CSS needs setting up to sort UI layout
			let btn = this.btn.getBoundingClientRect();
			let content = uiApp.getHiddenElemSize(this.content);
			let css,top,left;
	
			if(btn.top < 400){
				css = "top";
				top =  btn.top;
			} else {
				css ="bottom";
				top = btn.bottom - content.h; 
			}
			
			if(btn.left < 500){
				css += "-left";
				left = btn.left;
			} else {
				css += "-right";
				left = btn.right - content.w;
			}
			
			this.content.className = this.defaultCSS + " " + css;
			this.content.style.top = top + 'px';
			this.content.style.left = left + 'px'; 
		}		
	});
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const FilterOption = ( me ) => {
		return Object.assign( me,
			_change(),
			_show(),
			_hide(),
			_mouseOutHide(),
			_closeIconBtn(),
			_positionContent());
	};


	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {

		let btn = ev.target;
		let dataAttr = uiApp.getDataAttr(btn);
		if(dataAttr){
			/*
			Setup already, change it's state
			*/
			states[parseFloat(dataAttr)].change();
		} else {
			/*
			Collapsed Data is generally collapsed (hidden)
			But this can be set directly in the DOM if needed
			*/
			let parent = uiApp.getParent(btn, '.oe-filter-options');
			let filter = FilterOption({	btn: btn,
										wrapper: parent,
										content: parent.querySelector('.filter-options-popup') });
				
			filter.show(); // user has clicked, update view	
			uiApp.setDataAttr(btn, states.length); // flag on DOM										
			states.push(filter); // store state			
		}
	};

	// Regsiter for Events
	uiApp.userDown('.oe-filter-options .oe-filter-btn', ev => userClick(ev) );	
	
})( bluejay ); 
/*
Lightning (Document Viewer page)
Updated to Vanilla JS for IDG
*/

(function (uiApp) {

	'use strict';	
	
	const lightning = uiApp.addModule('lightning');	
	
	if(document.querySelector('.oe-lightning-viewer') === null) return;
	
	/*
	Methods	
	*/
	const _updateView = () => ({
		updateView: function(id){
			this.updateStack(id);
			this.updateMeta(document.querySelector(this.iconPrefix + id).dataset.meta);
		}
	});
	
	const _updateMeta = () => ({
		updateMeta: function(meta){
			let div = document.querySelector('.lightning-meta');
			let info = meta.split(',');
			['.type','.date','.who'].forEach((item, index) => {
				div.querySelector(item).textContent = info[index];
			});
		}
	});
	
	const _updateStack = () => ({
		updateStack: function(stackID){
			uiApp.hide(document.querySelector(this.stackPrefix + this.currentStack));
			uiApp.show(document.querySelector(this.stackPrefix + stackID), 'block');
			this.currentStack = stackID; // track id
			this.updateCounter();
			this.timelineIcon();
		}
	});
	
	
	const _updateCounter = () => ({
		updateCounter: function(){
			document.querySelector('.lightning-ui .stack-position').textContent = this.currentStack+1 + '/' + this.totalStackNum;
		}
	});

	const _timelineIcon = () => ({
		timelineIcon: function(){
			document.querySelector('.icon-event').classList.remove('js-hover');
			document.querySelector(this.iconPrefix + this.currentStack).classList.add('js-hover');	
		}
	});
	
	/*
	xscroll using DOM overlay (rather than the image)
	(note: the overlay has 2 possible widths depending on browser size)
	*/
	const _xscroll = () => ({
		xscroll: function(xCoord,e){
			var xpos = Math.floor(xCoord/(this.xscrollWidth / this.totalStackNum));
			if(this.locked == false){
				this.updateView( xpos );
			} 
		}
	});
	
	const _swipeLock = () => ({
		swipeLock: function(){
			this.locked = !this.locked;
			let help = document.querySelector('.lightning-ui .user-help');
			if(this.locked){
				help.textContent = 'Swipe is LOCKED | Click to unlock';
			} else {
				help.textContent = 'Swipe to scan or use key RIGHT / LEFT | Click to LOCK swipe';
			}
		}
	});

	const _stepThrough = () => ({
		stepThrough: function(dir){
			var next = this.currentStack + dir;
			if( next >= 0 && next < this.totalStackNum){
				this.updateView(next);
			}
		}
	});
	

	/**
	* singleton 
	* (using IIFE to maintain code pattern)
	*/
	const app = (() => {
		return Object.assign({	
			currentStack: 0,
			iconPrefix: '#lqv_',
			stackPrefix: '#lsg_',
			totalStackNum: document.querySelectorAll('.stack-group').length,
			xscrollWidth: document.querySelector('.lightning-view').clientWidth,
			locked: true
		},
		_updateView(),
		_updateMeta(), 
		_updateStack(),
		_updateCounter(),
		_timelineIcon(),
		_xscroll(),
		_swipeLock(),
		_stepThrough());
	})();
	
	
	/*
	setup viewer	
	*/
	app.updateCounter();
	app.swipeLock();
	
	/*
	Events	
	*/
	uiApp.userDown('#lightning-left-btn', () => app.stepThrough(-1));
	uiApp.userDown('#lightning-right-btn', () => app.stepThrough(1));
	uiApp.userDown('.lightning-view', () => app.swipeLock());
	uiApp.userDown('.icon-event', () => app.swipeLock());
	
	uiApp.userEnter('.icon-event', (ev) => {
		let icon = ev.target;
		app.updateStack( icon.dataset.id );
		app.updateMeta( icon.dataset.meta );
	});
	
	const view = document.querySelector('.lightning-view');
	view.addEventListener('mousemove', (ev) => {
		//app.xscroll(e.pageX - offset.left,e);
	});
	
	uiApp.listenForResize(() => app.xscrollWidth = view.clientWidth);

	document.addEventListener('keydown', (ev) => {
		if ((ev.keyCode || ev.which) == 37) app.stepThrough(-1);
		if ((ev.keyCode || ev.which) == 39) app.stepThrough(1);
	});
		
		
})(bluejay); 

(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('lightningIconGroups');
	
	const iconGroups = uiApp.nodeArray(document.querySelectorAll('.icon-group'));
	if(iconGroups.length < 1) return;
	
	iconGroups.forEach((group) => {
		let count = group.childElementCount;
		let div = document.createElement('div');
		div.textContent = '(' + count + ')';
		uiApp.hide(div);
		group.parentNode.appendChild(div);
	});
	
	const collapseTimeline = (ev) => {
		let icon = ev.target;
		let group = document.querySelector('#js-icon-' + icon.dataset.icons);
		if(icon.classList.contains('collapse')){
			uiApp.hide(group);
			uiApp.show(group.nextElementSibling, 'block');
			icon.classList.replace('collapse','expand');
		} else {
			uiApp.show(group, 'block');
			uiApp.hide(group.nextElementSibling);
			icon.classList.replace('expand','collapse');
		}
	};
	
	/*
	Events 
	*/
	uiApp.userDown('.js-timeline-date', collapseTimeline);
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('multiPageScroll');
	
	/*
	Mulit Page Scroll Widget. 
	Used in Correspondence VIEW and Lightning Viewer for Letters 
	... and maybe other places too.
	Currently only an IDG thing tho.
	*/
	
	let multiPageScroll = uiApp.nodeArray(document.querySelectorAll('.lightning-multipage-scroll'));
	if( multiPageScroll.length ===  0 ) return;	


	const _animateScrollTo = () => ({
		animateScrollTo:function(pageNum){
			const easeInOutQuad = t => t<0.5 ? 2*t*t : -1+(4-2*t)*t;
			const duration = 80; // num of animation steps
			let step = 1;	
			let time = 0;
			let startPos = this.stack.scrollTop;
			let endPos = (this.pageH * pageNum) - startPos;
			// first clear any running animation
			clearInterval(this.animateID);
			// set up the animation		
			this.animateID = setInterval(() => {
				time = Math.min(1, (step/duration));
				this.stack.scrollTop = Math.ceil((easeInOutQuad(time) * endPos)) + startPos;
				step = step + 1; // increment animation
				if(time == 1) clearInterval(this.animateID); 
			}, 2);
		}
	});
	
	const _pageBtn = () => ({
		pageBtn:function(btn){
			if(btn.matches('.page-num-btn')){
				this.animateScrollTo(parseFloat(btn.dataset.page));
			}
		}
	});

	const PageScroller = (me) => {
		me.numOfImgs = me.stack.querySelectorAll('img').length;
		/*
		Get first IMG height Attribute to work out page scrolling.
		Note: CSS adds 10px padding to the (bottom) of all images !
		*/
		me.pageH = parseFloat(me.stack.querySelector('img').height + 10);
		me.animateID = null;
		/*
		Build Page Nav Page scroll btns
		e.g. <div class="page-num-btn">1/4</div>
		*/	
		let frag = new DocumentFragment();

		for(let i = 0; i < me.numOfImgs; i++){
			let btn = document.createElement('div');
			btn.className = "page-num-btn";
			btn.setAttribute('data-page', i);
			btn.textContent = (i+1) + "/" + me.numOfImgs;
			frag.appendChild(btn);
		}
		
		me.nav.appendChild(frag);
		me.nav.addEventListener('mouseenter', (ev) => me.pageBtn(ev.target), {capture:true});
		me.nav.addEventListener('mousedown', (ev) => me.pageBtn(ev.target), {capture:true});

		return Object.assign(	me,
								_pageBtn(),
								_animateScrollTo() );
	};

	multiPageScroll.forEach((mps) => {
		PageScroller({	nav: mps.querySelector('.multipage-nav'),
						stack: mps.querySelector('.multipage-stack')
		});	
	});
	
	
	
})(bluejay); 
(function( bj ) {
	
	'use strict';
	
	bj.addModule('oesLayoutOptions'); 
	
	const dataLayoutElem = document.querySelector('.oes-hd-data-layout');
	
	// check for DOM...
	if( dataLayoutElem == null ) return; 
	
	/** 
	* Model
	* extended with views
	*/	
	const model = Object.assign({ 
		selector: {
			rootElem: 	'.oes-hd-data-layout',
			btn: 		'.oes-hd-data-layout .layout-select-btn',
			optionBtn: 	'.oes-hd-data-layout .option-btn',
			options: 	'.layout-options',
		},
		
		current: {
			eye: JSON.parse( dataLayoutElem.dataset.oes ).eyeIcons,
			layout: JSON.parse( dataLayoutElem.dataset.oes ).layout,
		},

		get eye(){
			return this.current.eye;
		}, 
		
		set eye( val ){
			if( val === this.current.eye ) return false;
			this.current.eye = val;
			this.views.notify();
		},
		
		get layout(){
			return this.current.layout;
		},
		
		set layout( val ){
			if( this.current.layout === val) return false;
			this.current.layout = val;
			this.views.notify();
		}
	
	}, bj.ModelViews());
	
	
	/**
	* Build DOM for eye and layout options and insert for user selection
	*/
	const buildOptions = (() => {
		// Mustache template
		const template = [
			'{{#sides}}',
			'<div class="option-btn" data-oes=\'{"opt":"eye.{{eyelat.r}}-{{eyelat.l}}"}\'><span class="oe-eye-lat-icons"><i class="oe-i laterality {{eyelat.r}} small"></i><i class="oe-i laterality {{eyelat.l}} small"></i></span></div>',
			'{{/sides}}',
			'{{#layouts}}',
			'<div class="option-btn" data-oes=\'{"opt":"layout.{{.}}"}\'><i class="oes-layout-icon i-{{.}}"></i></div>',
			'{{/layouts}}',
		].join('');
		
		// build layout DOM
		const div = document.createElement('div');
		div.className = model.selector.options.replace('.','');
		div.innerHTML = Mustache.render( template, {
			'sides' : [
				{ eyelat: { r:'R', l:'NA'}},
				{ eyelat: { r:'R', l:'L'}},
				{ eyelat: { r:'NA', l:'L'}}
			],
			'layouts' : ['1-0', '2-1', '1-1', '1-2', '0-1'], 
		} );
		
		bj.hide( div );
		dataLayoutElem.appendChild( div );
		
	})();

	/** 
	* View 
	* show current state of model in UI
	*/
	const currentState = (() => {
		// btn DOM elements
		const css = {
			layout: 'oes-layout-icon'
		};
		
		const layoutBtn = document.querySelector( model.selector.btn );
		const layout = layoutBtn.querySelector( '.' + css.layout );
		const eyelat = layoutBtn.querySelector( '.oe-eye-lat-icons' );

		const iconTemplate ='{{#eyes}}<i class="oe-i laterality {{.}} small pad"></i>{{/eyes}}';
		
		/**
		*  make sure UI reflects model updates
		*/
		const update = () => {
			
			layout.className = css.layout + '  i-' + model.layout;
			let eyes = model.eye.split('-'); 
			eyelat.innerHTML = Mustache.render( iconTemplate, { eyes });
			
			// other JS may be updating on this.
			bj.customEvent('oesLayoutEyeSide', eyes );
		};
		
		// add to observers
		model.views.add( update );
		
	})();
	
	
	const oesSides = (() => {
		// dom side divs
		let layout = null;
		const right = document.querySelector('.oes-v2 .oes-right-side');
		const left = document.querySelector('.oes-v2 .oes-left-side');
		
		/**
		* set layout proportions to match the model
		*/
		const resize = () => {
			if(model.layout === layout) return; 
			layout = model.layout;
		
			// options (see buildOptions above)
			// ['1-0', '2-1', '1-1', '1-2', '0-1']
			switch( layout ){
				case '1-0': 
					left.style.width = "";
					bj.show( left );
					bj.hide( right );			
				break;
				case '0-1': 
					right.style.width = "";
					bj.hide( left );
					bj.show( right );			
				break;
				case '2-1':
					left.style.width = "66%"; 
					right.style.width = "33%";
					bj.show( left );
					bj.show( right );			
				break;
				case '1-2':
					left.style.width = "33%"; 
					right.style.width = "66%";
					bj.show( left );
					bj.show( right );			
				break;
				case '1-1':
					left.style.width = "50%"; 
					right.style.width = "50%";
					bj.show( left );
					bj.show( right );			
				break;
				
				default: 
					throw new TypeError('[bluejay] [oesLayoutOptions] - unknown layout: ' + layout);
			}
			
			bj.customEvent('oesLayoutChange', layout);
		};
		
		// make widths are set correctly on initalisation
		resize();
		
		// add to observers
		model.views.add( resize );
	})();
	
	
	/** 
	* View 
	* Data and Layout options bar
	*/
	const options = (() => {
		
		let showing = false;
		const btn = dataLayoutElem.querySelector(  model.selector.btn );
		const elem = dataLayoutElem.querySelector( model.selector.options );
		
		/**
		* Event callbacks
		*/
		const show = ( ev ) => {
			showing = true;
			bj.show( elem); 
			btn.classList.add('active'); 
		};
		
		const hide = ( ev ) => {
			showing = false;
			bj.hide( elem );
			btn.classList.remove('active'); 
		}; 
		
		const change = ( ev ) => {
			if( showing ){
				hide();
			} else {
				show();
			}
		};
		
		// public
		return { show, hide, change };
				
	})();

	/**
	* Handler
	* @param {JSON} dataAttr - see Mustache template above
	*/
	const requestOption = ( dataAttr ) => {
		let json = JSON.parse( dataAttr ); 
		let arr = json.opt.split('.');
	
		if( arr[0] == 'eye' ) model.eye = arr[1];
		if( arr[0] == 'layout' ) model.layout = arr[1];
		
	};
	
	/**
	* Events
	*/
	bj.userDown( model.selector.btn, options.change );
	bj.userEnter( model.selector.btn, options.show );
	bj.userLeave( model.selector.rootElem, options.hide );
	// select an option 
	bj.userDown( model.selector.optionBtn, ( ev ) => requestOption( ev.target.dataset.oes ) );
	
	
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('problemsPlans');

	/*
	Assumes that the "problems-plans-sortable"	<ul>
	is already in the DOM and not dynamically loaded. 
	Note: in Patient Overview the same list is editable in
	TWO places the popup and in main page area.
	*/
	const pps = uiApp.nodeArray(document.querySelectorAll('.problems-plans-sortable'));
	if(pps.length < 1) return; 
	
	/*
	list state for Problems and Plans Lists
	(this can be JSON'd back to server)
	*/
	const listMap = [];
	const mapObj = (id,text,info) => ({id:id,text:text,info:info});
	/*
	only need to use first list to set up 
	if more (two) they should be identical!
	*/
	uiApp.nodeArray(pps[0].querySelectorAll('li')).forEach((li)=>{
		listMap.push( mapObj(	listMap.length,
								li.textContent,
								li.querySelector('.info').getAttribute('data-tooltip-content') 
							)
		);
	});
	
	// updated all DOM <li>'s with uniqueIDs
	pps.forEach((list) => {
		uiApp.nodeArray(list.querySelectorAll('li')).forEach((li,index) => {
			uiApp.setDataAttr(li,index);
		});
	});
	
	// use a unique id for each new DOM list added, using this for basic DOM diffing 
	let listUID = listMap.length+1;  
	
	/**
	* loop through and check DOM against listMap 
	*/
	const reorderDOM = () => {
		pps.forEach((list) => {
			let listNodes = list.querySelectorAll('li');
			for(let i=0, len=listMap.length; i<len; i++){
				let map = listMap[i];
				let li = listNodes[i];
				
				// check list<ap and dom match up
				if(map.id != uiApp.getDataAttr(li)){
					// nope, update DOM attribute
					uiApp.setDataAttr(li, map.id);
					// update list content 
					li.innerHTML = domString(map.text, map.info);
				}
			}
		});
	};
	
	/**
	* Add new List item to the DOM(s)
	* @param {DocFragment} frag - new <li>
	* @param {Number} id - unique List id 
	*/
	const addToDOM = (frag, id) => {
		pps.forEach((list) => {
			list.appendChild(frag.cloneNode(true));
			makeDraggable(list.lastChild);  // now it's inserted in the DOM, set up listeners
		});
	};
	
	/**
	* Build <li> innerHTML domString
	* @param {String} text - <li> text to show
	* @param {String} info - text for the info icon tooltip
	* @returns {String}
	*/
	const domString = (text,info) => {
		return [	'<span class="drag-handle"><i class="oe-i menu medium pro-theme"></i></span>',
					text,
					'<div class="metadata">',
					'<i class="oe-i info small pro-theme js-has-tooltip" data-tooltip-content="',
					info,
					'"></i></div>',
					'<div class="remove"><i class="oe-i remove-circle small pro-theme pad"></i></div>'
					].join('');
	};
	
	/**
	* Create New <li> Fragment for insertion
	* @param {Object} obj - new listMap Obj 
	* @returns {DOMFragment}
	*/
	const domFragment = (obj) => {
		const fragment = new DocumentFragment();
		const li = document.createElement('li');
		li.innerHTML = domString(obj.text, obj.info);
		uiApp.setDataAttr(li, obj.id); 
		fragment.appendChild(li);
		
		return fragment;
	};
	
	/**
	* Callback for 'drop', update listMap based on the last drag'n'drop
	* @param {String} a - Source textContent
	* @param {String} b - textContent of Element switched with
	*/
	const updateListOrder = (aNum,bNum) => {
		let a = listMap.findIndex( e => e.id == aNum );
		let b = listMap.findIndex( e => e.id == bNum );
		listMap[a] = listMap.splice(b,1,listMap[a])[0];	
		// other lists to reorder?	
		if(pps.length > 1) reorderDOM();
	};

	/**
	* Callback for 'click' on <button> next to input field
	* @param {Event} ev
	*/
	const addListItem = (ev) => {
		ev.preventDefault(); // as <button>
		let parent = uiApp.getParent(ev.target,'.create-new-problem-plan');
		let input = parent.querySelector('input');
		if(!input || input.value.length < 2) return; 
		
		let newListItem = mapObj(listUID++, input.value, "Added now!");					
		listMap.push(newListItem); // update listMap
		addToDOM(domFragment(newListItem));	// update DOM
	};

	
	/**
	* Callback for 'click' on remove-circle icon
	* @param {Event} ev
	*/
	const removeListItem = (ev) => {
		/*
		Because of the DOM structure for <ul>, simply find 
		the node index and then remove it	
		*/
		let li = uiApp.getParent(ev.target,'li');
		let i = 0;
		while( (li = li.previousSibling) !== null ) i++;
		
		// update DOM
		pps.forEach((list) => {
			uiApp.remove(list.childNodes[i]);
		});
		
		// update listMap
		listMap.splice(i,1);
	};

	/* 
	Events
	*/
	uiApp.userDown('.create-new-problem-plan button', addListItem);
	uiApp.userDown('.problems-plans-sortable .remove-circle', removeListItem);
	
	document.addEventListener('DOMContentLoaded', () => {
		pps.forEach((list)=>{
			uiApp.nodeArray(list.querySelectorAll('li')).forEach((li)=>{
				makeDraggable(li);
			});
		});
	});

	/*
	********************************
	Drag n Drop
	********************************
	*/
	let dragSourceElement = null;
	let listDragCSSFlag = "js-sorting-list";  // add to <ul> on dragstart and restrict drops to this class

	/**
	* handle start of drag
	* @param {Event} 
	*/
	const handleStart = (e) => {
		dragSourceElement = e.target; // remove source target to swap on drop
		e.target.parentNode.classList.add(listDragCSSFlag); // flag used to control 'drop' area
		/*
		setData using a custom 'type' as only for this app. however, might need 
		to provide a fallback of "text/plain"; Using "text/html" adds a <meta>!?
		*/
		e.dataTransfer.setData('source', dragSourceElement.innerHTML);
	};
	
	const handleEnter = (e) => {
		e.dataTransfer.effectAllowed = 'move';	// use browser API effects
		e.dataTransfer.dropEffect = 'move';
	};
	
	const handleOver = (e) => {
		// To allow a drop, you must prevent default handling  (as most areas don't allow a drop)	
		if(e.preventDefault) e.preventDefault(); // Necessary. Allows Drop (if it's a link or somethink clickable!)
		return false; // good practice
	};
	
	/**
	* handle drop
	* @param {Event} 
	*/
	const handleDrop = (e) => {
		if(e.stopPropagation) e.stopPropagation(); // stops the browser from redirecting.
		/*
		Without this it would be possible to mix up 2 P'n'P lists!
		*/
		if(e.target.parentNode.classList.contains(listDragCSSFlag) === false) return;
		e.target.parentNode.classList.remove(listDragCSSFlag);

		// Make sure we are not dropping it on ourself...
		if (dragSourceElement !=  e.target) {
			dragSourceElement.innerHTML = e.target.innerHTML;       // switch them around
			e.target.innerHTML = e.dataTransfer.getData('source');
			
			// update listMap
			updateListOrder( uiApp.getDataAttr(dragSourceElement), uiApp.getDataAttr(e.target) );
		}
		return false;
	};
	
	/*
	const handleEnd = (e) => {
	  // this/e.target is the source node. clean up after dragging about!
	};
	*/

	const makeDraggable = (li) => {
		/*
		List items are not draggable by default
		*/
		li.setAttribute('draggable','true');
		li.addEventListener('dragstart',handleStart, false);
		/*
		'dragenter' & 'dragover' events are used to indicate valid drop targets.
		As the rest of the App is not a valid place to "drop" list item, 
		EventListeners need to be targeted to specific elements		
		Set up each <li> DOM to allow Drag n Drop
		*/
		li.addEventListener('dragenter',handleEnter, false);
		li.addEventListener('dragover',handleOver, false);
		li.addEventListener('drop',handleDrop, false);
		//li.addEventListener('dragend', handleEnd,false);	
		
		
		
	};
			
})(bluejay); 

(function( bj ){
	
	'use strict';
	
	bj.addModule('quicktag'); 
	
	/**
	Model
	*/
	const model = {
		// for string matching remove case.
		qtags: [ 'Adverse_Event', 'Serious_Adverse_Event', 'Note', 'My_research', 'my_teaching', 'Research', 'Teaching', 'Referred', 'Results', 'My_Results_pending' ].map( t => t.toLowerCase()), 
		
	};
	
	
	/**
	* Find and style qTags in a String
	* @param {String} str - str to check for qTags
	* @returns {Object} - raw text and HTML DOMString
	*/
	const wrapQtags = ( str ) => {
		let words = str.split(' ');
		let comments = [];
		let qtags = [];

		words.forEach(( word, index ) => {
			if( word.startsWith('#')){
				if( model.qtags.indexOf( word.substring( 1 )) >= 0 ){
					qtags.push( word ); // Offical tag! 
				} else {
					comments.push( word ); // unoffical tag e.g. '#3'
				}
			} else {
				comments.push( word );
			}
		});
		
		qtags.sort();
		
		// did we find any tags?
		if( qtags.length ){
			let styledTags = qtags.map( tag => `<span class="qtag">${tag}</span>` );	
			return {
				text: qtags.join(' ') + ' ' + comments.join(' '),
				DOMString: styledTags.join(' ') + '<span class="dot-list-divider"></span>' +  comments.join(' '),
			};
		} 
		
		// no tags found?
		return {
			text: str,
			DOMString: str,
		};
	};
	
	// make this available to other modules
	// e.g. commentsHotlist
	bj.extend('wrapQtags', wrapQtags );
	
	
	/**
	View - Quick Tag 'swarm'
	*/
	const quickTags = (() => {
		// Mustache
		const template = '{{#qtags}}<span class="qtag">#{{.}}</span> {{/qtags}}';
		
		let ready = false;
		let tag = "";
		const elem = {
			input: null,
			tags: null,
			flag: null, 
		};
		
		/**
		* Complete reset 
		*/
		const reset = () => {
			if( !ready ) return; 
			
			bj.remove( elem.tags );
			bj.remove( elem.flag );
			bj.unwrap( elem.input );
			
			elem.tags = null;
			elem.flag = null;
			elem.input = null;
			
			ready = false;
 		};
		
		/**
		* Show tag swam, hide flag
		*/
		const showTags = () => {
			elem.tags.style.display = "block";
			elem.flag.style.display = "none";
			
			// re-show with all tags (hidden)
			qtags( model.qtags );
		};
		
		/**
		* Hide tag swam, show flag
		*/
		const hideTags = () => {
			elem.tags.style.display = "none";
			elem.flag.style.display = "block";
		};
		
		/**
		* selectedTag, make this available to the controller
		* @returns {String || null}
		*/
		const selectedTag = () => tag;
		
		/**
		* Use Mustache to build tags swarm
		* @param {Array} tagArr - tag list is filtered as the user types.
		*/
		const qtags = ( tagArr ) => {
			if( tagArr.length ){
				/*
				update tags and show the selected tag
				as user types the tag swarm is filtered
				so always make the first tag as selected
				*/
				tag = tagArr[0];
				elem.tags.innerHTML = Mustache.render( template, { qtags: tagArr });
				elem.tags.querySelector('.qtag:first-child').classList.add('selected'); 
			} else {
				tag = "";
				elem.tags.innerHTML = '<div class="no-matching-tags">No matching Patient Tags</div>';
			}
		};
		
		/**
		* Controller callback on input watch
		* @param {String} userStr - starting from "#"...  
		*/
		const userTyping = ( userStr ) => {
			userStr = userStr.toLowerCase(); // clean user input
			const strMatch = userStr.match(/[a-z-_]*/)[0]; // note: [0]
			const strlen = strMatch.length;
			// filter all tags 
			const filteredTags = model.qtags.filter( tag => {
				return ( tag.substring(0, strlen) == strMatch ); 
			});
			// update 'swarm'
			qtags( filteredTags );
		};
		
		/**
		* Intialise on the input
		* Setup and provide a UI Flag on the input to let the user 
		* know that they can qtag this input
		* @param {Element} input - input or textarea to tag;
		*/
		const init = ( input ) => {
			
			if( ready ) return; 
			ready = true;	
			/*
			Using the "wrap" we can now position the div
			relativelto the wrapper. The reason behind this
			approach (rather than used "fixed") is because of 
			comments in hotlist. Using fixed causes the "mouseleave"
			to fire, closing the hotlist panel.  
			*/
			const wrap = bj.wrap( input, "js-qtag-wrapper" );
			
			// "wrap" will cause focus to be lost from the input
			input.focus();
			
			// add qtags div (hidden for now)
			let tags = document.createElement('div');
			tags.className = "oe-qtags";
			tags.style.display = "none"; 
			
			// UI flag to user
			let flag = document.createElement('div');
			flag.className = "oe-qtags-flag";
			flag.textContent = "#";
			
			/*
			check input position
			note: tag swarm updates as user types and textarea expands down
			170px allows for a few lines of comments and 3 rows of tags BELOW.
			*/
			if( input.getBoundingClientRect().top < ( bj.getWinH() - 170 )){
				tags.style.top = '100%';
				flag.style.top = '100%';
			} else {
				tags.style.bottom = '100%'; 
				flag.style.bottom = '100%';
			}
			
			// update DOM
			wrap.appendChild( flag );
			wrap.appendChild( tags ); 
			
			// store Elements
			elem.input = input;
			elem.tags = tags;
			elem.flag = flag;
			
			// setup with all tags (hidden)
			qtags( model.qtags );
		};
		
		// reveal
		return { 
			init,
			showTags,
			hideTags,
			userTyping, 
			selectedTag,
			reset, 
		};
			
	})();
	
	
	/**
	* user: keydown
	* SPACEBAR | ENTER | TAB
	* Need to use keydown because "Enter" in <input> doesn't work
	* These keys events need controlling to: 
	* - allow fast user input and match similar UI mechanisms
	* - stop their generic UI use (spacebar nudging the page down, tab changes input focus) 
	* - note: spacebar is entering a tag (not cancelling) because the tags are set in the Admin
	* @param {Event} ev
	*/
	const handleKeyDown = ( ev ) => {
		/*
		MDN: ignore all keydown events that are part of composition
		*/
		if( ev.isComposing || ev.keyCode === 229 ) return;
		
		/*
		ENTER || TAB 
		Using Enter and Tab to quickly enter the selected tab
		However, these keys have other GUI behaviours
		Also: Enter is used in patient comments to saves the hotlist comments
		*/
		if( ev.key == 'Enter' || ev.key == 'Tab' ){
			ev.preventDefault();
			ev.stopPropagation();
			inputController.insertTag( quickTags.selectedTag() );		
		} 
		
		/*
		SPACEBAR 
		cancel the current quick tagging
		this allows users to type: '#3 injections'
		*/
		if( ev.key == ' ' ){
			inputController.stopTagging();
		}
		
	};
	
	
	/**
	* Controller for inputs
	*/
	const inputController = (() => {
		
		let tagging = false;
		let input = null;
		let insertIndex = 0;
		let inputText = "";
		let holdingFocus = false;
		
		/**
		* full reset of controller and quicktags
		*/
		const reset = () => {
			// cancel events first
			document.removeEventListener('input', watchInput, { capture:true });
			document.removeEventListener('blur', focusOut, { capture: true });
			
			// now reset everything...
			input = null;
			tagging = false;
			insertIndex = 0;
			quickTags.reset();
		};
		
		/**
		* Ready to quick tag
		* and: Callback on the qTag close btn
		*/
		const stopTagging = () => {
			tagging = false;
			insertIndex = 0;
			quickTags.hideTags();
			
			bj.log('[qTags] - Keys: Enter, Tab and Spacebar - normal');
			document.removeEventListener("keydown", handleKeyDown, true );
		};
		
		/**
		* Start quick tagging
		* @param {Number} tagIndex - character position (selectionStart)
		*/
		const startTagging = ( tagIndex ) => {
			// setup for tagging
			tagging = true;
			insertIndex = tagIndex;
			inputText = input.value;
			// this will show all default tags
			quickTags.showTags();
			
			bj.log('[qTags] - Keys: Enter, Tab & Spacebar - suspended (keydown)');
			document.addEventListener("keydown", handleKeyDown, true ); // Important. Must intercept all other key events first
		};
		
		/**
		* Callback from 'keydown' or .qtag 'mousedown'
		* @param {String} tag - without '#'
		*/
		const insertTag = ( tag ) => {	
			let str = tag + ' ';
			if( insertIndex === inputText.length ){
				// add to the end
				input.value = inputText + str;
			} else {
				// insert in the middle
				input.value = inputText.substring( 0, insertIndex ) + str + inputText.substring( insertIndex + 1 );
			}
			stopTagging();
		};   
		
		/**
		* refocus input after a small delay
		* user clicking on qtags flag or tag causes input blur
		* need to hold focus and cancel focusout event
		*/
		const delayInputFocus = () => {
			holdingFocus = true;
			setTimeout(() => {
				input.focus();
				holdingFocus = false;
			}, 20 );
			
		};
		
		/**
		* Callback: User clicks '#' UI flag button
		* setup input and startTagging
		* note: this trigger "focusout" Event
		*/ 
		const userClicksFlag = () => {
			input.value = input.value + ' #';
			startTagging( input.value.length );
			delayInputFocus();
		};
		
		/**
		* Callback: User clicks on a tag
		* insert Tag into input
		* note: this trigger "focusout" Event
		*/ 
		const userClicksTag = ( tagStr ) => {	
			inputController.insertTag( tagStr );
			delayInputFocus();
		};
		
		/**
		* Focus out.
		* Needed due to the comments in the hotlist
		* Users can toggle the icon to edit and save the comments
		* Need to capture the lose of focus to reset.
		*/
		const focusOut = () => {
			if(	holdingFocus ) return;
			reset();
		};
		
		/**	
		* Callback 'input' event
		* watching ALL input events, using Event Delegation
		* note: user could TAB to get to this input
		* @param {Event} ev - input (textarea, input or select)
		*/
		const watchInput = ( ev ) => {
			if( tagging ){
				/*
				Tagging active - watching user typing
				*/
				quickTags.userTyping( input.value.substring( insertIndex )); 
				
			} else if( ev.data === "#" ){
				/*
				key '#' triggers the tagging 
				store the cursor position
				*/
				startTagging( ev.target.selectionStart ); 
			}
		};
		
		/**
		* Init: Callback on 'focusin' event
		* @param {Element} target - any input
		*/
		const init = ( target ) => {
			/*
			When qTags are inititate, input loses focus and then 
			re-gains it, beware this loop.
			*/
			if( target.isSameNode( input )) return;
			
			// Reset only if we already have an active input setup			
			if( input !== null ) reset();
			
			// is new target allow to use tags?
			if( target.classList.contains("js-allow-qtags") ){
				input = target;
				// add UI flag to input
				quickTags.init( input ); 
				document.addEventListener('input', watchInput, { capture:true });
				document.addEventListener('blur', focusOut, { capture: true });	
			}		
		};
		
		// reveal
		return { 
			init,
			stopTagging, 
			insertTag, 
			userClicksFlag,
			userClicksTag,
			reset,
			focusOut,
		};
		
	})();

	/**
	Events
	*/
	
	// custom event delegation
	document.addEventListener('focus', ( ev ) => inputController.init( ev.target ), { capture: true });
	
	// common event delegation
	bj.userDown('.oe-qtags', inputController.stopTagging );
	bj.userDown('.oe-qtags-flag', inputController.userClicksFlag );
	
	// .qtag in .oe-qtags can be click to insert the tag:
	bj.userDown('.oe-qtags .qtag', ( ev ) => {
		const tagStr = ev.target.textContent;
		inputController.userClicksTag( tagStr.substring(1));
	});
	
})( bluejay ); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('reduceElementHeight');	
	
	const states = [];
	
	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Change state 
		*/		
		change: function(){	
			if(this.reduced){
				this.elem.classList.remove('reduced-height');
				this.icon.classList.replace('increase-height-orange','reduce-height');	
			} else {
				this.elem.classList.add('reduced-height');
				this.icon.classList.replace('reduce-height','increase-height-orange');
			}
			
			this.reduced = !this.reduced;
		}
	});
	
	/**
	* @Class
	* @param {Object} me 
	* @returns new Object
	*/
	const ReduceHeight = (me) => {
		me.reduced = false;
		return Object.assign(	me, 
								_change() );
	};

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev, defaults) => {
		let icon = ev.target;
		let dataAttr = uiApp.getDataAttr(icon);
		
		if(dataAttr){
			/*
			Setup already, change it's state
			*/
			states[parseFloat(dataAttr)].change();
		} else {
			/*
			Collapsed Data is generally collapsed (hidden)
			But this can be set directly in the DOM if needed
			*/
			let reducer = ReduceHeight( {	elem: uiApp.getParent(icon,'.element'),
											icon: icon });
				
			reducer.change(); 		// user has clicked, update view
			uiApp.setDataAttr(icon, states.length);											
			states.push(reducer); 	// store state			
		}
	};

	uiApp.userDown('.element .js-elem-reduce .oe-i', userClick );
	
})(bluejay); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('restrictDataHeightFlag');
	
	/*
	Restrict Data Height User Flag 
	Tile Element data (in SEM) and "Past Appointments"
	can be very long lists. There high is restricted by 
	CSS but the data overflow needs visually flagged so 
	as not to be missed.
	CSS restricts height by 'rows' e.g. 'rows-10','rows-5'
	*/
	
	const css = {
		flag: 'restrict-data-shown-flag'
	};
	
	const dataAttrName = uiApp.getDataAttributeName();
	const store = []; // store instances
	
	/**
	* @class 
	* @param {DOMElement} flag
	* @param {DOMElement} content
	* @param {number} endPos
	* @private
	*/
	function Flag(flag, content, endPos){
		this.hasScrolled = false; // aware of scrolled data?
		this.flag = flag;
		this.content = content;
		this.scrollEndPos = endPos;
		this.content.addEventListener("scroll",() => this.scroll(), {once:true});
	}

	/**
	* User scrolls (they're aware of the extra data)
	* @param {Event} e
	*/
	Flag.prototype.scroll = function(e){
		// note! Either animation OR user scrolling will fire this!
		this.hasScrolled = true; 
		this.flag.className += " fade-out"; 
		setTimeout(() => uiApp.remove(this.flag), 400); 	// CSS fade-out animation lasts 0.2s
	};

	/**
	* Animate the scroll down to end 
	* @method
	*/ 
	Flag.prototype.userClick = function(){
		if(this.hasScrolled) return;
		animateScroll(this.content,this.scrollEndPos); // this will fire the scroll eventListener
	};
		
	/**
	* Simple scroll animation
	* @param {DOMElement} content
	* @param {numnber} endPos of scrolling
	*/		
	const animateScroll = (content,endPos) => {
		const easeOutQuad = (t) => t * (2 - t);
		const duration = 200; // num of steps
		let step = 1;	
		let time = 0;	
		// set up the animation		
		let id = setInterval(() => {
			time = Math.min(1, (step/duration));
			content.scrollTop = Math.ceil((easeOutQuad(time) * endPos));
			step = step + 1; // increment animation
			if(time == 1) clearInterval(id); 
		}, 2);
	};	

	/**
	* 'click' callback
	* @param {Event} event
	*/
	const userClicksFlag = (event) => {
		let flag = store[event.target.getAttribute(dataAttrName)];
		flag.userClick();
	};
	
	/**
	* Initialise: setup DOM Elements
	* wrapped as it might need calling on a UI update
	*/
	const init = () => {
		let restrictedData = uiApp.nodeArray(document.querySelectorAll('.restrict-data-shown'));
		if(restrictedData.length < 1) return; // no elements! 
		
		/*
		Set up a DOM fragment for Elements	
		*/
		const fragment = document.createDocumentFragment();
		const div = document.createElement("div");
	    div.className = css.flag; 
	    fragment.appendChild(div);
	    
		/*
		Check Elements to see if do scroll
		If they do then set up the UI Flag	
		*/
		restrictedData.forEach( (elem) => {
			let content = elem.querySelector('.restrict-data-content');
			let elemHeight = elem.clientHeight; 
			let scrollHeight = content.scrollHeight; 
			
			// does it scroll?
	 		if(scrollHeight > elemHeight && content.scrollTop === 0){
				/*
				Overflow, clone the fragment and pass to Flag
				*/
				let clone = fragment.cloneNode(true);
				let elemDiv = clone.firstChild; 
				elemDiv.setAttribute(dataAttrName, store.length);
				elem.appendChild(clone);
				
		 		store.push( new Flag( 	elemDiv, 
		 								content, 
		 								scrollHeight - elemHeight) );
	 		}
		});
	};
	
	// init DOM Elements
	init();
	
	// register Events
	uiApp.userDown('.' + css.flag, userClicksFlag);
	
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sideNavSelectList');	
	
	/*
	Side Nav Select List filtering
	Used in Worklist, Messages, Trials, etc
	Anywhere you have a bunch of "lists" that need filtering. 
	*/
	
	const listFilters = uiApp.nodeArray(document.querySelectorAll('.js-list-filter'));
	if(listFilters.length == 0) return;
	
	const allLists = uiApp.nodeArray(document.querySelectorAll('.js-filter-group'));
	
	// 'All' should always be selected by default	
	let activeFilter = document.querySelector('.js-list-filter.selected'); 
	
	/**
	* update the lists shown
	* @param {string} listID 
	*/
	const updateListView = (listID) => {
		if(listID == "all"){
			allListsDisplay('block');
		} else {
			allListsDisplay('none');
			uiApp.show(document.querySelector('#'+listID), 'block');
		}
	};
	
	/**
	* Change all the list display
	* @param {string} display - 'block' or 'none'
	*/
	const allListsDisplay = (display) => {
		allLists.forEach((list) => {
			list.style.display = display; 
		});
	};	
	
	/**	
	Not using delagation here because each filter
	link in the sideNav list is an <a>, easier to 
	handle Event here as we need to preventDefault
	*/
	listFilters.forEach((filter) => {
		filter.addEventListener('click', (ev) => {
			ev.preventDefault();
			let link = ev.target;
			link.classList.add('selected');
			updateListView(link.dataset.list);
			activeFilter.classList.remove('selected');
			activeFilter = link;	
		});
	});
 		

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sidebarElementList');	
	

	/*
	Build sidebar element list in EDIT mode
	Run through Elements grab there titles and then display them	
	*/	
	// get the <UL> wrapper
	let ul = document.querySelector('.sidebar-eventlist .oe-element-list');
	if(ul === null) return;
	
	
	// pretty sure only this class is used here
	let elemTitles = document.querySelectorAll('.element-title');
	if(elemTitles.length < 1) return;
	
	// avoid reflow until necessary
	let fragment = document.createDocumentFragment();

	elemTitles.forEach( (function(title){
		let li = document.createElement('li');
		li.innerHTML = '<a href="#">'+title.textContent+'</a>';
		fragment.appendChild(li);		
	}));
	
	// add the DOM list
	ul.appendChild(fragment);
	

})(bluejay); 
(function( bj ){

	'use strict';	
	
	bj.addModule('sidebarQuicklookView');
	/*
	This handles the displaying of Quicklook/QuickView elements in the SEM Event sidebar
	Quicklook DOM is prebuilt in DOM, QuickView (lightning) is built by JS on request.		
	The event sidebar can be re-ordered and filtered, but this should not affect that.
	
	There can only be one sidebar 'quicklook' open (tooltip for sidebar element)
	and only one quickview (the big popup that shows more lightning view of Event)
	
	DOM
	ul.events -|- li.event -|
	                        |- .tooltip.quicklook (hover info for event type)
	                        |- <a> -|- .event-type
	                                |- .event-extra (for eyelat icons)
	                                |- .event-date
	                                |- .tag
	
	DOM data attributes:
	<li> -|- data-id = "0000001" // OE (this repeated on <a> child)
	      	|- data-quick = JSON that provides all the bits we need.
	
	Event sidebar only exists on SEM pages:
	*/
	if( document.querySelector('.sidebar-eventlist') === null ) return;

	/**
	* Quicklook, the little tooltip underneath <li>, in the DOM but hidden.
	*/
	const quicklook = {
		el:null, 
		show( eventType ){
			// !! relies on the current DOM structure
			this.el = eventType.parentNode.previousSibling; 
			this.el.classList.add('fade-in');
		},
		hide(){
			this.el.classList.remove('fade-in');
		}
	};

	/**
	* Quickview, big popup preview.
	* DOM struture is built dymnamically and content from JSON.
	*/
	const quickview = {
		
		id:null,
		div:null,
		locked:false,
		iCloseBtn: 'i-btn-close',
		
		// primary action (for touch)
		click( json ){
			if( json.id == this.id ){
				// Quick view is already open...
				if( this.locked ){
					this.unlock();
				} else {
					this.lock();
				}
			} else {
				// touch device (no "hover")
				this.show( json );	
				this.lock();
			}
		},
		
		// mouse/track pad UX enhancement
		over( json ){
			if( this.locked ) return; // ignore
			this.show( json );
		},
		out(){
			if( this.locked ) return; // ignore
			this.remove();
		},
		
		// click behaviour
		lock(){
			this.locked = true;
			this.div.appendChild( bj.div(`${this.iCloseBtn}`));
		},
		unlock(){
			this.locked = false;
			this.div.querySelector(`.${this.iCloseBtn}`).remove();
		},
		
		// User clicks on the close icon button
		close(){
			this.remove();
			this.locked = false;	
		},
		
		// remove DOM, and reset
		remove(){
			// this.div.classList.add('fade-out'); // CSS fade-out animation lasts 0.2s
			this.div.remove();
			this.div = null;
			this.id = null;
		},
		
		/**
		Show the QuickView content
		There should only be one QuickView open at anytime
		*/
		show( json ){
			if( this.div !== null ) this.remove();
	
			this.id = json.id;
			
			const template =  [
				'<div class="event-icon"><i class="oe-i-e large {{icon}}"></i></div>',
				'<div class="title">{{event}} - {{date}}</div>',
				'<div class="quick-view-content {{type}}"></div>'
			].join('');
			
			this.div = bj.div('oe-event-quickview fade-in');
			this.div.innerHTML = Mustache.render( template, json );
			
			this.load( json.type, json.content );

			// append div, and wait to load PHP content	
			document.body.appendChild( this.div );
		},
		
		/**
		Load the QuickView content
		*/
		load( type, content ){
			const contentDiv = this.div.querySelector('.quick-view-content');
			switch( type ){
				case 'img': 
					contentDiv.innerHTML = `<img src="${content}" />`;
				break;
				case 'pdf': 
					contentDiv.innerHTML = `<embed src="${content}#toolbar=0" width="100%" height="100%"></embed>`;
				break;
				case 'php': 
					bj.xhr( content, this.id )
						.then( xreq => {
							// check user hasn't move on whilst we were loading in
							if( this.id != xreq.token ) return; 
							contentDiv.innerHTML = xreq.html;
						})
						.catch(e => console.log('PHP failed to load',e));
				break;
				case "none":
					contentDiv.innerHTML = `<div class="not-available">${content}</div>`;
				break;
				/* case 'v3': 
					this.v3DOM( content ); // to check the old DOM is still supported by the CSS, test on an IMG
				break; */
				default: bj.log('QuickView Error - load content type unknown:' + type);
			}
		},
/*
		v3DOM( src ){
			const oldDOM = [
				'<div class="event-quickview">',
				'<div class="quickview-details">',
				'<div class="event-icon"><i class="oe-i-e large i-CiExamination"></i></div>', 
				'<div class="event-date"></div>', // not used!
				'</div>', // .quickview-details
				'<div class="quickview-screenshots">',
				'<img class="js-quickview-image" src="{{imgSrc}}">',
				'</div>', // .quickview-screenshots
				'</div>', // .event-quickviews	
			].join('');
			this.div.innerHTML = Mustache.render( oldDOM, { imgSrc: src });
		}
*/
	};
	
	/*
	Event delegation
	*/
	bj.userEnter('.event .event-type', (ev) => {	
		quicklook.show( ev.target );
		// quick view JSON is held in <li> parent
		const li = bj.getParent( ev.target, 'li.event' );
		quickview.over( JSON.parse( li.dataset.quick ));	
	});	
																				
	bj.userLeave('.event .event-type', (ev) => {
		quicklook.hide(); 
		quickview.out();	
	});

	bj.userDown(`.oe-event-quickview .${quickview.iCloseBtn}`, () => {
		quickview.close();
	});
	
	/*
	Intercept "click" on <a> if it's on the .event-type area! 	
	*/
	document.addEventListener('click',( ev ) => {
		if( ev.target.matches('.event .event-type')){
			ev.preventDefault();
			ev.stopImmediatePropagation();
			// quick view JSON is held in <li> parent
			const li = bj.getParent( ev.target, 'li.event' );
			quickview.click( JSON.parse( li.dataset.quick ));
		}
	},{ capture:true });
	
	/*
	Notes on "Click": 
	Event sidebar is a list of <a> links, historically (and semantically)
	they were simply the way to navigate through the Events. Then Quicklook popup was
	added, as a desktop (hover) enhancement, and then QuickView was added.
	After these enhancements the DOM should be changed so that <a> doesn't wrap the 
	Quicklook and QuickView DOM and only wraps the link part. This would make it much easier
	on Touch devices, but this is unlikely to be done at the moment.
	*/
	
})( bluejay ); 
(function( bj ){

	'use strict';	
	
	bj.addModule('signatureCapture');
	
	/*
	Check for "capture signature" buttons 
	*/
	if( document.querySelector('.js-idg-capture-signature') === null ) return;
	

	const captureSignature = () => {		
	
		var wrapper = document.getElementById("signature-pad");
		var canvas = wrapper.querySelector("canvas");
		var clearBtn = document.getElementById('signature-pad-clear');
		var signaturePad = new SignaturePad(canvas, {
		  // It's Necessary to use an opaque color when saving image as JPEG;
		  // this option can be omitted if only saving as PNG or SVG
		  backgroundColor: 'rgb(255, 255, 255)'
		});
		
		// On mobile devices it might make more sense to listen to orientation change,
		// rather than window resize events.
		window.onresize = resizeCanvas;
		resizeCanvas();
		
		// Adjust canvas coordinate space taking into account pixel ratio,
		// to make it look crisp on mobile devices.
		// This also causes canvas to be cleared.
		function resizeCanvas() {
		  // When zoomed out to less than 100%, for some very strange reason,
		  // some browsers report devicePixelRatio as less than 1
		  // and only part of the canvas is cleared then.
		  var ratio =  Math.max(window.devicePixelRatio || 1, 1);
		
		  // This part causes the canvas to be cleared
		  canvas.width = canvas.offsetWidth * ratio;
		  canvas.height = canvas.offsetHeight * ratio;
		  canvas.getContext("2d").scale(ratio, ratio);
		
		  // This library does not listen for canvas changes, so after the canvas is automatically
		  // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
		  // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
		  // that the state of this library is consistent with visual state of the canvas, you
		  // have to clear it manually.
		  signaturePad.clear();
		}
		
		clearBtn.addEventListener("click", (function (event) {
		  signaturePad.clear();
		}));
		
	};
	
	const loadSignaturePad = () => {
		// xhr returns a Promise... 
		bj.xhr('/idg-php/v3/_load/signature-pad.php')
			.then( xreq => {
				const div = bj.div("oe-popup-wrap");
				div.innerHTML = xreq.html;
				
				// reflow DOM
				document.body.appendChild( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-icon-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						bj.remove(div);
					}, {once:true} );
				}
				
				// init Signature Pad
				captureSignature();
				
			})
			.catch( e => console.log('signature pad: failed to load', e ));  // maybe output this to UI at somepoint, but for now...
	};
	

	/*
	Load Signature Pad library when required
	https://github.com/szimek/signature_pad
	*/
	bj.loadJS('https://cdn.jsdelivr.net/npm/signature_pad@2.3.2/dist/signature_pad.min.js', true)
	    .then( () => {
		    // loaded, ok allow user to sign...
		    bj.userDown('.js-idg-capture-signature', loadSignaturePad );
	    });
	  

})( bluejay ); 
(function( bj ){

	'use strict';	
	
	const signatureDevicePopup = () => {
		// xhr returns a Promise... 
		bj.xhr('/idg-php/v3/_load/signature-device-link.php')
			.then( xreq => {
				const div = bj.div("oe-popup-wrap");
				div.innerHTML = xreq.html;
				
				// reflow DOM
				document.body.appendChild( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-icon-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						bj.remove(div);
					}, {once:true} );
				}
				
				// init Signature Pad
				captureSignature();
				
			})
			.catch( e => console.log('signature popup: failed to load', e ));  // maybe output this to UI at somepoint, but for now...
	};
	

	bj.extend('demoSignatureDeviceLink', signatureDevicePopup);
	  

})( bluejay ); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('vcScratchPad');	
	
	const scratchPad = document.querySelector('#oe-vc-scratchpad');
	if(scratchPad === null) return;
	
	let offsetX, offsetY;
	let show = false;

	const handleStart = (e) => {
		e.dataTransfer.dropEffect = "move";
		let rect = e.target.getBoundingClientRect();
		offsetX = e.clientX - rect.left;
		offsetY = e.clientY - rect.top;
	};
	
	const handleEnd = (e) => {
		let top = Math.round(e.clientY - offsetY);
		let left = Math.round(e.clientX - offsetX);
		// stop it being dragged off screen
		top = top < 1 ? 1 : top;
		left = left < 1 ? 1 : left;
		scratchPad.style.top = top + "px";
		scratchPad.style.left = left + "px";
	};

	scratchPad.addEventListener("dragstart", handleStart, false);
	scratchPad.addEventListener("dragend", handleEnd, false);

	/*
	Demo the the scratchPad behaviour 
	*/
	const change = (ev) => {
		let btn = ev.target;
		if(show){
			uiApp.hide(scratchPad);
			btn.textContent = 'ScratchPad';
		} else {
			uiApp.show(scratchPad, 'block');
			btn.textContent = 'Hide ScratchPad';
		}
		show = !show;		
	};
	
	uiApp.userDown('#js-vc-scratchpad', change );


})(bluejay); 
/*
List Options Constructor
*/
(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );	
	
	addSelect.ListOption = function (li, parent){
		
		let _selected = li.classList.contains('selected'); // check not setup to be selected:
		let _dependents = false;
		let json = JSON.parse(li.dataset.insert);
		
		
		/*
		Does list have any dependency lists?
		*/
		if( json.dependents !== undefined ){
			// build dependents
			_dependents = new addSelect.OptionDependents(json.dependents, parent.uniqueId);
		}
	
		/*
		Methods
		*/ 
		this.click = function(){
			this.toggleState();
			parent.optionClicked( _selected, this );
	
			if(_dependents != false){
				_dependents.show( _selected );
			}	
		};
		
		this.toggleState = function() {
			li.classList.toggle('selected'); 
			_selected = !_selected;
		};	
		
		this.deselect = function(){
			if( _selected ){
				this.toggleState();
			}
		};
		
		
		Object.defineProperty(this, 'selected',{
			get: () => {
				return _selected;
			},
			set: (v) => {
				_selected = v;
				if(!v){
					li.classList.remove('selected');
				}
			}
		});
		
		Object.defineProperty(this, 'dependents',{
			get: () => {
				return _dependents === false ? false : true; 
			}
		});
		
		Object.defineProperty(this, 'value',{
			get: () => {
				return json.value; 
			}
		});
		
	
	
		/*
		Events 
		*/
		li.addEventListener( "mousedown", this.click.bind( this ) );
	};
		
})(bluejay); 
/*
Optional Lists based on List selection
find group ID: 	"add-to-{uniqueID}-listgroup{n}";
find list ID: 	"add-to-{uniqueID}-list{n}";

@param dependents: String e.g. "2.1" or "2.1,2.2": 
*/

(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );	
	
	addSelect.OptionDependents = function( dependents, listId ){

		if(dependents === undefined)  return false;
		
		/*
		List has extra list options	
		*/
		const idPrefix = "#add-to-" + listId + "-";
		let groups = [];
		
		/*
		Can be mulitple list groups.
		Check string for commas "2.1,2.2" for groups
		*/
		dependents.split(',').forEach( group => {
			
	
			let ids = group.split('.'); // could be mutliple list IDs e.g. 2.3.4.5
			let obj = {};
			// find group
			
			if(ids[0] === 0){
				console.log('Error: OptionDependents, listGroup = 0 !!',  idPrefix + 'listgroup'+ids[0]);
			}
			
			obj.div = document.querySelector(idPrefix + 'listgroup'+ids[0]); // <div> wrapper for optional lists
			if(obj.div === null){
				console.log('obj.div = null!',idPrefix + 'listgroup'+ids[0]);
			}
			
			obj.holder = obj.div.querySelector('.optional-placeholder'); // default placeholder for Optional Lists
			if(obj.holder === null){
				console.log('Adder: no placeholder text for optional group');
			}
			
	
			/*
			Does it have lists, or show default text?
			e.g. 2.0
			*/
			if( ids[1] == 0 ){
				obj.showDefaultText = true;
			} else {
				obj.showDefaultText = false;
				/*
				Not a ZERO... so:
				Loop through option lists required
				e.g. 2.4.5 (two lists in group '2')
				*/
				obj.lists = [];
				for(let i=1;i<ids.length;i++ ){
					let li = document.querySelector(idPrefix + 'list' + ids[i]);
					if(li === null){
						console.log('Err: OptionDependents, list? ', idPrefix + 'list' + ids[i]);	
					} else {
						obj.lists.push(li);
					}
					
				}
			}
			
			groups.push(obj);
		});
	
		/*
		Methods
		*/
		this.show = function( show ){
			if(show){
				/*
				hide ALL optional lists
				$('#add-to-'+listId+' .optional-list').hide();
				*/
				this.myLists();
			} else {
				// unclick
				this.reset();
			}
		};
	
		this.hideAllOptionalLists = function(div){
			let optionalLists = uiApp.nodeArray(div.querySelectorAll('.optional-list'));
			optionalLists.forEach((list) => {
				uiApp.hide(list);
			});
			
		};
	
		this.myLists = function(){
			groups.forEach( group => {
				/*
				in group hide other lists
				*/
				this.hideAllOptionalLists(group.div);
				
				if(group.showDefaultText){
					if(group.holder) uiApp.show(group.holder, 'block');
				} else {
					if(group.holder) uiApp.hide(group.holder);
					// show required Lists
					group.lists.forEach( list => {
						uiApp.show(list, 'block');
					});
				}
				
			});
		};
		
		/*
		Reset (these!) groups!	
		*/
		this.reset = function(){
			groups.forEach( group => {
				this.hideAllOptionalLists(group.div);
				if(group.holder) uiApp.show(group.holder, 'block');
			});
		};
			
	};
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );
	
	addSelect.OptionsList = function(ul){
		
		let json = JSON.parse(ul.dataset.options);
		
		/*
		Types: Single & Multi are the main ones but 
		added in "inputTemplate" to handle the 
		list of options to fill the input field
		*/
		const template = json.type == 'inputTemplate' ? true : false;
		const single = json.type == 'single' ? true : false ;				
		// some assumptions here... 
		const hasOptions = json.hasExtraOptions === "true" ? true : false;
		const isOptionalList = json.isOptionalList === "true" ? true : false;
		
		this.uniqueId  = ul.dataset.id; // passes in DOM id (unique part) 
		
		/*
		Optional List? 
		Needs hiding. The List Option it depends on will show
		it when it's clicked	
		*/
		if(isOptionalList) {
			uiApp.hide(ul.parentNode);
		}
		 
		/*
		Store all List Options	
		*/
		let me = this; // hmmm... this could be better.
		let options = [];
		let defaultSelected = [];
		
		const listElems = uiApp.nodeArray(ul.querySelectorAll('li'));
		listElems.forEach((li) => {
			let liOpt = new addSelect.ListOption(li, this);
			options.push(liOpt);
			/*
			If liOpt is selected AND has dependents
			Need to activate the list AFTER all the other DOM
			is set up
			*/
			if( liOpt.selected && liOpt.dependents){
				/*
				Store and then loop through after
				others are all done to set up default
				selected states 
				*/
				defaultSelected.push(liOpt);
			}
		});
		
		/*
		Methods	
		*/
		this.optionClicked = function( selected, listOption ){
		
			if(template){
				// Assume that we have an input field available.
				let input = ul.previousElementSibling;
				let template = listOption.value;
				let selectStart = template.indexOf('{');
				let selectEnd = template.indexOf('}') + 1;
				input.value = template;
				listOption.deselect();
				// let the events play out
				setTimeout(() => {
					input.focus();
					input.select();
					input.setSelectionRange(selectStart, selectEnd);
				}, 50);
				return;
			}
			
			
			/*
			Manage this list. 
			Multi-select is the default	
			*/
			if(selected){
				if(single){
					options.forEach( option => {
						if(option !== listOption) option.deselect();
					});
				}
			} 
		};
		
		
		this.checkForDefaultSelections = () => {
			if( defaultSelected.length ){
				/*
				This all need 'clicking' to activate
				the dependent optional lists	
				*/
				defaultSelected.forEach( d => {
					/*
					To make the click work correctly 
					de-select the list btn, click will
					re-select it and activate the dependents 
					*/
					d.selected = false;
					d.click();
				});
			}
		};			
	};
		
})(bluejay); 

(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );
	
	addSelect.Popup = function( greenBtn ){	
		
		let popup = document.querySelector('#' + greenBtn.dataset.popup);
		
		if( popup == null ) return;
		
		let lists = [];
		const reset = true;
		const require = false; 
	
		/*
		Using in analytics to build the data filters. Popup
		needs to anchor to the left. Can not rely to x < n to do this.
		*/
		this.anchorLeft = popup.dataset.anchorLeft ? true : false;
	
		/*
		Props
		*/ 
		this.btn = greenBtn;  
		this.popup = popup;
		this.closeBtn = popup.querySelector('.close-icon-btn');
	
		/*
		Methods
		*/
		this.open = function(){
			this.position();
			addSelect.closeAll();
			uiApp.show(popup, 'block');
			
			this.closeBtn.addEventListener('mousedown', this.close.bind(this));
			//window.addEventListener('scroll', this.close.bind(this), {capture:true, once:true});
		};
		
		this.close = function(){
			popup.style.display = "none";	
		};
		
		this.reset = function(){
			// reset (to default state)
		};
		
		let addOptions = uiApp.nodeArray(popup.querySelectorAll('.add-options'));
		addOptions.forEach((option) => {
			let list = new addSelect.OptionsList(option);
			list.checkForDefaultSelections();
			lists.push(list);
		});
		
		//idg.addSelectInsert.btnEvent( this, $popup.children('.close-icon-btn'), this.close );
		this.btn.addEventListener('mousedown', this.open.bind(this) );		
	};
	
	
	addSelect.Popup.prototype.position = function(){
		let rect = this.btn.getBoundingClientRect();	
		let w = window.innerWidth; // hmmm, this could be better as forces reflow
		let h = window.innerHeight;
		let posH = (h - rect.bottom);
		
		// check popup doesn't go off the top of the screen 
		// and don't overlay Logo! or Patient Name
		if(h - posH < 325){
			posH = h - 325;
		}
		
		/*
		Popup can be 'requested' to anchor left.
		Only used in Analytics (so far)	
		*/
		if( this.anchorLeft ){
			this.popup.style.left = rect.left + 'px';
		} else {
			// is popup pushing off the left
			let leftSideEdge = rect.right - this.popup.getBoundingClientRect().width;
			let adjustRight =  leftSideEdge < 0 ? leftSideEdge - 25 : 0;
			this.popup.style.right = (w - rect.right) + adjustRight + 'px' ;
		}
		
		this.popup.style.bottom = posH + 'px';

	};
	
		
})(bluejay); 

(function( bj, clinic, gui ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	// Check we are on IDG Clinic Manager page... I expect a certain DOM
	const oeClinic = document.getElementById('js-clinic-manager');
	if( oeClinic === null ) return;
	
	/**
	* @callback
	* Init the Clinic Manager SPA - called by loading timeout.
	*/
	const init = () => {
		bj.log('[Clinic] - intialising');
		
		/**
		A&E was set up as a single list
		but need to test with multiple worklists
		*/
		const worklists = new Map(); 
		const filters = clinic.filters(); 
		const adder = clinic.adder();
		
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_filter: "", // clinic filter state
			delayID: null,
			
			get filter(){
				return this._filter;
			},
			set filter( val ){
				this._filter = val; 
				this.renderLists();
				filters.selected( model.filter );	
			},
			
			/**
			* Updating clinic, the issue here is if the view is filtered
			* and the user changes a state of patient in view it will instantly 
			* vanish if it doesn't match the current filter... this stops that happening.
			* 1. Delay the view filters updates (allow the user to see what happened)
			* 2. Only update if Users are not working on things
			*/
			updateView(){
				if( this.delayID ) clearTimeout( this.delayID );
				this.delayID = setTimeout(() => {
					if( document.querySelector('.oe-pathstep-popup') == null && 
						adder.isOpen() == false ){
						// render lists...							
						this.renderLists();	
					}
					this.delayID = null;
				}, 1750 );
			}, 
			
			renderLists(){
				worklists.forEach( list => list.render( this._filter ));
			}
			
		}, bj.ModelViews());
		
		/**
		* Update Filters btn count
		* Whenever a patient changes status the count needs updating
		*/
		const updateFilterBtns = () => {
			// gather all the patient data and pass to filterBtns
			let status = [];
			let redflagged = [];
			worklists.forEach( list => {
				const patientFilters = list.getPatientFilterState();
				status = status.concat( patientFilters.status );
				redflagged = redflagged.concat( patientFilters.redflagged );
			});
			
			filters.updateCount( status, redflagged );
			model.updateView();
		};
	
		/**
		* @Event
		* Select or deselect all Patients; checkbox in <thead> (UI is '+' icons)
		*/
		oeClinic.addEventListener('change', ev => {
			const input = ev.target;
			if( input.matches('.js-check-patient') &&
				input.checked ){
				
				adder.show();
			}
		}, { useCapture:true });
		
		/**
		* @Events
		* Filter button (in header bar) 
		*/
		bj.userDown('.js-idg-clinic-btn-filter', ( ev ) => {
			gui.pathStepPopup.remove(); // if there is a popup open remove it
			worklists.forEach( list => list.untickPatients());
			model.filter = ev.target.dataset.filter;
		});
		
		/*
		*  @Events for Adder 
		* - User clicks on a step to add it to patients
		* - (Or closes the adder)
		*/
		bj.userDown('div.oec-adder .insert-steps li', ( ev ) => {
			worklists.forEach( list => list.addStepsToPatients( ev.target.dataset.idg ));
		});
		
		bj.userDown('div.oec-adder .close-btn', () => {
			worklists.forEach( list => list.untickPatients());
			adder.hide(); 
		});
		
		/**
		* @Events for Patient 
		* Button: "Arrived"
		* Button "DNA"
		* Button "Complete" 
		*/
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			worklists.forEach( list => list.patientArrived( ev.target.dataset.patient ));
		});
		
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			worklists.forEach( list => list.patientDNA( ev.target.dataset.patient ));
		});
		
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			worklists.forEach( list => list.patientComplete( ev.target.dataset.patient ));
		});

		// Patient changes it status
		document.addEventListener('onClinicPatientStatusChange', ( ev ) => updateFilterBtns());
		
		/**
		* Initialise App
		*	
		* Build the Worklists
		* iDG demo can handle multple Worklits (or "Clinics")
		* PHP builds the JS array of the different Worklists.	
		* loop through the Global and build the demo Worklists
		*/
		const fragment = new DocumentFragment();
		
		// Global!
		iDG_ClinicListDemo.forEach( list => {
			// add new Worklist
			const uid = bj.getToken();
			// Add new list and initalise the worklist DOM
			worklists.set( uid, clinic.addList( list, uid, fragment ));
		});
		
		oeClinic.append( fragment );
		
		// default clinic filter
		model.filter = "clinic"; 
		
		// update filter buttons count
		updateFilterBtns();
		
		// OK, ready to run this app, lets go!
		loading.remove();
	};
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => init(), 500 ); // ... now initate! ;) 
	
	
})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 

(function( bj, clinic ){

	'use strict';	
	
	const adder = () => {
		
		const div = bj.div('oec-adder');
		let open = false;
		
		/**
		* Hide
		* removing "fadein" effectively equals: display:none
		*/
		const hide = () => {
			open = false;
			div.classList.remove('fadein');
		};
		
		/**
		* Show.
		* Every time a checkbox box is checked it will try
		* and show the adder.
		*/
		const show = () => {
			if( open ) return; else open = true;
			div.classList.remove('fadein');
			div.classList.add('fadein'); // CSS animation 
		};
		
		/**
		* App needs to know this
		*/
		const isOpen = () => open;

		/**
		* Init 
		* build all the steps that can be added
		* patients shown depend on filters	
		*/
		(() => {
			/*
			* Insert steps options are static, build once
			*
			* Each shortcode has a full title shown in the popup.
			* In iDG that is in the PHP, however we also have to show 
			* it here where the user has to select a step.
			*/
			const full = new Map();	
			full.set('i-Stop', ['Auto-complete after last completed step', 'buff']);
			
			full.set('Mr MM', ['Mr Michael Morgan', 'todo', 'person']);
			full.set('Dr GJB', ['Dr Georg Joseph Beer', 'todo', 'person']);
			full.set('Dr GP', ['Dr George Bartischy', 'todo', 'person']);
			full.set('Su', ['Sushruta', 'todo', 'person']);
			full.set('Dr ZF', ['Dr Zofia Falkowska', 'todo', 'person']); 
			full.set('Nurse', ['Nurse', 'todo', 'person']);
			
			full.set('Dilate', ['Dilate', 'todo', 'process']);
			full.set('Colour', ['Colour', 'todo', 'process']);
			full.set('Img', ['Imaging', 'todo', 'process']);
			full.set('VisAcu', ['Visual Acuity', 'todo', 'process']);
			full.set('Orth', ['Orthoptics', 'todo', 'process']);
			full.set('Fields', ['Visual Fields', 'config', 'process']);
			full.set('Ref', ['Refraction', 'todo', 'process']);
			
			full.set('PSD', ['Patient Specific Directive', 'todo', 'process']);
			full.set('PGD', ['Patient Group Directive', 'todo', 'process']);
			
			full.set('c-last', ['Remove last pathway step']);
				
			/*
			* Element for all inserts
			* only need to build this once
			*/
			const inserts = bj.div('insert-steps');
			
			// helper build <li>
			const _li = ( code, type, html ) => {
				
				return li;
			};
			
			const buildGroup = ( title, list ) => {
				const group = bj.dom('div','row', `<h4>${title}</h4>`);
				const ul = bj.dom('ul', 'btn-list');
				
				list.forEach( code => {
					// code is the key.
					const step = full.get( code );
					const li = document.createElement('li');
					li.innerHTML = `${step[0]}`;
					li.setAttribute('data-idg', JSON.stringify({
						c: code,    // shortcode
						s: step[1], // status
						t: step[2], // type
						i: step[3] == undefined ? 0 : step[3] // optional idgPHPcode
					}));
					
					// Special remove button:
					if( code == "c-last") li.className = "red";
					
					ul.append( li );
				});
				
				group.append( ul );
				inserts.append( group );
			};
		
			buildGroup( 'Common', ['Colour','Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort());
			buildGroup('People', ['Mr MM', 'Dr GJB', 'Dr GP', 'Su', 'Dr ZF','Nurse'].sort());
			// remove button
			buildGroup('Remove "todo" steps from selected patient', ['c-last'], 'removeTodos' );

			// build div
			div.append( bj.div('close-btn'), inserts );
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		// API 
		return { show, hide, isOpen };	
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* Clinic clock
	* @param {Element} tbody - Each "clock" needs linking to it's own table
	*/
	const showClock = ( tbody ) => {
		const div = bj.div('oec-clock');
		bj.hide( div );
		
		// find the worklist group 
		const group = bj.getParent( tbody, '.oec-group');
		group.append( div );
		
		
		/**
		* @callback for setInvterval
		*/
		const updateClock = () => {
			const tableRows = bj.nodeArray( tbody.querySelectorAll('tr'));
			
			// check there are rows...
			if( ! tableRows.length ){
				bj.hide( div );
				return;
			} 
			
			// assume last table row as default
			let clockRow = tableRows[ tableRows.length - 1];
			
			// table TRs have a timestamp on them, use this to position clock
			const now = Date.now();
			
			// if there are later times than "now" change tr.
			tableRows.find( tr  => {
				if( tr.dataset.timestamp > now ){
					clockRow = tr;
					return true;
				}
			});
			
			// get the position:
			const top = clockRow.getBoundingClientRect().bottom;
			
			if( top < 160 ){
				bj.hide( div ); // offscreen!
			} else {
				bj.show( div );
			}
			
			// update clock time and position
			div.style.top = `${ top  }px`;
			div.textContent = bj.clock24( new Date( now ));
		};
		
		/**
		* Check and update every half second
		*/
		setTimeout(() => {
			// set top here otherwise it flickers in
			// need to allow time for the <tbody> render
			div.style.top = `${ tbody.getBoundingClientRect().bottom  }px`;
			setInterval( updateClock, 500 );
		}, 1000 );
		
	};
	
	// make component available to Clinic SPA	
	clinic.clock = showClock;
	  

})( bluejay, bluejay.namespace('clinic')); 
(function( bj ){

	'use strict';	
	
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	// demo some quick and dirty popup content 
	
	// Fields custom settinsg
	
	document.addEventListener('change', (ev) => {
		if( ev.target.matches('input[name="idg-radio-g-fields-custom"]')){
			const custom = document.querySelector('.js-idg-ps-field-custom');
			if( ev.target.value == 3 ){
				bj.show( custom );
			} else {
				bj.hide( custom );
			}
		}
	}); 


	

})( bluejay ); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filter Btn <li>
	* @param {Object} props 
	* @param {parentNode} ul - <ul>
	* @return {Element} 
	*/
	const filterBtn = ( props, ul ) => {
		
		const filter = props.filter; 
		const count = bj.div('count');
		
		const li = document.createElement('li');
		li.className = "filter-btn js-idg-clinic-btn-filter"; 
		li.setAttribute('data-filter', filter );
		
		// build btn and add to <ul> header
		(() => {
			const div = bj.div('filter');
			// red flagged filter?
			if( props.name.startsWith('-f')){
				div.innerHTML = `<div class="name"><i class="oe-i flag-red medium-icon no-click"></div>`;
			} else {
				div.innerHTML = `<div class="name">${props.name}</div>`;
			}

			div.append( count );	
			li.append( div );
			ul.append( li );
		})();
		
		/**
		* updateCount
		* On any updates to clinic need to update the filter count
		* @param {Array} status - Patient row status
		* @param {Array} redflagged - 
		*/	
		const updateCount = ( status, redflagged  ) => {
			let num = 0;
	
			// work out the counts per filter.
			if( filter == "all"){
				num = status.length;
			} else if ( filter == "clinic"){
				num = status.reduce(( acc, val ) => (val != "done" && val != 'later') ? acc + 1 : acc, 0 );
			} else if( filter.startsWith('-f')) {
				num = redflagged.reduce(( acc, val ) => val ? acc + 1 : acc, 0 );
			} else {
				num = status.reduce(( acc, val ) => val == filter ? acc + 1 : acc, 0 );
			}
			
			// update DOM text
			count.textContent = num;
		};
		
		/**
		* Set selected btn
		* @param {String} clinicFilter - current filter for the clinic list
		*/
		const selected = ( clinicFilter ) => {
			if( clinicFilter === filter ){
				li.classList.add('selected');	
			} else {
				li.classList.remove('selected');
			}
		};
		
		return { updateCount, selected };	
	};
	
	// make component available to Clinic SPA	
	clinic.filterBtn = filterBtn;			
  
})( bluejay, bluejay.namespace('clinic')); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filters
	*/
	const filters = () => {

		const mode = "clinic";
		
		// Filter btns in the <header>
		const filters = new Set();
		
		/**
		Add Filter btns to <header> - these apply to all Worklists
		*/		
		const quickFilters = bj.dom('ul', "quick-filters");
		const searchFilters = bj.div('search-filters');
		const searchBtn = bj.dom('button', 'search-all');
		
		bj.hide( searchFilters );

		// Quick filter Btns - [ Name, filter ]
		[
			['All','all'],
			['Scheduled','later'], // not needed for A&E
			['In Clinic','clinic'],
			['-f','-f'], 
			//['-r2','-r2'],
			//['-r3','-r3'],
			['Active','active'],
			['Waiting','waiting'],
			['Delayed','long-wait'],
			['No path','stuck'],
			['Completed','done'],
		].forEach( btn => {
			filters.add( clinic.filterBtn({
				name: btn[0],
				filter: btn[1],
			}, quickFilters ));
		});
		
		// Advanced search complex filters (not working in iDG)
		searchFilters.innerHTML = Mustache.render( [
			`<input class="search" type="text" placeholder="Patient name or number">`,	
			`<div class="group"><select>{{#age}}<option>{{.}}</option>{{/age}}</select></div>`,
			`<div class="group"><select>{{#wait}}<option>{{.}}</option>{{/wait}}</select></div>`,
			`<div class="group"><select>{{#step}}<option>{{.}}</option>{{/step}}</select></div>`,
			`<div class="group"><select>{{#assigned}}<option>{{.}}</option>{{/assigned}}</select></div>`,
			`<div class="group"><select>{{#flags}}<option>{{.}}</option>{{/flags}}</select></div>`,
			`<div class="group"><select>{{#risks}}<option>{{.}}</option>{{/risks}}</select></div>`,
			`<div class="group"><select>{{#states}}<option>{{.}}</option>{{/states}}</select></div>`,
		].join(''), {
			age: ['All ages', '0 - 16y Paeds', '16y+ Adults'],
			wait: ['Wait', '0 - 1hr', '2hr - 3hr', '3hr - 4rh', '4hr +'],
			step: ['Location', 'Visual acuity', 'Fields', 'Colour photos', 'OCT', 'Dilate'],
			assigned: ['People', 'Unassigned', 'Nurse', 'Dr', 'Dr Georg Joseph Beer', 'Dr George Bartischy', 'Mr Michael Morgan', 'Sushruta', 'Dr Zofia Falkowska'],
			flags: ['Flagged', 'Change in puplis', 'Systemically unwell', 'etc..', 'Not flagged'],
			risks: ['Risks/Priortiy', 'High/Immediate', 'Medium/Urgent', 'Low/Standard' ],
			states: ['in Clinic', 'Scheduled', 'All'],
		});
		
		document.getElementById('js-clinic-filters').append( quickFilters, searchFilters, searchBtn );
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
		bj.userDown('button.search-all', ( ev ) => {
			const btn = ev.target;
			const quick = document.querySelector('.clinic-filters ul.quick-filters');
			
			if( btn.classList.contains('close')){
				btn.classList.remove('close');
				bj.hide( searchFilters );
				bj.show( quickFilters );
			} else {
				btn.classList.add('close');
				bj.hide( quickFilters );
				bj.show( searchFilters );
			}
		});
		
		/**
		* @method
		* Everytime a patient changes state or the view filter mode
		* is updated we need to update all the filter btns.
		* @param {Array} status 
		* @param {Array} risks 
		*/
		const updateCount = ( ...args ) => {
			filters.forEach( btn => btn.updateCount( ...args ));
		};
		
		const selected = ( filter ) => {
			filters.forEach( btn => btn.selected( filter ));
		};
		
		return { updateCount, selected };	
	};
	
	// make component available to Clinic SPA	
	clinic.filters = filters;			
  
})( bluejay, bluejay.namespace('clinic')); 
(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient Pathway
	* @param {Element} parentNode - <td> 
	*/
	const pathway = ( parentNode ) => {
		
		// div for steps and append to the parentnode
		const div = bj.div('pathway');
		parentNode.append( div );
		
		/**
		* Virtual pathway
		* Using the array to re-order the pathway
		*/ 
		const pathSteps = [];
		
		/**
		* Autostop is a unique step, must always be last in the pathway
		*/
		let autoStop = null;
		
		/**
		* Helpers.
		*/
		
		// First?
		const findFirstIndex = ( a, b = false ) => pathSteps.findIndex( ps => ps.getStatus() == a || ps.getStatus() == b );
		
		// Last?
		const findLastIndex = ( status, index = -1 ) => {
			pathSteps.forEach(( ps, i ) => {
				if( ps.getStatus() == status ) index = i;
			});
			return index;
		};
		
		// Swap positions
		const swapSteps = ( a, b ) => {
			pathSteps[ a ] = pathSteps.splice( b, 1, pathSteps[ a ])[0];
		};
		
		/**
		* Render pathway
		* if auto-finish (autoStop) push to last
		*/
		const renderPathway = () => {
			pathSteps.forEach( ps => div.append( ps.render()));
			if( autoStop ) div.append( autoStop.render());
		};
		
		/**
		* Set pathway status on div
		* @param {String} status - not used, but maybe useful for CSS hook.
		*/
		const setStatus = ( status ) => div.className = `pathway ${status}`;
		
		/**
		* Work out patient status from the pathway steps
		* @returns {String} 
		*/
		const getStatus = () => {
			// work through the Rules
			const lastCode = pathSteps[ pathSteps.length - 1 ].getCode();
			
			if( lastCode == 'i-Fin' ){
				return 'done';
			}
			
			if( lastCode == "i-Wait" || lastCode == "Waiting" ){
				return "stuck";
			}
		
			if( pathSteps.findIndex( ps => ps.getCode() == "Waiting") > 0){
				return "long-wait";
			}
			
			if( findFirstIndex('active') > 0){
				return "active";
			} else {
				return 'waiting';
			}	
		};
		
		/**
		* Add step to the pathway. 
		* Based on the step code adjust position in the pathway
		* @param {PathStep} newStep
		*/	
		const addStep = ( newStep ) => {
			switch( newStep.getCode()){
				case 'i-Arr':
					pathSteps.splice(0, 0, newStep );
				break;
				case 'i-Wait':
					/* 
					if a pathway is build before a patient arrives
					when they arrive a "i-Wait" is automatically added as well.
					Ensure that the "wait" step is added before "todo" steps.
					*/
					const todoIndex = findFirstIndex('todo', 'config');
					
					if( todoIndex === -1 ){
						pathSteps.push( newStep ); // No other steps with "todo" yet added to the pathway
					} else {
						pathSteps.splice( todoIndex, 0, newStep ); // Position in pathway and add to array
					}
				break;
				case 'i-Stop': 
					autoStop = newStep; // Automatic stop must alway be last.
				break;
				default:
					pathSteps.push( newStep );
			}
			
			renderPathway();
		};
		
		/**
		* Remove the last "todo", or "config" 
		* @param {String} code - 'c-last' (c-all not using)
		*/
		const removeStep = ( code ) => {
			if( !pathSteps.length ) return;
 			
			if( code == 'c-last' ){
				const last = pathSteps[ pathSteps.length - 1 ];
				const status = last.getStatus();
				
				// check ok to remove
				if( status == "todo" ||  
					status == "config"){
						
					last.remove();
					pathSteps.splice( -1, 1 );
				}
			}
		};
		
		/**
		* User has removed a step directly update the pathway array
		* Patient gets a callback from PathStep on any change.
		* Find the PathStep and remove it from the Virtual pathway
		* @param {String} key - unique key
		*/
		const deleteRemovedStep = ( key ) => {
			pathSteps.forEach(( ps, index ) => {
				if( ps.key == key ){
					pathSteps.splice( index, 1 );
				}
			});
		};
		
		/**
		* User has activated a step (callback again in patient)
		* Remove the waiting step
		* Check activate step position and shift left if needed
		* Render pathway
		*/
		const stopWaiting = () => {
			// find the Waiting step
			let waitingIndex = false;
			pathSteps.forEach(( ps, index ) => {
				const code = ps.getCode();
				if( code == 'i-Wait' || code == "Waiting"){
					ps.remove();
					waitingIndex = index;
				}
			});
			
			// and if found remove it from array
			if( waitingIndex ) pathSteps.splice( waitingIndex, 1 );
			
			// activate step needs moving to the left of all "todo" steps
			const todoIndex = findFirstIndex('todo', 'config');
			const activeIndex = findLastIndex('active');
	
			if( activeIndex > todoIndex ){
				// swap positions and re-render
				swapSteps( activeIndex, todoIndex );
				renderPathway();
			}
		};
		
		/**
		* User/or auto completed
		* Clean up the pathway	
		*/
		const completed = () => {
			// pathStep array is modified by splice so go through it backwards!
			const len = pathSteps.length-1;
			for ( let i=len; i >= 0; i-- ){
				const ps = pathSteps[ i ];
				const code = ps.getCode();
				const status = ps.getStatus();
				
				if( code == "i-Wait" ||
					code == "Waiting" ||
					status == "todo" ||
					status == "config" ){
					ps.remove();
					pathSteps.splice( i, 1 );	
				}
			}
		};
		
		
		/**
		* User has completed a PathStep.
		* Patient requests to add Waiting. Pathway checks to see 
		* if this the right thing to do or not.
		* @returns {Boolean} - false means pathway
		*/
		const addWaiting = () => {
			const activeIndex = findFirstIndex('active');
			
			if( activeIndex == -1 ){
				// No other active steps in pathway
				
				const waitStep = gui.pathStep({
					shortcode: 'i-Wait',
					info: 0,
					status: 'buff',
					type: 'wait',
				}, null );
				
				// Any other todo / config steps?
				const todoIndex = findFirstIndex('todo', 'config');
				if( todoIndex == -1 ){
					// No, end of pathway, auto-finish or stuck?
					if( autoStop ){
						autoStop.remove();
						autoStop = null;
						
						return false; // pathway needs auto-completing.
						
					} else {
						pathSteps.push( waitStep );
					}
				} else {
					// Yes, other todo/config steps
					pathSteps.splice( todoIndex, 0, waitStep );
				}	
				
			} else {
				// There is another active step.
				// Re-arrange any completed stesp
				const lastCompleted = findLastIndex('done');
				if( lastCompleted > activeIndex ){
					// swap positions and re-render
					swapSteps( activeIndex, lastCompleted );
				}
			}
			// update DOM
			renderPathway();
			return true;
		};
		
		/**
		* API
		*/
		return {
			setStatus,
			getStatus,
			addStep,
			removeStep,
			deleteRemovedStep,
			stopWaiting,
			addWaiting, 
			completed
		};
			
	};
	
	// make component available to Clinic SPA	
	clinic.pathway = pathway;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 
(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @param {Boolean} usesPriority - Risk icon is triangle / Priority is circle
	* @returns {*} public methods
	*/
	const patient = ( props, usesPriority = false ) => {
		
		/**
		* Patient UI is a table row <tr>
		* Hold DOM elements for easy usage
		*/
		const tr = document.createElement('tr');
		const td = {
			path: document.createElement('td'),
			addIcon: document.createElement('td'),
			risks: document.createElement('td'),
			notes: document.createElement('td'),
			complete: document.createElement('td'),
		};
		
		/**
		* Pathway 
		*/
		const pathway = clinic.pathway( td.path );
		
		/** 
		* WaitDuration widget
		*/
		const waitDuration = clinic.waitDuration( props.uid );
		
		/**
		* input[type=checkbox] ( UI is "+" icon)
		*/
		const tick = bj.dom('input', 'js-check-patient');
		tick.setAttribute('type', 'checkbox');
		

		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			uid: props.uid,
			isRendered: false,
			_status: null, // "todo", "active", "complete", etc!
			risk: null, // "-r1", "-r3", "-r3" etc 
			redFlagged: false,
			
			get status(){
				return this._status;
			},
			set status( val ){
				// 'fake-done', allows iDG to set up a completed pathway
				// it's changed back to "done" when "i-Fin" is pathstep is added
				const validStatus = ['fake-done', 'done', 'waiting', 'long-wait', 'active', 'stuck', 'later'].find( test => test == val );
				if( !validStatus ) throw new Error(`Clinic: invaild Patient status: "${val}"`);
				
				this._status = val; 
				this.views.notify();
				bj.customEvent('onClinicPatientStatusChange', model.status ); // App is listening!
			}
		}, bj.ModelViews());
		
		/**
		* VIEW: Status change
		* if patient is "complete" hide the specific + icon
		*/
		const onChangeStatus = () => {
			tr.className = model.status;
			pathway.setStatus( model.status );
			waitDuration.render( model.status );
			
			if( model.status == "done" ){
				td.addIcon.innerHTML = "<!-- completed pathway -->";
			}
			
		};
		
		model.views.add( onChangeStatus );
		
		/**
		* VIEW: Pathway Completed
		* complete (tick icon) / done?
		*/
		const onChangeComplete = () => {
			const completeHTML = model.status == "done" ?
				'<small class="fade">Done</small>' :
				`<i class="oe-i save medium-icon pad js-has-tooltip js-idg-clinic-icon-complete" data-tt-type="basic" data-tooltip-content="Patient pathway finished" data-patient="${model.uid}"></i>`;

			// update DOM
			td.complete.innerHTML = model.status == "later" ?  "" : completeHTML;					
		};
		
		model.views.add( onChangeComplete );
		
		/**
		* @callback for PathStep change
		* need to know if a pathStep changes state
		* @param {PathStep} pathStep - ps new status
		*/
		const onPathStepChange = ( pathStep ) => {
			switch( pathStep.getStatus()){
				case "active": 
					pathway.stopWaiting();
				break;
				case "done":
					/*
					Add a waiting step, however if pathway 
					hits an 'auto-finish', it returns False.
					*/
					if( pathway.addWaiting() == false ){
						onComplete( true ); // auto-finish!
					}
				break;
				case "userRemoved":
					pathway.deleteRemovedStep( pathStep.key ); // User deleted through PathStepPopup
				break;
			}
			
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
			
		
		/**
		* @method
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			if( model.status == "done") return; // not active
			
			if( step.shortcode == 'i-RedFlag'){
				model.redFlagged = true;
			}
			
			/*
			From adder user can add "todo" or "config" or "auto-finish" steps. 
			Pathway state could be: "waiting", "long-wait", "stuck" or "active" 
			*/
			if( step.shortcode == 'i-Arr' ) waitDuration.arrived( step.timestamp );
			if( step.shortcode == 'i-Fin' ){
				waitDuration.finished( step.timestamp );
				pathway.completed();
			}
			
			// if it's a wait it's counting the mins
			if( step.shortcode == 'i-Wait' || 
				step.shortcode == 'Waiting' ){
				step.info = step.mins;	
			} else {
				step.info = bj.clock24( new Date ( step.timestamp ));
			}
			// add step to pathway, along with the callback
			pathway.addStep( gui.pathStep( step, null, onPathStepChange ));
			
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		/**
		* @method
		* Remove last PathStep from pathway 
		* @param {Object} step
		*/
		const removePathStep = ( code ) => {
			pathway.removeStep( code ); 
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		
		/**
		* Set Priority (A&E has priority)
		* uses "circle" icons
		* @param {Number} num - level
		*/
		const setRisk = ( num ) => {
			if( num == undefined ) return; 
			
			const icon = usesPriority ? 'circle' : 'triangle';
			const size = usesPriority ? 'medium-icon' : '';
			const color = ['grey','red','amber','green'][ num ];
			
			let tip = "{{tip}}";
			switch( num ){
				case 3: tip = usesPriority ? 'Priority: Standard' : 'Patient Risk: 2 (Low)'; break;
				case 2: tip = usesPriority ? 'Priority: Urgent' : 'Patient Risk: 2 (Medium)'; break;
				case 1: tip = usesPriority ? 'Priority: Immediate' : 'Patient Risk: 1 (High)'; break;
			}
			
			td.risks.innerHTML = `<i class="oe-i ${icon}-${color} ${size} js-has-tooltip" data-tt-type="basic" data-tooltip-content="${tip}"></i>`;
			model.risk = num;
		};

		
		/**
		* Initiate inital patient state from JSON	
		* and build the <tr> DOM
		*/
		(() => {
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));
			
			// Add patient select checkbox ("tick")
			// CSS styles this to look like a "+" icon
			// build node tree
			tick.setAttribute('value', `${model.uid}`);
			
			const label = bj.dom('label', 'patient-checkbox');
			const checkboxBtn = bj.div('checkbox-btn');
			label.append( tick, checkboxBtn );
			td.addIcon.append( label );
			
			// set Flag (if there is one)
			setRisk( props.risk );
			
			// notes
			const psOwner = gui.pathStep({
				shortcode: 'i-Comments',
				status: 'buff',
				type: props.notes ? 'comments added' : 'comments',
				info: props.notes ? 'clock' : '&nbsp;', 
				idgPopupCode: props.notes ? false : 'i-comments-none'
			}, false );
			
			td.notes.append( psOwner.render());
			
			// Set patient status this will trigger VIEW notifications (an iDG hack!)
			model.status = props.status == 'fake-done' ? 'done' : props.status; 
		
			// build <tr>
			tr.setAttribute( 'data-timestamp', props.bookedTimestamp );
			tr.insertAdjacentHTML('beforeend', `<td>${props.time}</td>`);
			tr.insertAdjacentHTML('beforeend', `<td><div class="list-name">${props.clinic[0]}</div><div class="code">${props.clinic[1]}</div></td>`);
			
			// slightly more complex Elements and dynamic areas...
			tr.append( clinic.patientMeta( props ));
			tr.append( clinic.patientQuickView( props ));
			tr.append( td.path );
			tr.append( td.addIcon );
			tr.append( td.risks );
			tr.append( td.notes );	
			tr.append( waitDuration.render( model.status )); // returns a <td>
			tr.append( td.complete );	
			
		})();
		
		
		/**
		* @methods
		* Update Pathway with appropriate steps
		* {shortcode, status, type, info = (timestamp or mins), idgPopupCode}
		*/
		const onArrived = () => {
			addPathStep({
				shortcode: 'i-Arr',
				status: 'buff',
				type: 'arrive',
				timestamp: Date.now(),
				idgPopupCode: 'arrive-basic',
			});
			addPathStep({
				shortcode: 'i-Wait',
				status: 'buff',
				type: 'wait',
				mins: 0,
			});
		};
		
		const onDNA = () => {
			addPathStep({
				shortcode: 'DNA',
				status: 'done',
				type: 'DNA',
				timestamp: Date.now(),
			});
		};
		
		const onComplete = ( autostop = false ) => {
			if( model.status == "active" && !autostop) return;
			
			addPathStep({
				shortcode: 'i-Fin',
				status: 'buff',
				type: 'finish',
				timestamp: Date.now(),
			});
		};
		
		/**
		* @method 
		* Users can select all or none of currently viewed patients
		* @param {Boolean} b 
		*/
		const setTicked = ( b ) => {
			if( model.status == "done") return;
			if( !model.isRendered && b ) return;
			tick.checked = b;	
		}; 
		
		/**
		* @returns {Boolean} - checkbox state
		*/
		const isTicked = () => tick.checked;
		
		/**
		* @method
		* Render Patient <tr> if it matches filter
		* @params {String} filter - header filter buttons set this
		* @returns {Element} (if covered by filter option)	
		*/
		const render = ( filter ) => {
			let renderDOM = false;
	
			if( filter == "all" ){
				renderDOM = true;
			} else if( filter == "clinic") {
				renderDOM = !( model.status == 'done' || model.status == 'later');
			} else {
				// red flagged? 
				if( filter.startsWith('-f')){
					renderDOM = model.redFlagged;
				} else {
					renderDOM = ( model.status == filter );
				}
			}
			
			model.isRendered = renderDOM;
			return renderDOM ? tr : null;
		};	
			
		/* API */
		return { 
			onArrived, 
			onDNA, 
			onComplete, 
			getID(){ return model.uid; }, 
			getStatus(){ return model.status; },
			//getRisk(){ return model.risk; },
			getRedFlagged(){ return model.redFlagged; },
			render, 
			addPathStep, 
			removePathStep,
			setTicked,
			isTicked 
		};
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* @helper
	* As times are relative to 'now', this helper will round to 5min intervals. 
	* @returns {Timestamp} 
	*/
	const everyFiveMins = ( booked ) => {
		let appointment = new Date( Date.now() + ( booked * 60000 )); 
		let offset = appointment.getMinutes() % 5; 
		appointment.setMinutes( appointment.getMinutes() - offset );
		
		// rounded to 5mins
		return appointment.getTime();
	};	
	
	/**
	* Process the patient JSON from the PHP
	* @param {JSON} json
	* @param {Boolean} usesPriority - risks use triangles, priorities uses circles.
	* @returns {Map} of patients
	*/
	clinic.patientJSON = ( json, usesPriority = false ) => {
		/*
		To make the IDG UX prototype easier to test an initial state JSON is provided by PHP.
		The demo times are set in RELATIVE minutes, which are updated to full timestamps
		*/
		const patientsJSON = JSON.parse( json );
		
		patientsJSON.forEach(( patient ) => {
			
			// Unique ID for each patient
			patient.uid = bj.getToken(); 
			
			const booked = Date.now() + ( patient.booked * 60000 );
			patient.bookedTimestamp = booked;
			
			// convert to booked time to human time
			patient.time = bj.clock24( new Date( booked ));
			
			/*
			Step Pathway is multi-dimensional array.
			Convert each step into an Object and add other useful info here. 
			timestamp and mins are NOT used by PathStep either of these is
			used for the "info"
			*/		
			patient.pathway.forEach(( step, i, thisArr ) => {
				const obj = {
					shortcode: step[0],
					timestamp: Date.now() + ( step[1] * 60000 ), 
					mins: step[1],
					status: step[2],
					type: step[3],
				};
				
				if( step[4] ) obj.idgPopupCode = step[4]; // demo iDG popup content
								
				// update the nested step array to an Object
				thisArr[i] = obj;
			});
		});
		
		/**
		After processing the JSON
		Set up patients
		*/
		const patients = new Map();
		
		patientsJSON.forEach( patient => {
			patients.set( patient.uid, clinic.patient( patient, usesPriority ));
		});
		
		return patients;
	};


})( bluejay, bluejay.namespace('clinic')); 
(function( bj, clinic ){

	'use strict';	

	/**
	* Patient Meta DOM
	* @param {Object} props 
	* @return {DocumentFragment} 
	*/
	const patientMeta = ( props ) => {
		/*
		DOM
		div.oe-patient-meta -|- div.patient-name -|- a -|- span.patient-surname
		                     |                          |- span.patient-firstname	
		                     |
		                     |- div.patient-details -|- div.nhs-number
		                                             |- div.patient-gender
		                                             |- div.patient-age 
		*/
		const template = [
			'<div class="oe-patient-meta">',
				
				'<div class="patient-name">',
					'<a href="/v3-SEM/patient-overview">',
						'<span class="patient-surname">{{lastname}}</span>, ',
						'<span class="patient-firstname">{{{firstname}}}</span>',
					'</a>',
					'<div class="patient-icons">',
					'{{#duplicate}}<i class="oe-i exclamation-orange small pad js-has-tooltip" data-tt-type="basic" data-tooltip-content="Double check details. More than one {{lastname}} in clinic"></i>{{/duplicate}}',
					'</div>',
				'</div>',
				'<div class="patient-details">',
					'<div class="nhs-number"><span>NHS</span>{{nhs}}</div>',
					'<div class="gender">{{gender}}</div>',
					'<div class="patient-age"><em>dob</em> {{dob}} <span class="yrs">{{age}}</span></div>',
				'</div>',
			'</div>'
		].join('');
		
		const td = document.createElement('td');
		td.innerHTML = Mustache.render( template, props );
		
		return td;
	};
	
	// make component available to Clinic SPA	
	clinic.patientMeta = patientMeta;			
  

})( bluejay, bluejay.namespace('clinic')); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* Patient Meta DOM
	* @param {Object} props 
	* @return {Element} 
	*/
	const patientQuickView = ( props ) => {
		
		const i = document.createElement('i');
		i.className = "oe-i eye-circle medium pad js-patient-quick-overview";
		i.setAttribute('data-mode', 'side');
		i.setAttribute('data-php', 'patient/quick/overview.php');
		i.setAttribute('data-patient', JSON.stringify({
			surname: props.lastname,
			first: props.firstname,
			id: false, 
			nhs: props.nhs, 
			gender: props.gender, 
			age: props.age,
		}));
		
		const td = document.createElement('td');
		td.appendChild( i );
		
		return td;
	};
	
	// make component available to Clinic SPA	
	clinic.patientQuickView = patientQuickView;		

})( bluejay, bluejay.namespace('clinic')); 
(function( bj, clinic ){

	'use strict';	
	
	/**
	* waitDuration
	* @param {String} patientID - Patient uid
	* @returns {*} API;	
	*/
	const waitDuration = ( patientID ) => {
		
		const td = document.createElement('td');
		
		let timestamp = null;
		let mins = 0;
		let timerID = null;				
	
		/**
		* Calculate wait minutes from arrival time
		* @returns {Number} minutes
		*/
		const calcWaitMins = ( finishTime = false ) => {
			const endTime = finishTime == false ? Date.now() : finishTime;
			mins = Math.floor(( endTime - timestamp ) / 60000 );
		};
		
		/**
		* @callback from patient when the "Arrive" step is added to the pathway
		* @param {Number} arriveTime - timestamp
		*/
		const arrived = ( arriveTime ) => {	
			if( timestamp !== null ) return;
			timestamp = arriveTime;
			calcWaitMins();
			timerID = setInterval(() => {
				calcWaitMins();
				render("active");
			}, 15000 ); 				
		};
		
		/**
		* @callback from patient when the "Finished" step is added to the pathway
		* @param {Number} finishedTime - timestamp
		*/
		const finished = ( finishTime ) => {
			clearInterval( timerID );
			calcWaitMins( finishTime );
		};
					
		/**
		* SVG Circles to represent time waiting
		* @param {String} color (based on wait mins)
		* @returns {React Element}
		*/
		const svgCircles = () => {
			let color = 'green';			
			if( mins > 120 ) color = 'yellow';
			if( mins > 180 ) color = 'orange';
			if( mins > 240 ) color = 'red';
			
			const r = 6;
			const d = r * 2;
			const w = d * 4;
			
			const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
			svg.setAttribute('class', `duration-graphic ${color}`);
			svg.setAttribute('viewBox', `0 0 ${w} ${d}`);
			svg.setAttribute('height', d );
			svg.setAttribute('width', w );

			for( let i=0; i<4; i++ ){
				const cx = ((i + 1) * (r * 2)) - r;
				const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
				circle.setAttribute('class',`c${i}`);
				circle.setAttribute('cx',`${cx}`);
				circle.setAttribute('cy',`${r}`);
				circle.setAttribute('r',`${r}`);
				svg.appendChild( circle );
			}
			
			return svg;
		};	

		/**
		* Render Mins DOM
		* @returns {Element}
		*/
		const waitMins = ( active ) => {
			const div = bj.div('mins');
			// turns mins into hours 
			const hours = Math.floor( mins / 60 );
			const clockMins = (mins % 60).toString().padStart(2,'0');
			
			// const suffix = mins > 1 ? 'mins' : 'min';
			div.innerHTML = active ? 
				`<small>${hours}:${clockMins}</small>`: 
				`${hours}:${clockMins}`;
				
			return div;
		};
		
		/**
		* Render depends on status
		* @param {String} status - could be: "complete", "active", "todo"
		* @returns {Element} - appropriate element based on status
		*/
		const render = ( status ) => {
			const div = bj.div();
			
			switch( status ){
				case "done": 
					div.className = 'wait-duration';
					div.appendChild( waitMins( false ));
				break;
				case "later":
					div.className = 'flex';
					div.innerHTML = [
						`<button class="cols-7 blue hint js-idg-clinic-btn-arrived" data-patient="${patientID}">Arrived</button>`,
						`<button class="cols-4 js-idg-clinic-btn-DNA" data-patient="${patientID}">DNA</button>`
					].join('');
				break;
				default: 
					div.className = 'wait-duration';
					div.appendChild( svgCircles());
					div.appendChild( waitMins( true ));
			}
			
			bj.empty( td );
			td.append( div );
			
			return td;
		};
		
		// API
		return { arrived, finished, render };
	};
	
	// make component available	
	clinic.waitDuration = waitDuration;	
	

})( bluejay, bluejay.namespace('clinic') ); 
(function( bj, clinic ){

	'use strict';
	
	/**
	* build Group
	* @param {Element} group - parentNode;
	* @param {*} list
	* return {Element}
	*/
	const buildDOM = ( group, list ) => {
		const riskIcon = list.usesPriority ? 'circle' : 'triangle';
		
		/**
		Each Worklist requires a "group". The Group has a "header". 
		The header shows the name of the Worklist (+ date, this will be added automatically by OE)
		It also allows removing from the view (if not in single mode)
		*/
		const header = bj.dom('header', false, [
			 `<div class="favourite"><i class="oe-i starline medium pad js-has-tooltip" data-tt-type="basic" data-tooltip-content="Add to worklist favourites"></i></div>`,
			 `<h3>${ list.title }</h3>`
		].join('')); 

		const table = bj.dom('table', 'oec-patients');
		table.innerHTML = Mustache.render([
			'<thead><tr>{{#th}}<th>{{{.}}}</th>{{/th}}</tr></thead>',
			'<tbody></tbody>'
		].join(''), {
			"th": [ 
				'Time', 
				'Clinic', 
				'Patient', 
				'<!-- meta icon -->', 
				'Pathway',
				'<label class="patient-checkbox"><input class="js-check-patient" value="all" type="checkbox"><div class="checkbox-btn"></div></label>', 
				`<i class="oe-i ${riskIcon}-grey no-click small"></i>`,
				'<i class="oe-i comments no-click small"></i>',
				'Wait hours', 
				'<!-- complete icon -->'
			]
		});
		
		group.append( header, table );
	};
	
	
	/**
	* Initalise Worklist
	* @param {*} list 
	* list.title { String }
	* list.json {JSON} - all patient data
	* list.fiveMinBookings {Boolean}, 
	* @param {String} id - unique ID 'bj1'
	* @param {Fragment} fragment - inital DOM build	
	*/
	const init = ( list, id, fragment ) => {
		
		/**
		* Process the patient JSON
		* @returns {Map} - key: uid, value: new Patient
		*/
		const patients = clinic.patientJSON( list.json, list.usesPriority );
		
		// build the static DOM
		const group = bj.dom('section', 'oec-group');
		group.id = `idg-list-${id}`;
		group.setAttribute('data-id', id );
		
		buildDOM( group, list );
		fragment.append( group );
		
		// Only <tr> in the <tbody> need re-rendering
		const tbody = group.querySelector('tbody');
		
		// add list clock
		clinic.clock( tbody );
		
		/**
		* @Event
		* + icon in <thead>, select/deselect all patients
		* all this does is toggle all patient + icons
		*/
		group.addEventListener('change', ev => {
			const input = ev.target;
			if( input.matches('.js-check-patient') && 
				input.value == "all" ){
				patients.forEach( patient  => patient.setTicked( input.checked ));
			}
		},{ useCapture:true });
		
		
		/**
		* @Event - Patient actiions outside of pathway
		*/
		
		// for scheduled patients
		const patientArrived = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onArrived();
			}
		};
		
		// for scheduled patients
		const patientDNA = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onDNA();
			}
		};
		
		// manually finish the pathway
		const patientComplete = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onComplete();
			}
		};
			
		/**
		* Add steps to patients
		* Insert step option is pressed. Update selected patients
		* @param {Object} dataset from <li>
		*/
		const addStepsToPatients = ( json ) => {
			const { c:code, s:status, t:type, i:idg } = ( JSON.parse(json) );

			patients.forEach( patient => {
				if( patient.isTicked()){
					if( code == 'c-last'){
						patient.removePathStep( code ); // Remove last step button
					} else {
						patient.addPathStep({
							shortcode: code, // pass in code
							status,
							type, 
							timestamp: Date.now(),
							idgPopupCode: idg ? idg : false,
						});
					}	
				}
			});
		};
		
		/**
		* Untick all patients AND tick (+) in <thead>
		*/
		const untickPatients = () => {
			patients.forEach( patient => patient.setTicked( false ));
			// and deselect the <thead> + icon
			group.querySelector('thead .js-check-patient').checked = false;
		};
		
		/**
		* Loop through patients and get their status
		* Filter btns will figure out their count
		* @returns {*}
		*/
		const getPatientFilterState = () => {
			const status = [];
			const redflagged = [];
			patients.forEach( patient => {
				status.push( patient.getStatus());
				redflagged.push( patient.getRedFlagged());
			});
			
			return { status, redflagged };
		};
		
		/**
		* Render Patients in list based on Filter
		* @param {String} filter - the selected filter
		*/
		const render = ( filter ) => {
			// build new <tbody>
			const fragment = new DocumentFragment();
			
			// Patients decide if they match the filter
			// if so, show in the DOM and update the filterPatients set
			patients.forEach( patient => {
				const tr = patient.render( filter );
				if( tr != null ){
					fragment.append( tr );
				}
			});
			
			// update <tbody>
			bj.empty( tbody );
			tbody.append( fragment );
			
			// if there aren't any patient rows
			if( tbody.rows.length === 0 ){
				const tr = bj.dom('tr','no-results', `<td><!-- padding --></td><td colspan='9' style="padding:20px 0" class="fade">No patients found</div></td>`);
				tbody.append( tr );
			}
		};

		return {
			render,
			addStepsToPatients,
			getPatientFilterState,
			untickPatients,
			patientArrived,
			patientDNA,
			patientComplete
		};
	};

	// add to namespace
	clinic.addList = init;			

})( bluejay, bluejay.namespace('clinic')); 
(function( bj, gui ){

	'use strict';	
	
	bj.addModule('gui.pathStep');	
	
	/**
	* Manage all pathSteps
	* Note, for this to work PathSteps must be added through JS (not PHP)
	*/
	const pathSteps = () => {
		
		const selector = 'oe-pathstep-btn';
		const collection = new bj.Collection();
		
		/*
		Methods	
		*/
		const _events= () => ({
			userDown(){
				gui.pathStepPopup.full( this, false );
			}, 
			userOver(){
				gui.pathStepPopup.quick( this );
			}, 
			userOut(){
				gui.pathStepPopup.hide();
			}
		});
		
		const _render = () => ({
			/**
			* Update the DOM CSS
			* @returns <span> Element
			*/
			render(){
				this.span.className = [ selector, this.status, this.type ].join(' ');
				this.displayInfo();
				return this.span;
			}
		});
		
		const _setters = () => ({
			/**
			* Shortcode
			* @param {String} val - change shortcode (from initial value)
			*/
			setCode( code ){
				this.shortcode = code;
				const stepName = this.span.querySelector('.step');
				
				if( code.startsWith('i-')){
					stepName.textContent = '';
					stepName.className = `step ${code}`;
				} else {
					stepName.className = `step`;
					stepName.textContent = code;
					
					if( code == "Waiting") this.type += ' long';
				}
				
				this.render();
			},
			
			getCode(){
				return this.shortcode;
			},
			
			/**
			* Status
			* @param {String} val
			*/
			setStatus( val ){
				// valid status settings
				const valid = ['config', 'todo', 'todo-next', 'active', 'done', 'buff'].find( test => test == val );
				if( !valid ) throw new Error(`PathStep: invaild status: "${val}".`);
				
				this.status = val;
				this.render();
			}, 
			
			getStatus(){
				return this.status;	
			},
						
			/**
			* Type
			* @param {String} val
			*/
			setType( val ){
				// valid types
				const valid = ['none', 'person', 'process', 'wait', 'wait long', 'arrive', 'red-flag', 'fork', 'auto-finish', 'finish', 'comments', 'comments added'].find( test => test == val );
				if( !valid ) throw new Error(`PathStep: invaild type: "${val}"`);
				
				this.type = val;
				this.render();
			},
			
			getType(){
				return this.type;
			},
			
			/**
			* pathStepPopup move pathStep on to next state
			* @param {String} status - next is default
			*/
			nextState(){
				let newStatus = false;
				switch( this.status ){
					case 'config': newStatus = 'todo'; 
					break;
					case 'todo': 
					case 'todo-next': newStatus = 'active'; 
					break;
					case 'active': 
						newStatus = 'done';
						// may not have any info DOM...
						if( this.info ) this.info.textContent = bj.clock24( new Date( Date.now())); 
					break;
				}
				
				if( newStatus ) this.changeState( newStatus );
			},
			
			prevState(){
				let newStatus = false;
				switch( this.status ){
					case 'todo': newStatus = 'config'; 
					break;
					case 'active': newStatus = 'todo'; 
					break;
				}
				
				if( newStatus ) this.changeState( newStatus );
			},
			
			changeState( newStatus ){
				this.setStatus( newStatus );
				// internal change - patient needs to know:
				if( this.callback ) this.callback( this );
				
				if( newStatus == 'done'){
					gui.pathStepPopup.remove();
				} else {
					gui.pathStepPopup.full( this, true );
				}
			},
			 
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {String} val
			*/
			setIdgPopupCode( val ){
				this.idgCode = val;
			},
			
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {Function} func
			*/
			setCallback( func ){
				this.callback = func;
			}
			
		});
		
		
		const _stepInfo = () => ({
			/** 
			* PathStep height depends on the "info".Height is not fixed, 
			* this allows the pathStep to fit in a standard table row. (This may change)
			* @params {String} info
			* info - A custom DOMstring (could be "&nbsp;") or "clock" or false,
			* If it's false don't add to the DOM as this affects the height.
			*/
			setInfo( info ){
				if( info !== false ){
					this.info = bj.dom('span','info');
					
					// set content
					this.info.innerHTML = info === "clock" ? 
						bj.clock24( new Date( Date.now())) :
						info;
					
					// append
					this.span.append( this.info );
					
					if( this.shortcode == 'i-Wait' || 
						this.shortcode == 'Waiting'){
							this.countWaitMins();
						}
					
				} 
			}, 
			
			countWaitMins(){
				if( this.shortcode == 'i-Wait' || 
					this.shortcode == 'Waiting'){
						setTimeout(() => {
							const mins = parseInt( this.info.textContent, 10 ) + 1;
							this.info.textContent = mins; 
							if( mins > 59 && this.shortcode !== 'Waiting' ){
								this.setCode('Waiting');
								// internal change - patient needs to know:
								if( this.callback ) this.callback( this );
							}
							this.countWaitMins(); // keep counting the mins?
						}, 60000 );
					}	
			},
			
			/**
			* When state changes and PathStep is rendered
			* check info display state.
			*/  
			displayInfo(){
				if( !this.info  ) return; 
				
				if( this.status == 'todo' || 
					this.status == 'todo-next' ||
					this.status == 'config' || 
					this.shortcode == 'i-Stop' ||
					this.shortcode == 'i-Fork' ){
					this.info.classList.add('invisible'); // need the DOM to keep the height consistent
				} else {
					this.info.classList.remove('invisible');
				}
			}
		});
		
		const _remove = () => ({
			/**
			* Remove - 
			* Could be from the patient pathway "Remove last"
			*/
			remove(){
				this.span.remove();
				collection.delete( this.key );
			}, 
			
			// Or, by the User from the pathStepPopup
			userRemove(){
				this.remove();
				this.status = "userRemoved";
				if( this.callback ) this.callback( this );
			}
		});
		
		/**
		* @Class
		* @param {Element} span - initialise with new DOM element
		* @returns {*} new PathStep
		*/
		const createPathStep = ( span ) => {
			return Object.assign( 
				{ span },
				{ setKey( k ){ this.key = k; }},
				_render(),
				_setters(),
				_stepInfo(), 
				_events(), 
				_remove()
			);
		};
		
		const getPathStep = ( target ) => {
			const key = collection.getKey( target );
			return collection.get( key );
		};
		
		/*
		Event delegation for PathSteps
		*/
		bj.userLeave(`.${selector}`, ev => getPathStep( ev.target ).userOut());
		bj.userEnter(`.${selector}`,  ev => getPathStep( ev.target ).userOver());
		bj.userDown(`.${selector}`, ev => getPathStep( ev.target ).userDown());

		/**
		* API - add new PathStep to DOM
		* @param {Object} step properties
		* @param {DOM} parentNode 
		* @param {Function} cb - Callback - CM Patient needs to know of any changes
		* @returns {PathStep}
		*/
		const addPathStep = ({ shortcode, status, type, info, idgPopupCode }, parentNode, cb = false ) => {
			
			// new DOM element, check for icons
			const stepName = shortcode.startsWith('i-') ? 
				`<span class="step ${shortcode}"></span>` :
				`<span class="step">${shortcode}</span>`;
		
			// create new PathStep & set up
			const ps = createPathStep( bj.dom('span', selector, stepName));
			ps.shortcode = shortcode;
			ps.setStatus( status );
			ps.setType( type );
			ps.setInfo( info );
			
			// render DOM
			const spanDOM = ps.render();
			
			// iDG code to show specific content in popup
			if( idgPopupCode ) ps.setIdgPopupCode( idgPopupCode );
			
			// update collection 	
			ps.setKey( collection.add( ps, spanDOM ));
		
			// add to a parentNode DOM?
			if( parentNode ) parentNode.append( spanDOM );
			
			// patient callback?
			if( cb ) ps.setCallback( cb );
			
			return ps; // return new PathStep
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 
(function( bj, gui, clinic ){

	'use strict';	
	
	bj.addModule('gui.pathStep');	
	
	/**
	* PathStep Popup
	*/
	const pathStepPopup = () => {
		
		const popup = bj.div('oe-pathstep-popup');
		let removeTimerID = null; 
		let lockedOpen = false; 
		let pathStep = null;
		let pathStepKey = null; // see loadContent

		/**
		* close/expand icon (provide a user hint that it can be expanded )
		* @param {Boolean} full (view) 
		* @returns {Element}
		*/
		const closeBtn = ( full ) => {
			const div = bj.div('close-icon-btn');
			div.innerHTML = full ? 
				'<i class="oe-i remove-circle medium-icon"></i>' :
				'<i class="oe-i expand small-icon"></i>';
			return div;
		};
		
		/**
		* Load content, loading this from the server
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'todo', 'active', 'etc'...
		* @params {Boolean} full - full view (or the quickview)
		*/
		const loadContent = ( shortcode, status, full ) => {
			/*
			Async.
			Use the pathStepKey for the token check
			*/
			if( shortcode === '?' ) shortcode = "config-who";
			const urlShortCode = shortcode.replace(' ','-'); // watch out for "Dr XY";
			
			const phpCode = `${urlShortCode}.${status}`.toLowerCase();
			bj.xhr(`/idg-php/load/pathstep/_ps.php?full=${full}&code=${phpCode}`, pathStepKey )
				.then( xreq => {
					if( pathStepKey != xreq.token ) return;
					// clear and replace content
					bj.empty( popup );
					const div = bj.div('slide-open');
					div.innerHTML = xreq.html;
					// add either a close icon or an expand icon
					popup.append( div, closeBtn( full ));
					// CSS has a default height of 50px.. expand heightto show content
					// CSS will handle animation
					popup.style.height = (div.scrollHeight + 20) + 'px'; 
					
					
				})
				.catch( e => console.log('PHP failed to load', e ));
		};
			
		/**
		* Render
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'active', 'todo', 'done'
		* @params {String} type - 'process', 'person'
		* @params {Element} span - DOM Element for PathStep
		* @params {String} idgCode - short code for specific idgContent
		* @params {Boolean} full - full view (or the quickview)
 		*/
		const render = ({ shortcode, status, type, span, idgCode }, full ) => {
			clearTimeout( removeTimerID );
			
			const useCode = idgCode ? idgCode : shortcode;
			
			// clear all children and reset the CSS
			bj.empty( popup );
			popup.classList.remove('arrow-t', 'arrow-b');
			popup.removeAttribute('style'); // remove the height until it's loaded in (reverts back to CSS)
			
			// there will be a small loading period: 
			const h3 = bj.dom('h3', 'title');
			h3.innerHTML = `<i class="spinner as-icon"></i>`;
			popup.append( h3 );
			
			// iDG loads PHP to demo content.
			// either a basic demo based on the shortcode
			// or using an iDG code to demo specific content
			loadContent(useCode , status, full );
			
			/*
			Position popup to PathStep (span)
			Anchor popup to the right side of the step
			Work out vertical orientation, if below half way down, flip it.
			*/
			const winH = bj.getWinH();
			const cssWidth = 380; // match CSS width
			const rect = span.getBoundingClientRect();
			const slightGap = 2; // so it doesn't get too tight
			
			popup.style.left = ( rect.right - cssWidth ) + 'px'; 
			
			if( rect.bottom < (winH * 0.6)){
				popup.style.top = rect.bottom + slightGap + 'px';
				popup.style.bottom = 'auto';
				popup.classList.add('arrow-t');
			} else {
				popup.style.top = 'auto';
				popup.style.bottom = ( winH - rect.top ) + slightGap + 'px';
				popup.classList.add('arrow-b');
			}
			
			// update DOM
			document.body.append( popup );
		};
		
		/**
		* Remove and reset 
		* this is also called by Clinic if a filter change happens
		*/
		const removeReset = () => {
			pathStep = null;
			lockedOpen = false;
			// There is a flicker if you 'scrub' along a pathway over many steps, delay removal to stop this
			removeTimerID = setTimeout(() => popup.remove(), 50 );
		};

		/**
		* User Clicks (click on same step to close)
		* @params {PathStep} ps 
		* @params {Boolean} userChangedStatus:
		* Use clicks on a button, in this popup, pathstep needs to update state and re-render!
		*/
		const full = ( ps, userChangedStatus = false ) => {
			if( ps === pathStep && userChangedStatus == false ){
				removeReset();
			} else {
				pathStep = ps;
				pathStepKey = ps.key; 
				lockedOpen = true;
				render( ps, true );
			}
		};
		
		/**
		* User Over - Quickview
		* @params {PathStep} ps
		*/
		const quick = ( ps ) => {
			if( lockedOpen ) return; 
			pathStepKey = ps.key; 
			render( ps, false );
		};
		
		/**
		* User Out
		* @params {PathStep} - deconstruct Object
		*/
		const hide = () => {
			if( lockedOpen ) return; 
			removeReset();
		};
		
		/*
		Event delegation
		*/
		// close icon btn in popup
		bj.userDown('.oe-pathstep-popup .close-icon-btn .oe-i', removeReset );
		
		// btn actions within popup. these are generic on IDG for demos
		bj.userDown('.oe-pathstep-popup .js-idg-ps-popup-btn', ( ev ) => {
			const userRequest = ev.target.dataset.action;
			
			// fake UIX process buttons in popup can request these
			switch( userRequest ){
				case 'remove':
					pathStep.userRemove();
					removeReset();
				break;
				case 'next':
					pathStep.nextState();
				break;
				case 'prev':
					pathStep.prevState();
				break;
			}
		});
	    
	    // API 
	    return { full, quick, hide, remove:removeReset };
	};
	
	// singleton. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStepPopup = pathStepPopup();
		
})( bluejay, bluejay.namespace('gui'), bluejay.namespace('clinic')); 
(function( bj, queue ){

	'use strict';	
	
	bj.addModule('queueManager');
	
	/*
	Check we are on right page... 
	*/
	if( document.getElementById('js-queue-mgmt-app') === null ) return;
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => initApp(), 500 );
	
	/**
	* Init the Queue Manager SPA
	*/
	const initApp = () => {
		bj.log('[Queue Manager] - intialising');
		/* 
		OK, ready to run this app, lets go!
		*/
		queue.app( JSON.parse( idgQueueDemoJSON ));
		loading.remove();
	};
	
})( bluejay, bluejay.namespace('queue')); 

(function( bj, queue ){

	'use strict';	

	const Qs = new Map();
	const Ps = new Map();
	
	/**
	* Patient 
	* Abstract holds reference to DOM Element (only need to build <div> once)
	* @param {Object} p - Data from JSON to build patient 'card'
	* @returns {Object} 
	*/
	const initPatient = ( p ) => {
		const id = bj.getToken(); // key for set
		const div = bj.div('patient');
		div.id = id; 
		div.setAttribute('draggable', true );
		
		let risk = p.risk ? 'urgent' : 'grey';
		
		
		div.innerHTML = `<i class="oe-i triangle-${risk} small pad-right selected"></i> ${p.lastname}, ${p.firstname}`;
		
		// API
		return {
			id, 
			div,
			queue: null, // patients queue
			queuePos: null, // if dropped on, I need to know list position
			queueChange( newQueue ){
				/*
				new queue? remove myself from old queue 	
				*/
				if( this.queue != newQueue ){
					if( this.queue ) this.queue.removePatient( this.queuePos );
					this.queue = newQueue;
				}
			}, 
			setQueuePos( n ){
				this.queuePos = n;
			}
		};
	};

	/**
	* Queue 
	* Abstract holds reference to DOM Element (only need to build <div> once)
	* @param {Object} - Destructured
	* @returns {Object} 
	*/
	const initQueue = ({ id, header, root }) => {
		
		const el = bj.div('queue');
		const patientList = bj.div('patient-list');
		el.id = id;
		el.innerHTML = id == 'q0' ? 
			`<header class="in-flow">${header}</header>`:
			`<header>${header}</header>`;
		el.append( patientList );
		
		// add a button in the sidebar to allow show/hide
		const btn = bj.div('side-queue-btn selected');
		btn.setAttribute('data-queue', id );
		btn.innerHTML = `${header}<div class="patients"></div>`;
		document.getElementById('idg-side-queue-clinicians').append( btn );
		
		
		// update DOM (sloppy, but should be OK for demo)
		root.append( el );
		
		// API
		return {
			id,
			div: el, 
			btn,
			capacity: 10,
			btnPatients: btn.querySelector('.patients'),
			patientList,
			list: [],
			/* 
			Every time there is change to the list
			let all the Patients know their new positions	
			*/
			updatePatients(){
				this.list.forEach(( p, index ) => p.setQueuePos( index ));
				const showIcons = this.list.length > 21 ? 21 : this.list.length;
				this.btnPatients.style.width = (showIcons * 11) + 'px';
				//this.btnCount.textContent = this.list.length ? `${percent}%`: 'No patients assigned';
			},
			
			/**
			* Update patient position in same queue	
			* have to do some Array juggling... 
			*/
			changePatientPos( patient, newPos ){
				this.list[ patient.queuePos ] = null; // need to find this later
				this.list.splice( newPos, 0, patient ); // move in list
				const oldPosIndex = this.list.findIndex( i => i === null );// find old index
				this.list.splice( oldPosIndex, 1 ); // remove it
				this.render();
			},
			
			/**
			* Add new patient and insert in position	
			* Let patient know it's new queue
			* @param {*} patient
			*/
			addPatientAndPos( patient, pos ){
				patient.queueChange( this );
				this.list.splice( pos, 0, patient ); // place in list
				this.render();
				
			},
			
			/**
			* Add new patient to end of the queue
			* Let patient know it's new queue
			* @param {*} patient
			*/
			addPatient( patient ){
				patient.queueChange( this );
				this.list.push( patient ); // add to the end of the list
				this.render();
			},
			
			/**
			* @callback from Patient, letting it's old list know it's moved on
			* @param {Number} indexPos
			*/
			removePatient( indexPos ){
				this.list.splice( indexPos, 1);
				this.render();
			},
			render(){
				// reflow Patient list
				const fragment = new DocumentFragment();
				this.list.forEach( p => fragment.append( p.div ));
				
				bj.empty( patientList );
				patientList.append( fragment );
				
				// update patients with their new position the queue
				this.updatePatients();
			}
		};
	};
	
	
	/**
	* Drag n Drop
	*/
	
	
	/**
	* Drag start - source element
	* @param {Event} e
	*/
	const handleStart = ( e ) => {
		e.target.classList.add('moving');
		e.dataTransfer.effectAllowed = 'move';
		/*
		Can only set Text in the data. Set the ID.
		(This allows for a list of elements)
		e.g.node can be moved: add-to-end.append( document.getElementByID( e.dataTransfer.getData("text/plain") ));
		*/
		e.dataTransfer.setData("text/plain", e.target.id );	
		
	};
	
	/**
	* Drag end - source element
	* @param {Event} e
	*/
	const handleEnd = ( e ) => {
		e.target.classList.remove('moving');
	};
	
	/**
	* Drag over - add-to-end element
	* @param {Event} e
	*/
	const handleOver = ( e ) => {
		e.preventDefault(); // required.
		e.dataTransfer.dropEffect = 'move';
		
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.add('add-to-end');
		}
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.add('add-above');
			e.target.classList.remove('over');
		}

		return false; // a good practice!
	};
	
	/**
	* Drag leave - add-to-end element
	* @param {Event} e
	*/
	const handleDragLeave = (e) => {
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.remove('add-to-end');
		}	
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.remove('add-above');
		}	
	}; 
	
	/**
	* Drag DROP - add-to-end element
	* @param {Event} e
	*/
	const handleDrop = ( e ) => {
		e.preventDefault(); // required.
		
		const dataID = e.dataTransfer.getData("text/plain");
		const p = Ps.get( dataID );
	
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.remove('add-to-end');
			
			// add to the end of a queue list
			const queue = Qs.get( e.target.id ); 
			queue.addPatient( p );
		}
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.remove('add-above');
			
			if( dataID == e.target.id ) return false; // dropping on self
			
			// dropping on a patient in a queue
			const dropP = Ps.get( e.target.id );
			const dropQ = dropP.queue;
			
			if( dropP.queue == p.queue ){
				// same queue, update patient card position
				dropQ.changePatientPos( p, dropP.queuePos );
				
			} else {
				// dropping in a new queue
				dropQ.addPatientAndPos( p, dropP.queuePos );
			}
			
		}

		return false;
	};
	

	/**
	* Init - SPA
	* @param {Array} json - patients from PHP
	*/
	const app = ( json ) => {
		const root = document.getElementById('js-queue-mgmt-app');
		
		/*
		For the purpose of the demo hard code queues
		*/
		const buildQueue = ( id, header ) => {
			Qs.set( id, initQueue({ id, header, root }));
		};
		
		buildQueue( 'q0', 'New referrals' );
		buildQueue( 'q1', 'Dr Amit Baum' );
		buildQueue( 'q2', 'Dr Angela Glasby' );
		buildQueue( 'q3', 'Dr Robin Baum' );
		
		
		/*
		Patient data is coming from the PHP JSON
		each patient has a qNum that relates to
		the queue key to start it in	
		*/
		json.forEach( p => {
			const newPatient = initPatient( p );
			Ps.set( newPatient.id, newPatient );
		
			const queue = Qs.get( 'q' + p.qNum );
			queue.addPatient( newPatient );
		});
		
		/*
		fake a patient referral in-flow	
		*/
		const fakeInFlow = () => {
			const surname = ['SMITH', 'JONES', 'TAYLOR', 'BROWN','WILLIAMS','JOHNSON','DAVIES'];
			const firstname = ['Jack (Mr)', 'David (Mr)', 'Sarah (Ms)', 'Lucy (Mrs)', 'Jane (Mrs)', 'Mark (Mr)', 'James (Mr)', 'Ian (Mr)'];
			//const randomRisk = Math.random() < 0.5;
			
			const newPatient = initPatient({
				lastname: surname[Math.floor(Math.random() * surname.length)],
				firstname:  firstname[Math.floor(Math.random() * firstname.length)],
				risk: Math.random() < 0.2, // 1 in 5 Urgent!
			});
			
			Ps.set( newPatient.id, newPatient );
			Qs.get('q0').addPatient( newPatient );
			
			const randomInterval = ((Math.floor(Math.random() * 3)) * 2000) + 4000;
			setTimeout( fakeInFlow, randomInterval );
		};
	
		setTimeout( fakeInFlow, 4000 );
		
		
		
		// Drag n Drop, listeners
		root.addEventListener('dragstart', handleStart, { useCapture: true });
		//root.addEventListener('dragenter', handleEnter, { useCapture: true });
		root.addEventListener('dragover', handleOver, { useCapture: true });
		root.addEventListener('dragleave', handleDragLeave, { useCapture: true });
		root.addEventListener('dragend', handleEnd, { useCapture: true });
		root.addEventListener('drop', handleDrop, { useCapture: true });
		
		// Can not do the hover effect with CSS. Need to use JS
		// and then clear the hover class with handleOver drag event
		bj.userEnter('.queue  .patient', ( e ) => e.target.classList.add('over'));
		bj.userLeave('.queue  .patient', ( e ) => e.target.classList.remove('over'));
		
		// side btns
		bj.userDown('.side-queue-btn', e => {
			const btn = e.target;
			const queue = Qs.get( e.target.dataset.queue );
			if( btn.classList.contains('selected')){
				btn.classList.remove('selected');
				bj.hide( queue.div );	
			} else {
				btn.classList.add('selected');
				bj.show( queue.div );	
			}
		});
		
	};
	
	// add to namespace
	queue.app = app;			

})( bluejay, bluejay.namespace('queue')); 
(function (uiApp) {

	'use strict';
	

	
	if(document.querySelector('#tinymce-letterheader-editor') === null) return;
	
	let tinyEditor = null;
	
	const inserts = {
		"user_name": {"label":"User Name","value":"<span>Admin Admin</span>"},
		"firm_name": {"label":"Firm Name","value":"<span>Glaucoma Clinic</span>"},
		"site_name": {"label":"Site Name","value":"<span>Kings Hospital</span>"},
		"site_phone": {"label":"Site Phone","value":"<span>0123456789</span>"},
		"site_fax": {"label":"Site Fax","value":null},
		"site_email": {"label":"Site Email","value":null},
		"site_address": {"label":"Site Address","value":"<span>100 Main Road</span>"},
		"site_city":{"label":"Site City", "value":"<span>London</span>"},
		"site_postcode": {"label":"Site Postcode","value":"<span>W1 1AA</span>"},
		"primary_logo": {"label":"Primary Logo","value":'<img src="/idg-php/imgDemo/correspondence/letterhead-logo.png">'},
		"secondary_logo": {"label":"Secondary Logo","value":null},
		"current_date": {"label":"Today's Date","value":"<span>" + document.documentElement.dataset.today + "</span>"}
	};

	const insertData = (key, value) => {
		tinyEditor.insertContent('<span contenteditable="false" data-substitution="' + key + '">' + value + '</span>');
	};
	
	const quickInsertBtns = () => {
		var frag = new DocumentFragment();
		
		// build Buttons
		for (const key in inserts) {
			let label = inserts[key].label;
			let value = inserts[key].value;
			if(value === null) continue; // not much point in adding this as a button!
			
			var btn = document.createElement('button');
			btn.className = "idg-quick-insert";
			btn.textContent = label;
			btn.setAttribute('data-insert', JSON.stringify({key, value}));
			
			// build the Fragment
			frag.appendChild(btn);
		}
		
		document.querySelector('.editor-quick-insert-btns').appendChild(frag);
	};

	/*
	tinyMCE editor - initialise
	*/
	tinymce.init({
		selector: '#tinymce-letterheader-editor',
		schema: 'html5-strict',
		branding: false,
		min_height:400, // can be dragged bigger
		menubar: false,
		plugins: ['lists table paste code'],
		contextmenu: 'table',
		toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | table | code",
		//body_class: 'tiny_oe_body',	
		custom_undo_redo_levels: 10, // save memory
		//object_resizing : false
		hidden_input: false,
		block_formats: 'Paragraph=p; Header 2=h2; Header 3=h3',
		content_css : '/newblue/css/style_oe3_print.min.css',
		setup: function(editor) {
			editor.on('init', (function(e) {
				tinyEditor = editor;
				quickInsertBtns();
			}));
		}
	}); 
		
	uiApp.userDown('.idg-quick-insert', (ev) => {
		let obj = JSON.parse(ev.target.dataset.insert);
		insertData(obj.key, obj.value);
	});
	
/*
	$('select#substitution-selection').on('change', function () {
                let key = $(this).val();
                if (key !== '' && key !== 'none_selected') {
                    let value = that.getSubstitution(key);
                    editor_ref.insertContent('<span contenteditable="false" data-substitution="' + key + '">' + value + '</span>');
                    console.log(key);
                }

                $(this).val('none_selected');
            });
	
			
			

    $(document).ready(function () {
        let html_editor_controller =
            new OpenEyes.HTMLSettingEditorController(
                "letter_header",
                {"plugins":"lists table paste code pagebreak","branding":false,"visual":false,"min_height":400,"toolbar":"undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table | subtitle | labelitem | label-r-l | inputcheckbox | pagebreak code","valid_children":"+body[style]","custom_undo_redo_levels":10,"object_resizing":false,"menubar":false,"paste_as_text":true,"table_toolbar":"tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol","browser_spellcheck":true,"extended_valid_elements":"i[*]","valid_elements":"*[*]","pagebreak_separator":"<div class=\"pageBreak\" \/>","content_css":"\/assets\/ca6609ee\/css\/style_oe3_print.min.css"},
                }            );
    });
*/
			
			
})(bluejay); 
(function( bj ) {

	'use strict';
	
	// dirty demo of fabric annotation on IDG
	if( document.getElementById('js-idg-annotate-image-tester') == null ) return;
	
	// user can test different images on IDG via a dropdown
	// /v3-SEM-events/document-annotate
	
	const init = () => {
		bj.log(`[Annotate] - Fabric Version ${fabric.version}`);
	
		// div.oe-annotate-image wrapper for the toolbox and canvas-js for Fabric	
		const annotate = document.getElementById('js-idg-annotate-image-tester');
		
		// line width is using input [range], only need it for freedraw, hide on other tools
		const lineWidth = annotate.querySelector('.line-width');
		
		let activeTool = null; // store current tool (to handle adding removing "draw" class)
		let drawColor = "#f00"; // user selected colour
		
		/*
		Create CANVAS and append to DOM
		*/
		const canvasElem = document.createElement('canvas');
		canvasElem.id = 'c1';
		canvasElem.textContent = "Image annotation tool";
		annotate.querySelector('.canvas-js').append( canvasElem );

		/* 
		Fabric fun...
		*/
		const canvas = new fabric.Canvas('c1');
		
		// Selecting Object styling
		fabric.Object.prototype.set({
		    borderColor: 'rgb(0,255,255)', // funky OE Electric blue!
			cornerColor: 'rgb(0,255,255)', 
			cornerSize: 12,
			transparentCorners: false
		});
		
		// set up the default line (default to middle setting 3)
		canvas.freeDrawingBrush.color = drawColor;
		canvas.freeDrawingBrush.width = 12; // ( user line width * 4 )
		
		
		/**
		* set up the canvas for an image, iDG is demo-ing different images
		* reset each time...
		* @param {String} img - jpg
		* @param {Number} w - width 
		* @param {Number} h - height
		*/
		const resetCanvas = ( img, w, h ) => {
			canvas.clear();
			
			const canvasMaxWidth = annotate.offsetWidth - 170; // allow for the toolbox
			const imgScale = canvasMaxWidth / w;
			// update canvase size
			canvas.setHeight( h * imgScale );
			canvas.setWidth( canvasMaxWidth );
			
			// image background
			fabric.Image.fromURL(`/idg-php/imgDemo/annotate/${img}.jpg`, oImg => {
				oImg.scale( imgScale );
				canvas.setBackgroundImage( oImg, canvas.renderAll.bind( canvas ));
			});
		};
		
		/**
		* Circle draw
		*/
		const drawCircle = (() => {
			let active, adjust; 
			
			/**
			* @callback for mouse:down
			* @param {Event} e
			*/
			const addCircle = ( e ) => {
				if( !active || adjust ) return; adjust = true;
				
				// create a new circle
				const circle = new fabric.Circle({
					radius: 30, // a standard size 
					left: e.pointer.x - 30, 
					top: e.pointer.y - 30, 
					fill: false,
					stroke: drawColor,
					strokeWidth: 4, // fixed!
					centeredScaling: true
				});
				
				canvas.add( circle ); // add Circle
				canvas.setActiveObject( circle ); // set as active to provide instant control	 
			};
			
			// Listeners
			canvas.on('mouse:down', ( e ) => addCircle( e ));	
			canvas.on('selection:cleared', () => adjust = false );
			
			// simple API
			const start = () => {
				active = true;
				adjust = false;
			};
			
			const stop = () => {
				active = false;
			};	
		
			return { start, stop };
		})();
		
		/**
		* Pointer (Arrow) draw
		*/
		const drawPointer = (() => {
			let active, adjust;
			
			// build the pointer template group
			const triangle = new fabric.Triangle({ width: 30, height: 30, fill: 'red', left: 30, top: 30 });
			const line = new fabric.Line([42,60,42,120],{ stroke: 'red', strokeWidth: 7 });
			const template = new fabric.Group([ triangle, line ], { originY:'top', });
			
			const addPointer = ( e ) => {
				if( !active || adjust ) return; adjust = true;
				
				// clone the template
				let newPointer; 
				template.clone(( copy ) => newPointer = copy );
				
				// which quarter is the user adding the arrow in?
				const topHalf = ( canvas.height / 2 ) > e.pointer.y;
				const leftHalf = ( canvas.width / 2 ) > e.pointer.x; 
				let r, x, y; 
				
				if( topHalf ){
					if( leftHalf ){
						r = -45;
						x = e.pointer.x;
						y = e.pointer.y + 18;
					} else {
						r = 45;
						x = e.pointer.x - 18;
						y = e.pointer.y;
					}
				} else {
					if( leftHalf ){
						r = -135;
						x = e.pointer.x + 20;
						y = e.pointer.y;
					} else {
						r = 135;
						x = e.pointer.x;
						y = e.pointer.y - 20;
					}
				}
				
				// adjust and position new Pointer
				newPointer.rotate( r );
				newPointer.set({
					top: y,
					left: x,
				});
				
				canvas.add( newPointer ); // add Pointer
				canvas.setActiveObject( newPointer ); // set as active to provide instant control
			};
			
			// Listeners
			canvas.on('mouse:down', ( e ) => addPointer( e ));	
			canvas.on('selection:cleared', () => adjust = false );
			
			// simple API
			const start = () => {
				active = true;
				adjust = false;
			};
			
			const stop = () => {
				active = false;
			};	
		
			return { start, stop };
		})();

		
		
		/**
		* Controller for tool button events 
		* @param {Element} button - user requests a tool
		*/
		const toolChange = ( toolBtn ) => {
			if( toolBtn.name == 'erase'){
				canvas.remove( canvas.getActiveObject());
				return;
			}
			
			// update the UI
			if( activeTool ) activeTool.classList.remove('draw');			
			activeTool = toolBtn;
			toolBtn.classList.add('draw');
			
			// reset to defaults
			drawCircle.stop();
			drawPointer.stop();
			canvas.set('isDrawingMode', false );
			canvas.set('defaultCursor', 'crosshair');
			
			// only need line width for freedraw
			lineWidth.style.display = "none";
			
			switch( toolBtn.name ){
				case 'manipulate': 
					canvas.set('defaultCursor', 'auto'); 
				break;
				case 'freedraw': 
					canvas.set('isDrawingMode', true );
					lineWidth.style.display = "block";
				break;
				case 'circle': 
					drawCircle.start();
				break;
				case 'pointer': 
					drawPointer.start();
				break;
			}
		};
		
		// use BlueJS event delegation for toolbox buttons 
		bj.userDown('.js-tool-btn', ( e ) => toolChange( e.target ));
		
		// linewidth input range
		lineWidth.querySelector('input').addEventListener('change', ( e ) => {
			const w = e.target.value;
			lineWidth.querySelector('small').textContent = `Line width: ${w}`;
			canvas.freeDrawingBrush.width = ( w * 4);
		});
		
		/*
		IDG!
		provide a dropdown to switch the image in the canvas to test different sizes... 
		*/
		const selectImage = document.getElementById('js-idg-annotate-image');
		const imageOptions = selectImage.options;
		
		const canvasOptionImg = ( n ) => {
			const optionSelected = imageOptions[ n ];
			const imgSize = ( JSON.parse(optionSelected.dataset.idg) );
			resetCanvas( optionSelected.value, imgSize.w, imgSize.h );
		};
		
		
		selectImage.addEventListener('change', () => {
			canvasOptionImg( imageOptions.selectedIndex );
		}, false);
		
		/*
		Quick init
		*/
		canvasOptionImg( 0 );
		toolChange( document.querySelector('.js-tool-btn[name="freedraw"]'));
	};
	
	
	// load in Fabric
	bj.loadJS('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.3.1/fabric.min.js', true )
		.then(() => init());
	
	
})( bluejay ); 
(function( bj ) {

	'use strict';
	
	/**
	as I only need this in EDIT mode, check for a js- hook
	*/
	if(document.querySelector('.js-btx-inj-svg') === null) return;
	
	/**
	Useful DOM Elements
	Note: User can switch between Face and Eyeball SVGs 
	*/
	const face = document.querySelector('.btx-face');
	const eyeballs = document.querySelector('.btx-eyeballs');
	const list = document.querySelector('table.btx-list');
	const totalUnits = document.getElementById('js-idg-btx-unit-total');
	
	/**
	* Model + View notifications
	*/
	const model = Object.assign({
		_muscles:'face',
		_injections:[],
		
		get muscles(){
			return this._muscles;
		},
		set muscles( str ){
			this._muscles = str; // "face" or "eyeballs"
			// clear injections and remove injection Markers
			this._injections.forEach( inj => inj.div.remove());
			this._injections = [];
			this.views.notify();
		},
		
		set injections( inj ){
			// add human readable units
			inj.humanUnits = inj.units.toFixed(1);
			this._injections.push( inj );
			this.views.notify();
		},
		get injections(){
			return this._injections;
		}, 
		
		injNum(){
			return this._injections.length;	
		},
		
		removeInj( arrayRef ){
			const injs = this._injections;
			// remove the injection
			injs[arrayRef].div.remove();
			// update the list
			injs.splice( arrayRef, 1 );
			// update all list references
			injs.forEach(( inj, index ) => {
				inj.injCount = index + 1;
				inj.ref = index;
				inj.div.innerHTML = injMarkerText( inj.units, inj.injCount);
			});
			
			// re-render
			this.views.notify();
		}, 
		
		volumeChange( arrayRef, volume ){
			const inj = this._injections[ arrayRef ];
			const integer = Math.round( parseFloat( volume ) * 10 ); // allow for extreme precision
			inj.vol = integer / 10;
			inj.units = calcUnits( inj.vol );
			inj.humanUnits = inj.units.toFixed(1);
			inj.div.innerHTML = injMarkerText( inj.units, inj.injCount);
			showTotalUnits();
		}
		
	}, bj.ModelViews());
	
	/**
	* View - Handle the SVG display
	*/
	const muscleMode = () => {
		if( model.muscles == "face"){
			bj.show( face );
			bj.hide( eyeballs );
		} else {
			bj.hide( face );
			bj.show( eyeballs );
		}
	};
	
	model.views.add( muscleMode );
	
	/**
	* View - render the table rows for the btx list
	*/
	const renderList = () => {
		const tr = [
			'{{#list}}<tr>',
			'<td><span class="highlighter"><b>{{injCount}}</b></span></td>',
			'<td><input type="text" value="{{muscles}}" class="cols-11"></td>',
			'<td>{{side}}</td>',
			'<td><input type="number" step="0.1" min="0" max="5" value="{{vol}}" class="fixed-width-medium js-idg-btx-vol" data-btx="{{ref}}"/></td>',
			'<td>{{humanUnits}}</td>',
			'<td>Botox (BTX)</td>',
			'<td><i class="oe-i trash" data-btx="{{ref}}"></i></td>',
			'</tr>{{/list}}',
		].join('');
		
		const tbody = list.querySelector('tbody');
		bj.empty( tbody );
		tbody.innerHTML = Mustache.render( tr, { list: model.injections });
	};
	
	model.views.add( renderList );
	
	/**
	* View - show total Unit count for all injections
	*/
	const showTotalUnits = () => {
		const injs = model.injections;
		let units = 0;
		if( injs.length ){
			units = model.injections.reduce(( accumulator, inj ) => accumulator + inj.units, 0 );
		}
		// update totalUnits for agent
		totalUnits.textContent = units.toFixed(1);		
	};
	
	model.views.add( showTotalUnits );
	
	/**
	* Helpers
	*/
	const injMarkerText = ( units, count ) => `<div class="units">${units.toFixed(1)}</div><div class="agent">BTX</div><div class="inj-num">${count}</div>`;
	
	const calcUnits = ( vol ) => {
		const unitsPerMl = document.querySelector('input[name="btx-units-ml"]');
		return  vol * parseInt( unitsPerMl.value, 10 ); // floating point
	};
	
	/**
	* @callback - user clicks on face
	* Build <div> to show injection and update list
	* @param {Number} - offsetX 
	* @param {Number} - offsetY
	*/
	const addInj = ( x, y ) => {
		//console.log(`x ${x} : y ${y}`);
		
		// default volume: 
		const userDefaultVolume = document.querySelector('input[name="btx-volume-ml"]');
		const volume = parseInt(( parseFloat( userDefaultVolume.value ) * 10 ), 10); // allow for extreme precision
		
		const injNum = model.injNum();
		const injCount = injNum + 1;
		const injUnits = calcUnits( volume / 10 ); // default Units
		
		const div = bj.div('inj-marker');
		div.style.top = (y - 30) + 'px'; // CSS sets .inj-marker height to 30px;
		div.style.left = x + 'px';
		div.innerHTML = injMarkerText( injUnits, injCount );
		
		let muscles = "";
		let side = x > 192 ? 'Left' : 'Right';
		
		// show injection on current muscles SVG: 
		if( model.muscles == "face"){
			/*
			Face!
			*/
			face.append( div );
			
			muscles = "Frontalis"; 
			
			if( y > 118) muscles = "Corrugator";
			if( y > 139) muscles = "Orbicularis upper";
			if( y > 190) muscles = "Orbicularis lower";
			if( y > 242) muscles = "Zygomaticus";
			if( y > 310) muscles = "Mentalis";
			if( y > 375) muscles = "Platysma";
			
			// Procerus - midline
			if(( x < 201 && x > 174) && ( y < 181 && y > 130 )){
				side = "Midline";
				muscles = "Procerus";
			}
			
			// Procerus - midline
			if(( x < 245 && x > 151) && ( y < 310 && y > 280 )){
				muscles = "Orbicularis oris";
			}
	
		} else {
			/*
			Eyeballs!
			*/
			eyeballs.append( div );
			
			if( y < 160 && y > 136 ) muscles = "Superior";
			if( y < 240 && y > 218 ) muscles = "Inferior";
			
			if( y < 205 && y > 160 ){
				if( x < 110 && x > 70 ) muscles = "Lateral";
				if( x < 310 && x > 270 ) muscles = "Lateral";
				if( x < 230 && x > 150 ) muscles = "Medial";
			}
		
			muscles = muscles ? muscles + ' rectus' : '?';
			
			// inferior oblique
			if( y < 218 && y > 205 ) muscles = "inferior oblique";
		}
		
		// add new injection...
		model.injections = {
			ref: injNum,
			injCount,
			vol: volume / 10,
			units: injUnits,
			div, // it will handle removing it's div
			side,
			muscles
		};
	};
	
	/**
	* Events 
	*/
	bj.userDown('.js-btx-inj-svg', e => {
		addInj( e.offsetX, e.offsetY );
	});
	
	bj.userDown('table.btx-list .trash', e => {
		model.removeInj( parseInt( e.target.dataset.btx, 10 ));
	});
	
	document.addEventListener('change', e => {
		if( e.target.matches('.js-idg-btx-vol')){
			model.volumeChange( e.target.dataset.btx, e.target.value );
			// this is quick hack to save fixing this properly!
			e.target.parentNode.nextSibling.textContent = calcUnits( e.target.value ).toFixed(1);
		}
		
		if( e.target.matches('input[name="idg-btx-muscles"]')){
			model.muscles = e.target.value;
		}
	});
	
		
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	Eyedraw v2 (2.5)
	*/
	
	if(document.querySelector('.js-idg-demo-ed2') === null) return;


	uiApp.userDown('.js-idg-demo-doodle-drawer', (ev) => {
		let icon = ev.target; 
		let li = uiApp.getParent(icon,'li');
		li.classList.toggle('ed2-drawer-open');
	});
	
	
	uiApp.userDown('.ed-canvas-edit', (ev) => {
		let canvas = ev.target; 
		let editor = uiApp.getParent(canvas,'.ed2-editor');
		let popup = editor.querySelector('.ed2-doodle-popup');
		popup.classList.toggle('closed');	
	});
	
	uiApp.userDown('#js-idg-demo-ed2-search-input', (ev) => {
		let autocomplete = ev.target.nextElementSibling;
		console.log('hi');
		if(autocomplete.style.display == "none"){
			autocomplete.style.display = 'block';
		} else {
			autocomplete.style.display = 'none';
		}
	});
	
			
})(bluejay); 
(function( bj ) {

	'use strict';
	
	if( document.querySelector('.oe-worklists.eferral-manager') === null ) return;
	
	/**
	e-referral manaager demo
	see: https://idg.knowego.com/v3/eferral-manager
	demo shows UI/UX behaviour for setting Risk and Pathways
	for selected patient lists.	
	*/
	
	const collection = new bj.Collection();
	
	/** 
	* update Patient Risk icon
	* @params {Element} icon
	* @params {Number} level
	*/
	const updateRiskIcon = ( icon, level ) => {
		const colours = ['grey', 'red', 'amber', 'green'];
		icon.className = `oe-i triangle-${colours[level]} selected`; // selected to remove cursor pointer
	};
	
	/**
	* @Class 
	* Patient 
	*/
	const Patient = {
		accepted: null, // rejected is false, accepted = true, starts unknown 
		tr:null, 
		
		// icons in <tr>
		iEdit:null, // pencil icon
		iState:null, // tick / cross
		
		// Strings
		fullName: 'JONES, David (Mr)', 
		nhs: '000',
		age: '42',
		gender: 'Male',
		
		// states
		riskNum: 0,
		_pathway: null, 
		
		/**
		Active / Inactive <tr> state
		*/
		active(){
			this.iEdit.classList.replace('pencil', 'pencil-blue');
			this.iEdit.classList.add('selected');	
			this.tr.classList.add('active');
		},
		inactive(){
			this.iEdit.classList.replace('pencil-blue', 'pencil');
			this.iEdit.classList.remove('selected');	
			this.tr.classList.remove('active');
		},
		
		/**
		User can reject the referral, if so update UI <tr> state
		*/
		accept(){
			this.accepted = true;
			this.iState.classList.replace('status-query', 'tick-green');
			this.iState.classList.replace('cross-red', 'tick-green');
		},
		
		reject(){
			this.accepted = false;
			this.iState.classList.replace('status-query', 'cross-red');
			this.iState.classList.replace('tick-green', 'cross-red');
		},
		
		/**
		Patient info (quick hack to show this)
		*/
		name(){
			return this.fullName;
		},
		details(){
			return `${this.gender}, ${this.age}y`;
		}, 
		
		/**
		Risk state
		*/
		setRisk( icon ){
			this.iRisk = icon;
			this.riskNum = ['grey', 'red', 'amber', 'green'].findIndex( colour => icon.classList.contains( `triangle-${colour}` ));
		}, 
		get risk(){
			let dom = `<i class="oe-i triangle-grey small pad-right"></i><b>Moderate</b>&nbsp;(R2)`;
			switch( this.riskNum ){
				case 1: dom = `<i class="oe-i triangle-red small pad-right"></i><b>High</b>&nbsp;(R1)`;
				break;
				case 2: dom = `<i class="oe-i triangle-amber small pad-right"></i><b>Moderate</b>&nbsp;(R2)`;
				break;
				case 3: dom = `<i class="oe-i triangle-green small pad-right"></i><b>Low</b>&nbsp;(R3)`;
				break;
			}
			return dom;
		}, 
		set risk( val ){
			this.riskNum = parseInt(val, 10);
			updateRiskIcon( this.iRisk, val );
			if( this.accepted === null ) this.accept();
		}, 
		
		/**
		Clinical Pathway
		*/
		set pathway( val ){
			this._pathway = val;
		}, 
		get pathway(){
			return this._pathway;
		}

	};
	
	
	/**
	* Initalise Patients. 
	* This is done from the DOM. It's set up to show a selection of lists
	* There could be a few tables that need setting up.
	*/
	const tables = bj.nodeArray( document.querySelectorAll('table.eferrals'));
	
	// loop through all the tables...
	tables.forEach(( table ) => {
		
		// then loop through all <tr> ...
		let rows = Array.from( table.tBodies[0].rows );
		
		rows.forEach(( row ) => {
			
			if( row.classList.contains('js-locked')) return;
			
			// build Patient
			let patient = Object.create( Patient );
			patient.tr = row;
			
			patient.iEdit = row.querySelector('.oe-i.pencil');
			patient.iState = row.querySelector('.oe-i.js-referral-status-icon');
			
			patient.fullName = row.querySelector('.patient-name').textContent;
			patient.age = row.querySelector('.patient-age').textContent.substring(3);
			patient.gender = row.querySelector('.patient-gender').textContent.substring(3);
			patient.nhs = row.querySelector('.nhs-number').textContent.substring(3);
			
			patient.setRisk( row.querySelector('[class*="triangle-"]'));
			patient.pathway = ( row.querySelector('.js-pathway').textContent );
			
			patient.hasImage = Math.random() >= 0.5; // show randomly a thumbnail attachment
			
			// Quick hack to get group header to show when patient is selected
			let workGroup = bj.getParent( row, '.worklist-group' );
			patient.group = workGroup.querySelector('.worklist-summary h2').textContent;
			
			// build DOM collections, store 'key', need it for 'next' / 'previous'
			patient.myKey = collection.add( patient, patient.iEdit );
		});
	});

	/**
	* Sidebar functionality 
	* workhorse.
	*/
	const sidebar = (() => {
		
		let activePatient = null;

		/** 
		* sidebar UI
		*/
		const ui = {
			view: {
				overview: document.getElementById('sidebar-eferral-overview'), 
				patient: document.getElementById('sidebar-manage-patient'), 
				reject: document.getElementById('sidebar-reject-accept')
			},
			btn: {
				overview: document.getElementById('idg-js-sidebar-viewmode-1'),
				patient: document.getElementById('idg-js-sidebar-viewmode-2'),
			}, 
			patient: {
				fullName: document.getElementById('js-sidebar-patient-fullname'),
				details: document.getElementById('js-sidebar-patient-details'),
				group: document.getElementById('js-sidebar-referral-group'),
				attachment: document.getElementById('js-demo-attachment-image'), 
				
				// sidebar uses adder filters but these don't work.
				// just need to update the filters to show the current selected patient
				risk: document.getElementById('sidebar-eref-patient-risk'), 
				pathway: document.getElementById('sidebar-eref-pathway'),
				tests: document.getElementById('sidebar-eref-tests'),				
			}	
		};
		
		/**
		* Update sidebar Reject / Accept area
		* @param {Boolean} True or Null means 'accepted'
		*/
		const showAsAccepted = ( b ) => {
			if( b || b === null ){
				bj.show( ui.view.reject.querySelector('.js-reject'));
				bj.hide( ui.view.reject.querySelector('.js-accept'));
			} else {
				bj.hide( ui.view.reject.querySelector('.js-reject'));
				bj.show( ui.view.reject.querySelector('.js-accept'));
			}
		}; 
		
		
		/** 
		public API
		*/
		
		/**
		* Callback from either "Reject" or "Accept" btn
		* Updates Patient. See Events.
		* @param {EventTarget} btn 
		*/
		const rejectPatient = ( btn ) => {
			// check which button by it's colour
			if( btn.classList.contains('red') ){
				// reject
				//showAsAccepted( false );
				activePatient.reject();
			} else {
				// re-accept
				//showAsAccepted( true );
				activePatient.accept();
			}
		};
		
		
		/**
		* Callback from "Overview" or "Manage Patient" buttons
		* This updates the sidebar UI
		* @param {String} view 
		*/
		const change = ( view ) => {
			if( view == "overview" ){
				bj.show( ui.view.overview );
				bj.hide( ui.view.patient );
				ui.btn.overview.classList.add('selected');
				ui.btn.patient.classList.remove('selected');
			} else {
				bj.hide( ui.view.overview );
				bj.show( ui.view.patient );
				ui.btn.overview.classList.remove('selected');
				ui.btn.patient.classList.add('selected');
			}
		};
		
		/**
		* Set up the Patient area in sidebar
		* Controller calls this with the selected 'Patient'
		* @param {Patient} custom Object. 
		*/
		const managePatient = ( patient ) => {
			// inactive last patient?
			if( activePatient !== null ) activePatient.inactive();
			
			ui.patient.fullName.innerHTML = `<span class="highlighter">${patient.fullName}</span>`;
			ui.patient.details.innerHTML = [
				`<small class="fade">NHS</small> ${patient.nhs}`,  
				`&nbsp;<small class="fade">Gen</small> ${patient.gender}`,
				`&nbsp;<small class="fade">Age</small> ${patient.age}`
			].join('');
			
			// show the <table> row info	
			ui.patient.group.textContent = patient.group;
			
			// show state
			ui.patient.risk.innerHTML = patient.risk;
			ui.patient.pathway.innerHTML = `<b>${patient.pathway}</b>`;
		
			// hacky demo of attachment
			ui.patient.attachment.style.display = patient.hasImage ? 'block' : 'none';
			
			//showAsAccepted( patient.accepted ); // ?
			
			patient.active();
			activePatient = patient;
		};
		
		/**
		* User can step through the patients from the sidebar
		*/
		const nextPatient = ( dir ) => {
			const patientKey = dir === "next" ?
				collection.next( activePatient.myKey ):
				collection.prev( activePatient.myKey );
				
			// if a key exists, show the patient data for it
			if( patientKey ){
				sidebar.managePatient( collection.get( patientKey ));
			}
		};

		// reveal the public methods
		return { 
			change, 
			managePatient, 
			nextPatient, 
			rejectPatient 
		};
		
	})();
	
	
	/**
	* Initise: setup the first patient by default
	*/
	document.addEventListener('DOMContentLoaded', () => {
		sidebar.managePatient( collection.getFirst() ); // default to first patient
		//sidebar.change('patient');
	}, { once: true });


	/**
	* Call back for <tr> edit icon
	* @param {Event} ev - use target to get the right Patient Key.
	*/
	const editPatient = ( ev ) => {
		let icon = ev.target; 
		let key = collection.getKey( icon );
		// view Patient and pass Patient
		sidebar.managePatient( collection.get( key ) );
		sidebar.change('patient');
	};
	
	/*
	* Events	
	*/
	bj.userDown('.js-edit-patient-icon', editPatient );	 // pencil icon on <tr>
	
	bj.userDown('#idg-js-sidebar-viewmode-1', () => sidebar.change('overview'));
	bj.userDown('#idg-js-sidebar-viewmode-2', () => sidebar.change('patient'));
	
	// navigating the patient list 
	bj.userDown('#side-patient-next-btn', () =>  sidebar.nextPatient("next"));
	bj.userDown('#side-patient-previous-btn', () => sidebar.nextPatient("prev"));
	
	// rejecting (or accepting) buttons
	bj.userDown('#sidebar-reject-accept button', ( ev ) => sidebar.rejectPatient( ev.target ));
	
	/**
	Allow users to use Keys to navigate the patient list
	*/
	document.addEventListener("keydown", ( ev ) => {
		ev.stopPropagation();
		if( ev.key === "z" ){
			sidebar.nextPatient("next");
		}
		if( ev.key === "a" ){
			sidebar.nextPatient("prev");
		}
	}, false );
	
	
})( bluejay ); 
(function( bj ){

	'use strict';
	
	if( document.querySelector('.js-event-date-change') === null ) return;
	
	const changeEventDate = ( ev ) => {
		let icon = ev.target;
		let input = ev.target.parentNode.querySelector('input');
		let text = ev.target.parentNode.querySelector('.js-event-date');
			
		icon.classList.add('disabled');
		bj.hide( text );
		bj.show( input );
		setTimeout(() => input.focus(), 20);
	};
	
	bj.userDown('.js-event-date-change > .rewind', changeEventDate ); 	
			
})( bluejay ); 
(function( bj ){

	'use strict';
	
	if( document.querySelector('.login.multisite') === null ) return;
	
	/*
	Quick little demo of the Multi-site login	
	*/
	
	let loginStep = 0;
	
	const institution = document.querySelector('.login-institution');
	const site = document.querySelector('.login-site');
	const loginDetails = document.querySelector('.login-details');
	const loginSteps = document.querySelector('.login-steps');
	const stepOptions = document.querySelector('ul.step-options');
	
	bj.hide( loginDetails );
	bj.hide( loginSteps );
	
	const userLogin = bj.div('user');
	userLogin.innerHTML = '<input type="text" placeholder="Username"><input type="password" placeholder="Password"><button class="green hint" id="js-login">Login</button>';
	
	const showLoginStep = ( step, text='' ) => {
		switch( step ){
			case 1:
				document.querySelector('.pre-id').remove();
				bj.show( loginDetails );
				bj.show( loginSteps );
				institution.innerHTML = '<small>Please select an institution</small>';
				site.textContent = '';
				stepOptions.innerHTML = Mustache.render('{{#options}}<li>{{.}}</li>{{/options}}', {
					options: ['Bolton','Cardiff and Vale University','East Kent Hospitals University','Guy\'s and St Thomas\'','Barking, Havering and Redbridge University Hospitals NHS Trust','Barnet, Enfield and Haringey Mental Health NHS Trust','Barnsley Hospital NHS Foundation Trust','Barts Health NHS Trust','Bedford Hospital NHS Trust','BEDFORDSHIRE HOSPITALS NHS FOUNDATION TRUST','Berkshire Healthcare NHS Foundation Trust','Birmingham and Solihull Mental Health NHS Foundation Trust','Birmingham Community Healthcare NHS Foundation Trust','Birmingham Women\'s and Children\'s NHS Foundation Trust','Black Country Healthcare NHS Foundation Trust','Blackpool Teaching Hospitals NHS Foundation Trust','Bolton NHS Foundation Trust','Bradford District NHS Foundation Trust','Bradford Teaching Hospitals NHS Foundation Trust','Bridgewater Community Healthcare NHS Foundation Trust','Brighton and Sussex University Hospitals NHS Trust','Buckinghamshire Healthcare NHS Trust','Burton Hospitals NHS Foundation Trust']	
				});	
			break;
			case 2:
				institution.innerHTML = `${text}<i class="oe-i remove-circle small-icon pad-left"></i>`;
				site.innerHTML = '<small>Please select a site</small>';
				stepOptions.innerHTML = Mustache.render('{{#options}}<li>{{.}}</li>{{/options}}', {
					options: ['Kings site','Queens site','Another site']	
				});	
			break;
			case 3:
				site.innerHTML = `${text}<i class="oe-i remove-circle small-icon pad-left"></i>`;
				loginSteps.parentNode.insertBefore( userLogin, loginSteps.nextSibling);
				loginSteps.remove();	
			break;
		}
	};	
	
	// init
	showLoginStep( loginStep );
	
	// demo click through
	bj.userDown('.step-options li', ( ev ) => {
		const li = ev.target;
		showLoginStep( ++loginStep, li.textContent );
	});
	
	bj.userDown('#js-user-email-id', () => showLoginStep( ++loginStep));
				
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	const demo = () => {
		const div = document.createElement('div');
		div.className = "oe-popup-wrap dark";
		document.body.appendChild( div );
		
		const template = [
			'<div class="oe-login timeout">',
			'<div class="login">',
			'<h1>Timed out</h1>',
			'<div class="login-details">',
			'<ul class="row-list">',
			'<li class="login-institution">Cardiff and Vale University</li>',
			'<li class="login-site">Queens site</li>',
			'</ul>',
		    '</div>',
			'<div class="user">',
			'<input type="text" placeholder="Username">',
			'<input type="password" placeholder="Password">',
			'<button class="green hint" id="js-login">Login</button>',
			'</div>',
			'<div class="info">',
			'You have been logged out for security reasons. Please login to continue',
			'</div>',
			'<div class="flex-c"><a href="/v3/login-multisite" class="button">Or exit to homepage</a></div>',
			'</div>',
			'</div>'].join('');
			
		div.innerHTML = Mustache.render( template, {} );
		
	};

	bluejay.demoLoginTimeOut = demo;	
			
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	*/
	
	// tr class hook: .js-idg-demo-13420;
	if(document.querySelector('.js-idg-demo-13420') === null) return;
	
	
	
	// state change is based on the prescribed toggle switch
	document.addEventListener('input',(ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-demo-13420 .toggle-switch input')){
			/*
			toggling the presciption: 
			ON: show 'Stop' / hide: Duration/dispense & taper
			*/
			let tr = uiApp.getParent(me, 'tr');
			let ongoingTxt = tr.querySelector('.js-idg-ongoing-text');
			let stopBtn = tr.querySelector('.js-idg-date-stop');
			let durDis = tr.querySelector('.js-idg-duration-dispense');
			let taperBtn = tr.querySelector('.js-idg-taper-btn');
			let reasons = tr.querySelector('.js-idg-stopped-reasons');
			
			if(me.checked){
				// on
				uiApp.hide(stopBtn);
				uiApp.hide(reasons);
				uiApp.show(ongoingTxt, 'block');
				uiApp.show(durDis, 'block');
				uiApp.show(taperBtn, 'block');	
			} else {
				// off
				uiApp.show(stopBtn, 'block');
				uiApp.hide(ongoingTxt);	
				uiApp.hide(durDis);
				uiApp.hide(taperBtn);
			}	
		}
	});
	
	const updateStopState = (td, stop) => {
		
		let stopBtn = td.querySelector('.js-idg-stop-btn');
		let stopDate = td.querySelector('.js-idg-stop-date');
		let reasons = td.querySelector('.js-idg-stopped-reasons');
		let cancelIcon = td.querySelector('.js-idg-cancel-stop');
		
		if(stop){
			uiApp.hide(stopBtn);
			uiApp.show(stopDate, 'block');
			uiApp.show(reasons, 'block');
			uiApp.show(cancelIcon, 'block');
		} else {
			uiApp.show(stopBtn, 'block');
			uiApp.hide(stopDate);
			uiApp.hide(reasons);
			uiApp.hide(cancelIcon);
		}
	};
	
	// 'stop' button
	document.addEventListener('click', (ev) => {
		if(ev.target.matches(".js-idg-stop-btn")){
			updateStopState( uiApp.getParent(ev.target, 'td'), true);
		}
	});
	
	// cancel 'stop'
	document.addEventListener('mousedown', (ev) => {
		if(ev.target.matches('.js-idg-cancel-stop')){
			updateStopState( uiApp.getParent(ev.target, 'td'), false);
		}
	});

	
	// Show history
	document.addEventListener('mousedown',(ev) => {
		let me = ev.target;
		if(me.matches('.js-show-medication-history')){
			let tableRows = document.querySelectorAll('.js-idg-medication-history-' + me.dataset.idgdemo);
			tableRows.forEach((row) => {
				if(row.style.visibility == "collapse"){
					row.style.visibility = "visible";
				} else {
					row.style.visibility = "collapse";
				}
				
			});
		}
	});
			
})(bluejay); 
(function( bj ) {

	'use strict';
	
	if( document.querySelector('.home-messages') === null ) return;
	
	const btn = {
		messages: document.getElementById('idg-js-sidebar-viewmode-1'),
		tags: document.getElementById('idg-js-sidebar-viewmode-2'),
	};
	
	const sidebar = {
		messages: document.querySelector('.sidebar-messages'),
		tags: document.querySelector('.sidebar-tags'),
	};
	
	const content = {
		messages: document.querySelector('.messages-all'),
		tags: document.querySelector('.tags-all'),
	};
	
	const showMessages = () => {
		if(btn.messages.classList.contains('selected')) return;
		btn.messages.classList.add('selected');
		btn.tags.classList.remove('selected');
		
		bj.show( sidebar.messages );
		bj.hide( sidebar.tags );
		bj.show( content.messages );
		bj.hide( content.tags );
		
	};
	
	const showTags = () => {
		if(btn.tags.classList.contains('selected')) return;
		btn.messages.classList.remove('selected');
		btn.tags.classList.add('selected');
		
		bj.hide( sidebar.messages );
		bj.show( sidebar.tags );
		bj.hide( content.messages );
		bj.show( content.tags );
	};
	
	
	bj.userDown('#idg-js-sidebar-viewmode-1', showMessages );
	bj.userDown('#idg-js-sidebar-viewmode-2', showTags ); 
			
})( bluejay ); 
(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	for Ophthalmic Diagnosis v2!
	*/
	
	if(document.querySelector('.js-idg-diagnosis-active-switcher') === null) return;
	
	/*
	Update VIEW states to demo UX
	*/
	const updateActiveState = (div, state) => {
		let text = div.querySelector('.js-idg-diagnosis-text');
		let toggle = div.querySelector('.toggle-switch');
		let remove = div.querySelector('.remove-circle');
		let btn = div.querySelector('.js-idg-diagnosis-add-btn');
		let doubt = div.querySelector('.js-idg-diagnosis-doubt');
		let doubtInput = div.querySelector('.js-idg-diagnosis-doubt-input');
		
		let side = div.dataset.idgside;
		let eyelatIcon = div.parentNode.previousElementSibling.querySelector('.oe-eye-lat-icons .oe-i');
		
		let date = div.parentNode.nextElementSibling.querySelector('.js-idg-diagnosis-date');	
				
		switch(state){
			case 'active':
			uiApp.reshow(text);
			uiApp.reshow(toggle);
			uiApp.reshow(doubt);
			uiApp.hide(remove);
			uiApp.hide(btn);
			uiApp.reshow(date);
			text.textContent = 'Active (confirmed)';
			text.classList.remove('fade');
			doubt.querySelector('input').checked = false;
			toggle.querySelector('input').checked = true;
			setEyeLatIcon(eyelatIcon, side, 'active');
			break;
			
			case 'confirmed':
			uiApp.hide(doubtInput);
			uiApp.reshow(text);
			break;
			
			case 'doubt':
			uiApp.reshow(doubtInput);
			uiApp.hide(text);
			break;
			
			case 'inactive':
			uiApp.reshow(text);
			uiApp.reshow(toggle);
			uiApp.reshow(remove);
			uiApp.hide(btn);
			uiApp.hide(doubt);
			uiApp.hide(doubtInput);
			uiApp.reshow(date);
			text.textContent = 'Inactive from';
			text.classList.add('fade');
			setEyeLatIcon(eyelatIcon, side, 'inactive');
			break;
			
			case 'removed':
			uiApp.hide(toggle);
			uiApp.hide(remove);
			uiApp.reshow(btn);
			uiApp.hide(date);
			text.textContent = 'Not present';
			setEyeLatIcon(eyelatIcon, side, 'none');
			break; 
		}
	};
	
	const setEyeLatIcon = (i, side, state) => {
		/*
		oe-i laterality L small pad
		oe-i laterality NA small pad	
		*/
		if(i === null) return;
		
		let css = ['oe-i'];
		let eye = side == 'left' ? 'L' : 'R';
		
		switch(state){
			case 'active':
			css.push('laterality', eye);
			break;
			case 'inactive':
			css.push('laterality', eye+'i');
			break;
			case 'none':
			css.push('laterality', 'NA');
			break;
		}
		
		css.push('small', 'pad');
		
		i.className = css.join(' ');
	};
	
	
	// store the default <td> 
	let tdDefault = null;
	
	let td1 = '<span class="oe-eye-lat-icons"><i class="oe-i laterality NA small pad"></i></span>';
	let td2 = '<div class="flex-layout cols-11 js-idg-diagnosis-active-switcher" data-idgdemo="-r-nSysEx2" data-idgside="right"><div class="js-idg-diagnosis-actions"><label class="toggle-switch" style="display: none;"><input type="checkbox"><div class="toggle-btn"></div></label><label class="inline highlight js-idg-diagnosis-doubt" style="display: none;"><input value="diagnosis-doubt" name="idg-4131" type="checkbox"> <i class="oe-i doubt small-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="? = doubts; suspected, etc"></i></label><i class="oe-i remove-circle small-icon pad-left" style="display: none;"></i><button class="js-idg-diagnosis-add-btn ">Add right side</button></div><div class="js-idg-diagnosis-state"><input class="js-idg-diagnosis-doubt-input" value="Suspected" placeholder="Suspected" maxlength="32" style="display: none;"><span class="js-idg-diagnosis-text js-active-state fade ">Not present</span></div></div>';
	let td3 = '<div class="js-idg-diagnosis-date"><input type="text" class="date" value="30 Apr 2020"></div>';
	//td3.className = 'valign-top';
	
	
	const updateSystemic = (tr, num) => {
		
		let sidesCheck = tr.querySelector('.js-idg-sides');
		let text = tr.querySelector('.js-idg-diagnosis-text');
		
		let div = tr.querySelector('.js-idg-diagnosis-active-switcher');
		let toggle = div.querySelector('.toggle-switch');
		let doubt = div.querySelector('.js-idg-diagnosis-doubt');
		let doubtInput = div.querySelector('.js-idg-diagnosis-doubt-input');
		
		let systemicIcons = tr.querySelector('.js-idg-right-icon .oe-systemic-icons');


		if(tdDefault == null){
			tdDefault = tr.querySelector('.js-idg-diagnosis-state-options').innerHTML;
			uiApp.reshow(text);
		}

		
		switch(num){
			case '0':
				uiApp.reshow(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Active (confirmed)';
				text.classList.remove('fade');
				uiApp.reshow(toggle);
				toggle.querySelector('input').checked = true;
				uiApp.reshow(doubt);
				doubt.querySelector('input').checked = false;
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i person-green small pad";
				
				
			break;
			
			case '1':
				uiApp.hide(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Not present';
				text.classList.add('fade');
				uiApp.hide(toggle);
				uiApp.reshow(doubt);
				doubt.querySelector('input').checked = false;
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i NA small pad";
			break;
			
			case '2':
				uiApp.hide(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Not checked';
				text.classList.add('fade');
				uiApp.hide(toggle);
				uiApp.hide(doubt);
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i NA small pad";
			break;
		}
	};
	
	const systemicSidesChange = (tr, val) => {
		let td = tr.querySelector('.js-idg-diagnosis-state-options');
		let systemicIcons = tr.querySelector('.js-idg-right-icon .oe-systemic-icons');
		let eyeLatIcons = tr.querySelector('.js-idg-right-icon .oe-eye-lat-icons .oe-i');
	
		
		if(val){
			// show sides
			td.innerHTML = td1;
			td.colSpan = 0;
			let newCell1 = tr.insertCell(2);
			let newCell2 = tr.insertCell(3);
			newCell1.innerHTML = td2;
			newCell2.innerHTML = td3;	
			
			uiApp.hide(tr.cells[5].querySelector('.toggle-switch'));
			uiApp.hide(tr.cells[5].querySelector('.highlight'));
		
			if(tr.cells[5].querySelector('.js-idg-diagnosis-actions .js-idg-diagnosis-add-btn') === null){
				let btn = document.createElement('button');
				btn.className = "js-idg-diagnosis-add-btn";
				btn.textContent = "Add left side";
				tr.cells[5].querySelector('.js-idg-diagnosis-actions').appendChild(btn);
			} else {
				uiApp.reshow(tr.cells[5].querySelector('.js-idg-diagnosis-add-btn'));
			}
			
			let text = tr.cells[5].querySelector('.js-idg-diagnosis-text');
			text.textContent = 'Inactive from';
			text.classList.add('fade');
			
			systemicIcons.style.display = "none";
			eyeLatIcons.style.display = "inline-block";
			
		} else {
			// no sides
			tr.deleteCell(2);
			tr.deleteCell(2); // was 3, now 2!
			td.innerHTML = tdDefault;
			td.colSpan = 3;
			
			uiApp.hide(tr.cells[3].querySelector('.js-idg-diagnosis-add-btn'));
			uiApp.reshow(tr.cells[3].querySelector('.toggle-switch'));
			tr.cells[3].querySelector('.toggle-switch').checked = true;
			uiApp.reshow(tr.cells[3].querySelector('.highlight'));
			
			td.querySelector('input').checked = true;
			
			systemicIcons.style.display = "inline-block";
			eyeLatIcons.style.display = "none";
		}		
	};

	const showAuditHistory = (id) => {
		let tableRows = document.querySelectorAll('.js-idg-diagnosis-history-' + id);
		tableRows.forEach((row) => {
			// toggle the audit rows
			if(row.style.visibility == "collapse"){
				row.style.visibility = "visible";
			} else {
				row.style.visibility = "collapse";
			}
		});
	};
	

	// Active Switcher
	document.addEventListener('input',(ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-diagnosis-active-switcher .toggle-switch input')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, (me.checked ? 'active' : 'inactive'));		
		}
		
		if(me.matches('.js-idg-diagnosis-doubt input')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, (me.checked ? 'doubt' : 'confirmed'));
		}
		
		// demo the Present, Not Present and Not checked raido
		if(me.matches('.js-idg-demo-sys-diag-side-switcher .js-idg-diagnosis-state-options input')){
			let parent = uiApp.getParent(me, '.js-idg-demo-sys-diag-side-switcher');
			updateSystemic(parent, me.value);
		}
		
	});
	
	document.addEventListener('click', (ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-demo-sys-diag-side-switcher .js-idg-sides')){
			let parent = uiApp.getParent(me, '.js-idg-demo-sys-diag-side-switcher');
			let icon = me.querySelector('.oe-i');
			if(me.dataset.state == "no-sides"){
				systemicSidesChange(parent, true);
				me.dataset.state = "sides";
				icon.classList.replace("person", "person-split");
			} else {
				systemicSidesChange(parent, false);
				me.dataset.state = "no-sides";
				icon.classList.replace("person-split", "person");
			}
		}
	});
	
	document.addEventListener('mousedown',(ev) => {
		let me = ev.target;
		
		// show
		if(me.matches('.js-show-diagnosis-history')){
			showAuditHistory(me.dataset.idgdemo);
		}
		
		if(me.matches('.js-idg-diagnosis-active-switcher .remove-circle')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, 'removed');
		}
		
		if(me.matches('.js-idg-diagnosis-add-btn')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, 'active');
		}

	});
	
	const showDeletePopup = (ev) => {
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/specific/exam-oph-diag-delete.php')
			.then( xreq => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = xreq.html;
				div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
					ev.stopPropagation();
					uiApp.remove(div);
				}, {once:true} );
				
				// reflow DOM
				document.body.appendChild( div );
			})
			.catch( e => console.log('failed to copy',e));  // maybe output this to UI at somepoint, but for now... 
	};

	uiApp.userDown('.js-idg-demo-remove-oph-diag', showDeletePopup);
	
	
			
})(bluejay); 
(function( bj ) {

	'use strict';
	
	const listManager = document.getElementById('js-worklist-manager');

	if( listManager === null ) return;
	
	return;
	
	/*
	List mode: button names: "all" / "single" / "multi"
	iDG will set up a default state	
	*/
	const allBtn = listManager.querySelector('button[name=all]');
	const checkBoxes = bj.nodeArray( listManager.querySelectorAll('input[type=checkbox]'));
	
	// work out the mode from the default selected button
	// "All" or "Favourites"
	let mode = listManager.querySelector('button.selected').name;
	
	// User changes mode
	const changeMode = ( btnTarget ) => {
		modeBtns.forEach( btn => {
			if( btn == btnTarget ){
				btn.className = "selected";
				mode = btn.name; 
			} else {
				btn.className = "";
			}
		});
		
		// set up all the list states based on the mode selection
		checkBoxes.forEach( input => {
			input.checked = mode === "all" ? true : false;
		});
	};
	
	const userSelectsList = ( inputTarget ) => {
		if( mode == "single"){
			// make it like a radio
			checkBoxes.forEach( input => {
				if( input !== inputTarget ) input.checked = false;
			});
		}
		if( mode == "all"){
			modeBtns[0].className = "";
			modeBtns[2].className = "selected";
		}
	};
	
	// list to the input checkboxes (only thing that changes)
	listManager.addEventListener('change', ev => {
		userSelectsList( ev.target );
	});
	

	bj.userDown('div.list-mode button', ev => {
		changeMode( ev.target );
	});
	
	
})( bluejay ); 
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