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
	const resize = new Set(); // no selectors to match too.

	/**
	* Register a Module callback with an Event
	* @param {May} map - for each EventListener
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = ( map, selector, cb ) => {
		
		if( map.has(selector)){
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

	// extend App
	bj.extend('userEnter', ( selector, cb ) => addListener( mouseEnter, selector, cb ));
	bj.extend('userDown', ( selector, cb ) => addListener( mouseDown, selector, cb ));
	bj.extend('userLeave', ( selector, cb ) => addListener( mouseLeave, selector, cb ));
	
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
/**
* Using "oePloyly" as namespace
* @namespace
*/
const oePlotly = (function ( bj ) {

	'use strict';
	
	bj.log('Plot.ly version: ' + Plotly.version );
	bj.log('oePlotly - Plot.ly builder available');
	
	const colours = {
		dark: {
			blue:'#63d7d6',
			highlight:'#fff',
			green: '#65d235',
			red: '#ea2b34',
			greenSeries: ['#65d235', '#A5D712','#02B546'],
			redSeries: ['#ea2b34','#F64A2D','#C92845'],
			yellowSeries: ['#FAD94B','#E8B131','#F1F555'], // BEO
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
	const getBlue = ( dark ) => {
		return dark ? colours.dark.blue : colours.light.blue ;
	};
	
	/**
	* Get color series
	* @param {String} colour name
	* @param {Boolean} darkTheme 
	* @returns {Array} of colour series
	*/
	const getColorSeries = ( colorName, darkTheme ) => {
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
	const getColor = ( colour, dark ) => {
		switch( colour ){
			case 'highlight': return dark ? colours.dark.highlight : colours.light.highlight; 
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			//case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Can not just set layout to dark theme bases on oeTheme setting
	* layout may be used in "pro" area (such as patient popup)
	* @returns {Boolean}
	*/
	const isDarkTheme = () => {
		return window.oeThemeMode === "dark" ? true : false;	
	};
	
	// public 
	return {
		isDarkTheme,
		getBlue,
		getColorSeries, 
		getColor
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
	oePlotly.getAxis = function( options, dark ){ 
		
		// default 
		let axis = {
			linecolor: dark ? '#666' : '#999', // axis line colour
			linewidth:1,
			showgrid: true,
			gridcolor: dark ? '#292929' : '#e6e6e6',
			tickmode: "auto",
			nticks: 20, // number of ticks
			ticks: "outside",
			ticklen: 3, // px
			tickcolor: dark ? '#666' : '#ccc',
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
		if( options.numTicks ){
			axis.nticks = options.numTicks;
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
			// categories on yaxis start at 0, add a blank to push up
			axis.categoryarray = [' '].concat( arr );
			// show all categories?
			if( options.useCategories.showAll ) axis.range = [0, arr.length + 1];
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
	
	
})( oePlotly );
(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build Plotly layout: colours and layout based on theme and standardised settings
	* @param {Object} options - quick reminder of 'options':
	* @returns {Object} layout themed for Plot.ly
	*
	Options:
	{
		darkTheme: "dark",  	// Required {Boolean} oePlotly Theme  
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
	oePlotly.getLayout = function( options ){
		// set up layout colours based on OE theme settings: "dark" or "light"
		const dark = options.darkTheme;
		
		// build the Plotly layout obj
		let layout = {
			isDark: dark, // store OE dark theme in layout
			hovermode:'closest', // get single point rather than all of them
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
				bordercolor: dark ? '#003' : '#00f',
				font: {
					size: 11, // override base font
					color: oePlotly.getBlue( dark ),
				}
			},
		};
	
		/*
		Colour theme	
		*/ 
		if( options.colors ){
			layout.colorway = oePlotly.getColorSeries( options.colors, dark );			
		} else {
			layout.colorway = oePlotly.getColorSeries( "default", dark );
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
		Shapes and Annotations
		*/
		layout.shapes = [];
		layout.annotations = [];
		
		/*
		Vertical marker line
		{array} = [{x:x, y:1, name:"name"}]
		*/
		if( options.vLineLabel ){
			
			// vLineLabel must be an array of objects
			const verticals = options.vLineLabel.x;
			const height = options.vLineLabel.h;
		
			const line = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'above', // or "below"
			      yref: 'paper', // this means y & y0 are ratios of area (paper)
			      x0: my.x,
			      y0: 0,
			      x1: my.x,
			      y1: height,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 0.5,
					//dash:"3px,4px,1px,4px,3px,1px",
			      }
			    };
			}; 
			
			const annotate = ( my, index ) => {
				return {
				   showarrow: false,
				   text: my.name,
				   textangle: 90,
				   align: "left",
				   font: {
					   color: oePlotly.getBlue( dark )
				   },
				   borderpad: 2,
				   x: my.x,
				   xshift: 8, // shift over so label isnt' on line? 
				   yref: "paper", // this means y is ratio of area (paper)
				   y: height 
			    };
			}; 
			
			// Add verticals
			layout.shapes = layout.shapes.concat( verticals.map( line ));
		    layout.annotations = layout.annotations.concat( verticals.map( annotate ));
		}
		
		/*
		Horizontal marker line
		{array} = [{ axis:'y3', y:15, name: "Target IOP"}]
		*/
		if( options.hLineLabel ){
			
			// hLineLabel must be an array of objects
			const horizontals = options.hLineLabel.y;
			const axis = options.hLineLabel.axis;
			
			// expecting an array of objects here
			const line = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'below', // or "below"
			      xref: "paper", // this means x & x0 are ratios of area (paper)
			      yref: axis, // assign to a yaxis
			      x0: 0,
			      y0: my.y,
			      x1: 1,
			      y1: my.y,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 2,
			        dash:"3px,12px",
			      }
			    };
			}; 
			const annotate = ( my, index ) => {
				return {
				   showarrow: false,
				   text: my.name,
				   align: "left",
				   font: {
					   color: oePlotly.getBlue( dark )
				   },
				   borderpad: 2,
				   xref: "paper",
				   x:0,
				   yshift: 8, // shift over so label isnt' too close to the axis 
				   yref: axis, // this means y is ratio of area (paper)
				   y: my.y 
			    };
			}; 
			
			// Add horizontals
			layout.shapes = layout.shapes.concat( horizontals.map( line ));
		    layout.annotations = layout.annotations.concat( horizontals.map( annotate ));
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
			}, oePlotly.buttonStyling( dark ) );
		}
		
		// ok, all done
		return layout;
	};
	
	
})( oePlotly );
(function( oePlotly, bj ) {
	
	'use strict';
	
	/**
	* Build DIV
	* @param {String} id
	* @param {String} height (80vh)
	* @param {String} min-height (500px)
	* @returns {Element}
	*/
	oePlotly.buildDiv = ( id, height, minHeight, width=false ) => {
		const div = document.createElement('div');
		/*
		ID is just a regular string (Template type)
		*/
		let divID = id.toLowerCase();
		divID = divID.trim();
		divID = divID.replace(' ','-');
		// build <div>
		div.id = `oePlotly-${divID}`;
		div.style.height = height;
		div.style.minHeight = minHeight;
		
		if( width ){
			// sometimes need this to force plotly to layout it's SVG container at the right width
			div.style.width = width;
		}
		
		
		return div;
	};
	
	/**
	* For use in layout templates
	* Helper to work out first and last dates
	* @returns {Object} 
	*/
	oePlotly.fullDateRange = () => ({
		all:[], 
		add( xArr ){
			this.all = this.all.concat( xArr );
			this.all.sort();
		}, 
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
	oePlotly.addClickEvent = ( div, eye ) => {
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
					
		    bj.customEvent('oePlotlyClick', obj );
		    bj.log('"oePlotlyClick" Event data: ' + JSON.stringify( obj ));
		}));
	};
	
	/**
	* Hover events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/
	oePlotly.addHoverEvent = ( div, eye ) => {
		bj.log('"oePlotlyHover" ('+eye+') Event available (click point to see data structure)');
		
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
					
		    bj.customEvent('oePlotlyHover', obj );
		}));
	};
	
	
	/**
	* return setting for line in data
	* when multiple Eye data traces are added 
	* to a single plot they need to style themselves
	* @params {Object} args
	* @returns {Object} 'line'
	*/
	oePlotly.dataLine = ( args ) => {
		let line = {};
		if( args.color )	line.color = args.color;
		if( args.dashed )	line = Object.assign( line, oePlotly.dashedLine());
		return line;
	};
	
	/**
	* return settings for dashed "line" style in data
	* @returns {Object}
	*/
	oePlotly.dashedLine = () => {
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
	oePlotly.markerFor = ( type ) => {
		const marker = {};
		
		switch( type){
			case 'image':
				marker.symbol = "triangle-down";
				marker.size = 10;
			break;
			case 'drug':
				marker.symbol = "diamond";
				marker.size = 8;
			break;
			case 'injection':
				marker.symbol = "star-diamond";
				marker.size = 9;
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
	oePlotly.eventStyle = ( type, color=false ) => {
		const style = {
			marker: oePlotly.markerFor( type )
		};
		
		switch( type ){
			case 'image':
				style.mode = "markers";
			break;
			case 'drug':
				style.mode = "lines+markers";
				style.line = {
					width: 3,
				};
			break;
			case 'injection':
				style.mode = "markers";
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
	oePlotly.buttonStyling = ( dark ) => ({
		font: {
			color: dark ? '#ccc' : '#666',
		},
		bgcolor: dark ? 'rgb(30,46,66)' : 'rgb(255,255,255)', 
		activecolor: dark ? 'rgb(7,69,152)' : 'rgb(205,205,255)',
		bordercolor: dark ? 'rgb(10,26,36))' : 'rgb(255,255,255)',
		borderwidth: 2,
	}); 
	

	/**
	* Add Plotly dropdown to layouta
	* @param {Objec} layout
	*/
	oePlotly.addDropDown = ( layout ) => {
	
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
			    colorway: oePlotly.getColorSeries( "default", true )
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
 		}, oePlotly.buttonStyling() );
 		
		
		// could be multiple menus
		layout.updatemenus = [ menu ];	
	};

	
})( oePlotly, bluejay );
(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Init with template layout properties
	*/
	oePlotly.highlighPoint = ( myPlotly, darkTheme ) => {
		
		/**
		* External API 
		* (note: used as a callback by selectableUnits)
		* @param {String} flattened objects e.g 'leftEye.OCT'
		* @param {Number} index of point
		*/
		return ( flattenedObj, indexPoint ) => {
			
			// find trace obj from flattened Object path
			let objPath = flattenedObj.split('.');
			
			if(objPath.length != 2){
				bj.log('oePlotly - for highlightPoint to work it needs EyeSide & Date JSON name e.g. "leftEye.OCT" ');
				return;
			}
			
			let eyeSide = objPath[0];
			let dataTraceName = objPath[1];
			let traceData, traceIndex;
			let i = 0;
			/*
			Have to loop through because i need an index ref to the array 
			passed in when Plotly is built: see plotlyReacts below
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
			1) create an array of colors for ALL marks in trace in default eye colour
			2) set specific marker colour to blue
			3) relayout	
			*/
			let eyeColor = oePlotly.getColor( eyeSide, darkTheme );
			let markerColors = [];
			for( let i=0; i < traceData.x.length; i++ ){
				markerColors.push( eyeColor );
			}
			// set specific marker to blue
			markerColors[ indexPoint ] = oePlotly.getColor( 'highlight', darkTheme );
			
			// get marker style for event type 
			let markerObj = oePlotly.markerFor( traceData.oeEventType ); // added on creation of trace
			// add colors
			markerObj.color = markerColors;
			
			/**
			* Update Plotly 
			*/
			Plotly.restyle( myPlotly.get( eyeSide ).get('div'), { 'marker': markerObj }, [ traceIndex ]);	
		};
	};
	
})( oePlotly );
(function( oePlotly ) {
	
	'use strict';
	
	oePlotly.selectableUnits = () => {
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
				'VA Scale ',
				'<select>',
				'{{#options}}',
				'<option>{{.}}</option>',
				'{{/options}}',
				'</select>'
			].join('');
		
			// build layout DOM
			const div = document.createElement('div');
			div.className = 'oesplotly-options'; // newblue provides styling for this class (but not positioning)
			div.innerHTML = Mustache.render( template, { 'options' : options });
			div.style.position = 'absolute';
			div.style.top = '1px';
			div.style.left = '50%';
			div.style.transform = 'translateX( -50% )';
			div.style.zIndex = 1;
			
			/*
			I think this is only used in OESscape so dump in 'oes-v2'
			note: if dropdown is for a single layout maybe use Plotly internal dropdown? 
			*/
			const oesV2 = document.querySelector('.oes-v2');
			oesV2.style.position = 'relative';
			oesV2.appendChild( div );
			
			
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
				axes.push( oePlotly.getAxis( newAxis, dark ));
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
	
		
})( oePlotly );
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Bar Chart";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();

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
		
		const layout = oePlotly.getLayout({
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 20,
		}, darkTheme );
		
		// y1
		const y1 = oePlotly.getAxis({
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
	
		
})( bluejay ); 
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Bar Percent Complete";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();

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
		
		const layout = oePlotly.getLayout({
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 20,
		}, darkTheme );
		
		
		// y1
		const y1 = oePlotly.getAxis({
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
	
		
})( bluejay ); 
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Combined Medical Retina"; // used in ID for div
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	/**
	* Helpers
	*/
	const dateRange = oePlotly.fullDateRange();
	const userSelecterUnits = oePlotly.selectableUnits();
	
	
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
			line: oePlotly.dataLine({
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
			line: oePlotly.dataLine({
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
				line: oePlotly.dataLine({
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

		const layout = oePlotly.getLayout({
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
		
		
		const div = oePlotly.buildDiv(`${oesTemplateType}`, '80vh', '650px');
		document.querySelector( '.oes-left-side' ).appendChild( div );
		
		/**
		Comnbined data plots, therefore only 1 <div> and only 1 'layout'
		*/
		myPlotly.set('div', div);
		myPlotly.set('layout', layout);
		
		// build
		plotlyReacts();
		
		// set up click through
		oePlotly.addClickEvent( div, '?' );
		oePlotly.addHoverEvent( div, '?' );
		
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
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
				oePlotly.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlotly.getColorSeries('leftEyeSeries', darkTheme)
			);
		}
		
		if( json.BEO ){
			myPlotly.set('BEO', new Map());
			buildDataTraces( json.BEO, 'BEO', 
				oePlotly.getColorSeries('BEOSeries', darkTheme)
			);
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			range: dateRange.firstLast(), 
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
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
		
})( bluejay ); 
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Glaucoma";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	/**
	* Helpers
	*/
	const dateRange = oePlotly.fullDateRange();
	const userSelecterUnits = oePlotly.selectableUnits();
	
	// add API:
	const highlightPoint = oePlotly.highlighPoint( myPlotly, darkTheme );
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye'
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide ) => {
		
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
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.VA.offScale.name, VA_offScale);
		dateRange.add( eyeJSON.VA.offScale.x );
		
		const VFI = {
			x: eyeJSON.VFI.x,
			y: eyeJSON.VFI.y,
			name: eyeJSON.VFI.name,	
			yaxis: 'y5',	
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.VFI.name, VFI);
		dateRange.add( eyeJSON.VFI.x );
		
		const IOP = {
			x: eyeJSON.IOP.x,
			y: eyeJSON.IOP.y,
			name: eyeJSON.IOP.name,		
			yaxis: 'y3',
			hovertemplate: 'IOP: %{y}<br>%{x}',	
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.IOP.name, IOP);
		dateRange.add( eyeJSON.IOP.x );
		
		/**
		* User selectable VA data traces
		*/
		Object.values( eyeJSON.VA.units ).forEach(( unit, index ) => {
			
			userSelecterUnits.addTrace( eyeSide, {
				x: unit.x,
				y: unit.y,
				name: unit.name,	
				yaxis: 'y2',	
				hovertemplate: unit.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
			});
			
			// only need to check one of these dates
			if( !index ) dateRange.add( unit.x );  
		});
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', userSelecterUnits.selectedTrace( eyeSide ));
		
		/**
		* Events
		*/
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			let template = event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}';
			
			let newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
					hovertemplate: template,
					type: 'scatter',
					showlegend: false,
				}, oePlotly.eventStyle(  event.event ));
			
			myPlotly.get( eyeSide ).get('data').set( event.name, newEvent);
			dateRange.add( event.x );
		});		
	};
		
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide );
		
		/*
		Update user selected units for VA
		*/
		eyePlot.get('data').set('VA', userSelecterUnits.selectedTrace( eyeSide ));
		eyePlot.get('layout').yaxis2 = Object.assign({}, userSelecterUnits.selectedAxis());
		
		// get Data Array of all traces
		const data = Array.from( eyePlot.get('data').values());

		// build new (or rebuild)
		Plotly.react(
			eyePlot.get('div'), 
			data, 
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const eyeSide = setup.eyeSide;
		
		const layout = oePlotly.getLayout({
			darkTheme, // dark? 
			legend: {
				traceorder: "reversed",
				yanchor:'bottom',
				y:0.82,
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 4,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			vLineLabel: {
				x: Object.values( setup.procedures ),
				h: 0.82,
			},
			hLineLabel: {
				y: Object.values( setup.targetIOP ),
				axis: 'y3'
			}
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${eyeSide}`, '80vh', '850px');
		document.querySelector( setup.parentDOM ).appendChild( div );
	
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
	
		// add events
		oePlotly.addClickEvent( div, eyeSide );
		oePlotly.addHoverEvent( div, eyeSide );
		
		// bluejay custom event (user changes layout ratio)
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}

		// for all subplot rows
		const domainRow = [
			[0, 0.08],
			[0.1, 0.45],
			[0.47, 0.82],
			[0.88, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			darkTheme,
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
				domain: domainRow[1],
				title: 'VA',  // prefix for title
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges ),
		});
		
		/**
		* Data 
		*/
		
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye' );
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye' );
		}
	
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true, 
			spikes: true,
			range: dateRange.firstLast(),
			noMirrorLines: true,
		}, darkTheme );
		
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y2 - IOP
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[2],
			title: 'IOP', 
			range: [0, 75],
			spikes: true,
		}, darkTheme );
		
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[3],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y4 - VFI
		const y4 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'VFI',
			range: [-30, 5],
			rightSide: 'y2',
			spikes: true,
		}, darkTheme );
		
		/*
		* Dynamic axis
		* VA axis depends on selected unit state
		*/
		const y1 = userSelecterUnits.selectedAxis();
		
		/**
		* Layout & Build - Eyes
		*/	
		if( myPlotly.has('rightEye') ){
			
			plotlyInit({
				title: "Right Eye",
				eyeSide: 'rightEye',
				colors: "rightEyeSeries",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3, y4 ],
				procedures: json.rightEye.procedures,
				targetIOP: json.rightEye.targetIOP,
				parentDOM: json.rightEye.dom,
			});
		} 
	
		if( myPlotly.has('leftEye') ){
			
			plotlyInit({
				title: "Left Eye",
				eyeSide: 'leftEye',
				colors: "leftEyeSeries",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3, y4 ],
				procedures: json.leftEye.procedures,
				targetIOP: json.leftEye.targetIOP,
				parentDOM: json.leftEye.dom,
			});
		}
		
		/**
		API OCT image stack is controlled externally
		but allow it to update the related marker
		*/
		
		bj.log('[oePlotly] - method: highlightPoint()');
		
		return { highlightPoint: highlightPoint };
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotSummaryGlaucoma', init);	
	
	
})( bluejay ); 
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Medical Retina";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	/**
	* Helpers
	*/
	const dateRange = oePlotly.fullDateRange();
	const userSelecterUnits = oePlotly.selectableUnits();
	
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye'
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide  ) => {
		
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
			line: oePlotly.dashedLine(),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);
		dateRange.add( eyeJSON.CRT.x );
		
		/**
		* User selectable VA data traces
		*/
		Object.values( eyeJSON.VA.units ).forEach(( unit, index ) => {
			
			userSelecterUnits.addTrace( eyeSide, {
				x: unit.x,
				y: unit.y,
				name: unit.name,	
				yaxis: 'y3',	
				hovertemplate: unit.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
			});
			
			// only need to check one of these dates
			if( !index ) dateRange.add( unit.x );
		});
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', userSelecterUnits.selectedTrace( eyeSide ));
		
		/**
		Build Events data for right eye
		*/
		// loop through array...
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			let template = event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}';
			
			let newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
					hovertemplate: template,
					type: 'scatter',
					showlegend: false,
				}, oePlotly.eventStyle(  event.event ));
			
			myPlotly.get( eyeSide ).get('data').set( event.name, newEvent);
			dateRange.add( event.x );
		});
	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide );
		
		/*
		Update user selected units for VA
		*/
		eyePlot.get('data').set('VA', userSelecterUnits.selectedTrace( eyeSide ));
		eyePlot.get('layout').yaxis3 = Object.assign({}, userSelecterUnits.selectedAxis());
		
		// get Data Array of all traces
		const data = Array.from( eyePlot.get('data').values());

		// build new (or rebuild)
		Plotly.react(
			eyePlot.get('div'), 
			data, 
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const eyeSide = setup.eyeSide;
		
		const layout = oePlotly.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'bottom',
				y:0.82,
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 3,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${eyeSide}`, '80vh', '650px');
		document.querySelector( setup.parentDOM ).appendChild( div );
		
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
		
		// set up click through
		oePlotly.addClickEvent( div, setup.eye );
		oePlotly.addHoverEvent( div, eyeSide );
		
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}
		

		// for all subplot rows
		const domainRow = [
			[0, 0.15],
			[0.2, 0.82],
			[0.88, 1],
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
		*/
	
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye' );
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye' );
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			range: dateRange.firstLast(), 
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650], // hard coded range
			spikes: true,
		}, darkTheme );
		

		// y3 - Events
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[2],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		/*
		* Dynamic axis
		* VA axis depends on selected unit state
		*/
		const y2 = userSelecterUnits.selectedAxis();
		
		/**
		* Layout & Build  - Eyes
		*/	
		if( myPlotly.has('rightEye') ){
			
			plotlyInit({
				title: "Right Eye",
				eyeSide: "rightEye",
				colors: "rightEyeSeries",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3 ],
				parentDOM: '.oes-left-side',
			});	
		} 
		
		if( myPlotly.has('leftEye') ){
			
			plotlyInit({
				title: "Left Eye",
				eyeSide: "leftEye",
				colors: "leftEyeSeries",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3 ],
				parentDOM: '.oes-right-side',
			});			
		}
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotSummaryMedicalRetina', init);	
		
})( bluejay ); 
(function ( bj ) {

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
			line: oePlotly.dataLine({
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
			line: oePlotly.dataLine({
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
			line: oePlotly.dataLine({
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

		const layout = oePlotly.getLayout({
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
		const div = oePlotly.buildDiv(`${oesTemplateType}`, '415px', '415px', '1020px'); // 1020px best guess based on 1280px layout
		document.getElementById('patient-popup-oeplolty').appendChild( div );
		
		/**
		Comnbined data plots, therefore only 1 <div> and only 1 'layout'
		*/
		myPlotly.set('div', div);
		myPlotly.set('layout', layout);
		
		// build
		plotlyReacts();
		
		// set up click through
		oePlotly.addClickEvent( div, '?' );
		oePlotly.addHoverEvent( div, '?' );
		
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
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
				oePlotly.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlotly.getColorSeries('leftEyeSeries', darkTheme)
			);
		}
		

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650], // hard coded range
			spikes: true,
		}, darkTheme );
		
		// y2 - VA
		const y2 = oePlotly.getAxis({
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
		
})( bluejay ); 
(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Outcomes with Error bars";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();

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
		
		const layout = oePlotly.getLayout({
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			title: 'Weeks',
			numTicks: 20,
			range: [-20, 220],
		}, darkTheme );
		
		
		// y1
		const y1 = oePlotly.getAxis({
			type:'y', 
			title: 'VA (change) from baseline (LogMAR)',
			range: [70, 110],
			numTicks: 20,
		}, darkTheme );
		
		// y2
		const y2 = oePlotly.getAxis({
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
		elem.style.cursor = "pointer";	
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
		div.className = "oe-tooltip fade-out";
		div.innerHTML = 'Copied';
		div.style.width = '80px'; // overide the newblue CSS
		div.style.top = ( top - tipHeight )+ 'px';
		div.style.left = ( center - 40 ) + 'px';
		bj.appendTo('body', div);
		
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
	This MUST match the array used in PHP.
	*/
	const pathways = ['DRSS', 'Cataract', 'Glaucoma', 'Uveitis', 'Lucentis', 'Glaucoma ODTC', 'Laser/YAG', 'General', 'Ocular Motility', 'Oculoplastic', 'Neuro', 'Botox', 'Corneal', 'VR', 'Paediatric Ophthalmology', 'Paediatric Neuro-Ophthalmology'];
	
	/**
	* Get pathway index from Name
	* @param {String} Pathway
	* @returns {Number} index
	*/
	const getPathywayNum = ( str ) => {
		let pathIndex = 99; // 99 = None 
		pathways.forEach(( path, index ) => {
			if( str == path ) pathIndex = index;
		});
		
		return pathIndex; 
	};
	
	/**
	* Work out Risk number from CSS icon class
	* @param {String} classes
	* @returns {Number} risk
	*/
	const riskLevelFromClass = ( cssStr ) => {
		if( cssStr.includes('green')) return 3;
		if( cssStr.includes('amber')) return 2;
		if( cssStr.includes('red')) return 1;
		return 0;
	};
	
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
		iRisk:null, // triangle
		
		// Strings
		fullName: 'JONES, David (Mr)', 
		nhs: '000',
		age: '42',
		gender: 'Male',
		
		// states
		riskNum: 0,
		pathElem: null,
		pathNum: 99, 
		
		/**
		Active / Inactive <tr> state
		*/
		active(){
			this.iEdit.classList.replace('pencil', 'direction-right');
			this.iEdit.classList.replace('small-icon', 'large');
			this.iEdit.classList.add('selected');	
			this.tr.classList.add('active');
		},
		inactive(){
			this.iEdit.classList.replace('direction-right', 'pencil');
			this.iEdit.classList.replace('large', 'small-icon');
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
			this.riskNum = riskLevelFromClass( icon.className );
		}, 
		get risk(){
			return this.riskNum;
		}, 
		set risk( val ){
			this.riskNum = parseInt(val, 10);
			updateRiskIcon( this.iRisk, val );
			if( this.accepted === null ) this.accept();
		}, 
		
		/**
		Clinical Pathway
		*/
		setPathway( elem ){
			this.pathElem = elem;
			this.pathNum = getPathywayNum( elem.textContent );
		}, 
		set pathway( val ){
			this.pathNum = parseInt(val, 10);
			this.pathElem.textContent = pathways[ this.pathNum ];
		}, 
		get pathway(){
			return this.pathNum;
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
			patient.setPathway( row.querySelector('.js-pathway') );
			
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
	
		const radioRisks = bj.nodeArray( document.querySelectorAll('#sidebar-patient-risk-settings input')); 
		const radioPathways = bj.nodeArray( document.querySelectorAll('#sidebar-pathway-settings input'));
	
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
		* Set Radio for Risk or Pathway
		* @param {Array} arr
		* @param {Number} num - radio to 'check'
		*/
		const setRadio = ( arr, num ) => {
			arr.forEach(( radio ) => {
				radio.checked = ( num == radio.value );
			});
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
				showAsAccepted( false );
				activePatient.reject();
			} else {
				// re-accept
				showAsAccepted( true );
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
			
			ui.patient.fullName.textContent = patient.fullName;
			ui.patient.details.innerHTML = `<small class="fade">NHS</small> ${patient.nhs}  
				&nbsp;<small class="fade">Gen</small> ${patient.gender} 
				&nbsp;<small class="fade">Age</small> ${patient.age}`;
				
			ui.patient.group.textContent = patient.group;
			
			// hacky demo of attachment
			ui.patient.attachment.style.display = patient.hasImage ? 'block' : 'none';
			
			setRadio( radioRisks, patient.riskNum );
			setRadio( radioPathways, patient.pathNum );
			
			showAsAccepted( patient.accepted ); // ?
			
			patient.active();
			activePatient = patient;
		};
		
		/**
		* User can step through the patients from the sidebar
		*/
		const nextPatient = ( dir ) => {
			let patientKey;
			
			if( dir == "next" ){
				patientKey  = collection.next( activePatient.myKey );
			} else {
				patientKey  = collection.prev( activePatient.myKey );
			}
			
			// if a key exists, show the patient data for it
			if( patientKey ){
				sidebar.managePatient( collection.get( patientKey ));
			}
		};
		
		/** 
		User updates the radio settings in the sidebar
		*/
		document.addEventListener('change', ( ev ) => {
			let input = ev.target; 
			if( input.name === 'idg-radio-g-patient-risk' ){
				activePatient.risk = input.value;
			}	
			
			if( input.name === 'idg-radio-g-patient-pathway' ){
				activePatient.pathway = input.value;
			}
		});
		
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
			'<div class="user">',
			'<input type="text" placeholder="Username">',
			'<input type="password" placeholder="Password">',
			'<button class="green hint" id="js-login">Login</button>',
			'</div>',
			'<div class="info">',
			'For security reasons you have been logged out. Please login again',
			'</div>',
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
			.then( html => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = html;
				div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
					ev.stopPropagation();
					uiApp.remove(div);
				}, {once:true} );
				
				// reflow DOM
				uiApp.appendTo('body',div);
			})
			.catch( e => console.log('failed to copy',e));  // maybe output this to UI at somepoint, but for now... 
	};

	uiApp.userDown('.js-idg-demo-remove-oph-diag', showDeletePopup);
	
	
			
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
			btn: '#js-nav-shortcuts-btn',
			wrapper: '#js-nav-shortcuts',
			contentID: 'js-nav-shortcuts-subnav',
		}, 
		{ // Nav, (was worklist button)
			btn: '#js-nav-patientgroups-btn',
			wrapper: '#js-patientgroups-panel-wrapper',
			contentID: 'js-patientgroups-panel',
		},
		{ // Print Event options
			btn: '#js-header-print-dropdown-btn',
			wrapper: '#js-header-print-dropdown',
			contentID: 'js-header-print-subnav',
		},
		{ // Fancy new Event sidebar filter (IDG)
			btn: '#js-sidebar-filter-btn',
			wrapper: '#js-sidebar-filter',
			contentID: 'js-sidebar-filter-options',
		},
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
			bj.show(this.content, 'block');
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
		
		const btn = document.querySelector( item.btn );
		
		if( btn !== null ){

			const obj = btnShowContent({	
				btn: btn,
				content: document.getElementById( item.contentID ),
				open: false, 
			});	
			
			bj.userDown( item.btn, () => obj.change());			
			bj.userEnter( item.btn, () => obj.show());
			bj.userLeave( item.wrapper, () => obj.hide());
		}	
	});
		

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
			uiApp.appendTo('.oe-popup-attachment',notes,div);
		
			// load in PHP using XHR (returns a Promise)	
			uiApp.xhr(json.idgPHP)
				.then( html => {	notes.innerHTML = html;
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
			
			uiApp.appendTo('.oe-popup-attachment',stack,div);
		}
	
		// setup close icon btn
		btn.close = div.querySelector('.close-icon-btn');
		btn.close.addEventListener("mousedown",removeAttachment, {once:true});
		
		// Add all required buttons
		controls.appendChild(btnFragment);
		
		// reflow DOM
		uiApp.appendTo('body',div);
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
	
	uiApp.addModule('comments');	

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
		
		uiApp.hide(btn);
		
		if(json.bilateral){
			// Find 2 comment inputs (I assume suffix of "-left" & '-right')
			const commentsR = document.querySelector('#' + json.id + '-right');
			const commentsL = document.querySelector('#' + json.id + '-left');
			
			uiApp.show(commentsR, 'block');
			uiApp.show(commentsL, 'block');
			
			commentsR.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.show(btn, 'block');
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
			
			commentsL.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.show(btn, 'block');
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
				
		} else {
			// single comment input
			const comments = document.querySelector('#' + json.id);
			uiApp.show(comments, 'block');
			comments.querySelector('textarea').focus();
			comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.show(btn, 'block');
				uiApp.hide(comments);
			},{once:true});	
		}
	};
	
	uiApp.userDown('.js-add-comments', userClick );
	
})(bluejay); 
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
			
			// set the comment text
			this.elem.userComment.textContent = this.comment;
			
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
			if( text.length < 2 ){
				this.comment = "";
				this.reset();
			} else {
				this.comment = text;
				this.show();
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
		div.innerHTML = Mustache.render( template, { comment: comment });
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
	Initalise from DOM
	check to see if PHP static comments are added
	*/
	let hotlistPatients = bj.nodeArray( document.querySelectorAll( '.oe-hotlist-panel .patients-open tr, .oe-hotlist-panel .patients-closed tr' ));
	
	hotlistPatients.forEach( (tr) => {
		let json = JSON.parse( tr.dataset.comment );
		if( json.comment ){
			let icon = tr.querySelector('.oe-i.comments');
			let td = tr.querySelector('.js-patient-comment');
			let patientComment = PatientComment( icon, td, json.comment );
			patientComment.show();
			
			// init and record Key
			collection.add( patientComment, icon );
		}
	});
	
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

})( bluejay ); 

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
		uiApp.appendTo('body', div);
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
			.then( html => {
				ed3app.innerHTML = html;
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
				.then( html => {
					// in the meantime has the user clicked to close?
					if(this.open === false) return; 
					
					this.nav = document.createElement('nav');
					this.nav.className = this.wrapClass;
					this.nav.innerHTML = html;
					// reflow DOM
					this.btn.classList.add('selected');		
					uiApp.appendTo('body',this.nav);		
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
				
			uiApp.appendTo('body',this.nav);
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
		uiApp.appendTo('body',div);
			
		// slow loading??
		let spinnerID = setTimeout( () => content.innerHTML = '<i class="spinner"></i>', 400);
		
		// xhr returns a Promise... 	
		uiApp.xhr('/idg-php/v3/_load/sidebar/events-user-trail-v2.php')
			.then( html => {
				clearTimeout(spinnerID);
				content.innerHTML = html;
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
			if( this.isFixed ) return;
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
				.then( html => {
					const div = document.createElement('div');
					div.className = "oe-popup-wrap";
					div.innerHTML = html;
					div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.remove(div);
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',div);
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
			.then( html => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = html;
				// reflow DOM
				uiApp.appendTo('body',div);
				
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
	
	uiApp.addModule('pathSteps');	
	
	const selector = '.oe-pathstep-btn';
	if(document.querySelector(selector) === null) return;
	
	let activePathBtn = false;
	
	/**
	Build DOM popup template and insert in DOM.
	2 view modes: quick and full
	*/
	const div = document.createElement('div');
	div.style.display = "none";
	div.className = "oe-pathstep-popup";
	div.innerHTML = [	'<div class="close-icon-btn"><i class="oe-i remove-circle medium"></i></div>',
						'<h3 class="title"></h3>',
						'<div class="popup-overflow"><div class="data-group">',
						'<table class="data-table"><tbody>',
						'</tbody></table>',
						'</div></div>',
						'<div class="step-actions"><div class="flex-layout">',
						'<button class="red hint">Remove PSD</button><button class="green hint">Administer</button>',
						'</div></div>',
						'<div class="step-status"></div>',].join('');
	// add to DOM					
	uiApp.appendTo('body',div);
	
	/**
	Set up references to the required DOM elements
	*/
	const popup = {
		title: div.querySelector('.title'),
		closeBtn: div.querySelector('.close-icon-btn .oe-i'),
		status: div.querySelector('.step-status'),
		tbody: div.querySelector('.data-table tbody'),
		actions: div.querySelector('.step-actions'),
		detailRows: null,
		locked:false, // user clicks to lock open (or touch)
	};
	
	/**
	* EyeLat icons DOM
	* @param {String} eye - R, L or B
	* @returns {DOMString}
	*/
	const eyeLatIcons = (eye) => {
		let r,l = "NA";
		if(eye == "R" || eye == "B") r = "R";
		if(eye == "L" || eye == "B") l = "L";
		return `<span class="oe-eye-lat-icons"><i class="oe-i laterality ${r} small"></i><i class="oe-i laterality ${l} small"></i></span>`;
	};
	
	/**
	* OE icon DOM
	* @param {String} i - icon type
	* @returns {DOMString}
	*/
	const icon = i => `<i class="oe-i ${i} small"></i>`;
	
	/**
	* Set popup status message and colour
	* @param {String} status - "done", etc
	*/
	const setStatus = (state) => {
		const css = 'step-status';
		let msg = 'No status set';
		let color = "default";
		
		switch( state ){
			case "done":
				msg = 'PSD: Completed at 11:40';
				color = 'green';
			break;
			case "todo":
				msg = 'PSD: Waiting to start';
				color = 'default';
			break;
			case "progress":
				msg = 'PSD: In progress';
				color = 'orange';		
			break;
			case "problem":
				msg = 'Issue with PSD';
				color = 'red';
			break;
		}
		
		popup.status.textContent = msg;
		popup.status.className = [css,color].join(' ');
	};
	
	/**
	* create <td>'s for Directive <tr>
	* @param {Array} - JSON data array
	* @returns {Array} - DOMStrings to insert
	*/
	const directiveDOM = (arr) => {
		return [ eyeLatIcons(arr[0]), arr[1], arr[2] ];
	};
	
	/**
	* create <td>'s for Step <tr>
	* @param {Array} - JSON data array
	* @returns {Array} - DOMStrings to insert
	*/
	const stepDOM = (arr) => {
		// waiting only has 1... add the rest
		if(arr.length == 1) arr = arr.concat(['<em class="fade">to do</em>','']);
		return [ icon(arr[0]), arr[1], arr[2] ];
	};

	/**
	* Build TR for PSD table
	* @param {String} i - icon type
	* @param {DocFragment} fragment - append to this
	* @param {String} trClass - class to add to the <tr>
	* @returns {DOMString}
	*/
	const buildTableRow = (data, fragment, trClass=false) => {
		let tr = document.createElement('tr');
		if(trClass) tr.className = trClass;
		
		data.forEach((item) => {
			let td = document.createElement('td');
			td.innerHTML = item;
			tr.appendChild(td);	
		});
		
		fragment.appendChild(tr);
	};
	
	
	/**
	* build and insert PSD table data into popup
	* @param {Array} - JSON data
	*/
	const buildPSDTable = (psd) => {
		let fragment = document.createDocumentFragment();
		/*
		A PSD could have many 'parts'
		each part has a Directive and then Steps to administer the Directive
		*/
		psd.forEach((part) => {
			// PSD Directive 
			buildTableRow( directiveDOM(part.directive), fragment );
			
			// Directive could have 1 or n step states to complete
			// this shows what steps have been "administered"!
			part.steps.forEach(step => {
				buildTableRow( stepDOM(step), fragment, 'administer-details');
			});
		});
		
		// clear previous data and add new data
		popup.tbody.innerHTML = "";		
		popup.tbody.appendChild(fragment);
		
		// store a reference to the all the 'administered' <tr> data
		popup.detailRows = uiApp.nodeArray(div.querySelectorAll('.administer-details'));	
	};
	
	/**
	* update popup DOM
	*/
	const updatePopup = () => {
		let json = JSON.parse(activePathBtn.dataset.step);
		popup.title.textContent = json.title;
		buildPSDTable(json.psd);
		setStatus(json.status);
	};
	
	/**
	* Change popup display for Quick or Full states
	* @param {Boolean} full? 
	*/
	const fullDisplay = (full) => {
		let block = full ? 'block' : 'none';
		let tableRow = full ? 'table-row' : 'none';
		popup.title.style.display = block;
		popup.closeBtn.style.display = block;
		popup.actions.style.display = block;
		popup.detailRows.forEach( tr => tr.style.display = tableRow);
	};
	
	
	const hide = () => {
		popup.locked = false;
		div.style.display = "none";	
	};
	
	/**
	* show and position popup
	* @param {Number} top
	* @param {Number} left 
	* @param {Number} offsetY - this lines up the close btn with mouse position
	*/
	const show = (top,left,offsetY=0) => {
		let divWidth = 360;
		div.style.top = top + offsetY + "px";
		div.style.left = left - divWidth + "px";
		div.style.display = "block";
	};
	
	/**
	* Callback for 'Click'
	* @param {event} event
	*/
	const userClick = (ev) => {
		if(ev.target !== activePathBtn){
			activePathBtn = ev.target;
			updatePopup();
		}
		fullDisplay(true);
		popup.locked = true;
		// position & show
		let rect = activePathBtn.getBoundingClientRect();
		show(rect.top, rect.right, -5);
		
		// hide if user scrolls
		window.addEventListener('scroll', hide, {capture:true, once:true});
	};
	
	/**
	* Callback for 'Hover'
	* @param {event} event
	*/
	const userHover = (ev) => {
		if(popup.locked) return;
		activePathBtn = ev.target;
		updatePopup();
		fullDisplay(false);
		// position & show
		let rect = activePathBtn.getBoundingClientRect();
		show(rect.bottom, rect.right);
	};
	
	/**
	* Callback for 'Exit'
	* @param {event} event
	*/
	const userOut = (ev) => {
		if(popup.locked) return;
		hide();
	};

	/*
	Events 
	*/
	uiApp.userDown(selector,userClick);
	uiApp.userEnter(selector,userHover);
	uiApp.userLeave(selector,userOut);
	uiApp.userDown('.oe-pathstep-popup .close-icon-btn .oe-i',hide);
		
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
			
		uiApp.appendTo('body',div);
		
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
			.then( html => {
				clearTimeout(spinnerID);
				if(open){
					content.innerHTML = html;
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
		qtags: [ 'Datix', 'Note', 'Research', 'Teaching', 'Referred', 'Results', 'Results_pending' ].map( t => t.toLowerCase()), 
		
	};
	
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
			
			// check input isn't too close to top of the page
			// note: tag swarm updates as user types and textarea expands down
			if( input.getBoundingClientRect().top < 150 ){
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
			// cancel Events first!
			document.removeEventListener('input', watchInput, { capture:true });
			document.removeEventListener('focusout', focusOut, { capture: true });
			
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
		* refocus input after a delay
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
			
			// Reset, only if we already have an active input setup			
			if( input !== null ) reset();
			
			// is new target allow to use tags?
			if( target.classList.contains("js-allow-qtags") ){
				input = target;
				// add UI flag to input
				quickTags.init( input ); 
				document.addEventListener('input', watchInput, { capture:true });
				document.addEventListener('focusout', focusOut, { capture: true });	
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
	document.addEventListener('focusin', ( ev ) => inputController.init( ev.target ), { capture: true });
	
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
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sidebarQuicklookView');
	
	/*
	sidebar event list - DOM
	<ul> .events 
	- <li> .event
	-- .tooltip.quicklook (hover info for event type)
	-- <a> (Event data)
	--- .event-type (data attributes all in here for quickView)
	
	Remember!: the event sidebar can be re-oredered and filtered
	*/
	
	/*
	Quicklook (in DOM)
	*/
	
	if( document.querySelector('ul.events') === null ) return;

	let active = null;
	
	const findQuickLook = (eventType) => {
		let li = uiApp.getParent(eventType, 'li');
		return li.querySelector('.quicklook');
	};

	const hideQuickLook = () => {
		if(active != null){
			findQuickLook(active).classList.remove('fade-in');
			active = null;
		}
	};

	const showQuickLook = (newActive) => {
		findQuickLook(newActive).classList.add('fade-in');
		active = newActive;
	};
	
	/*
	QuickView 
	DOM built dymnamically and content is loaded from PHP
	*/

	const _show = () => ({
		/**
		* Callback for 'hover'
		* Enhanced behaviour for mouse/trackpad
		*/
		show:function(target){
			this.open = true;
			const json = JSON.parse(target.dataset.quickview);
			this.icon.className = "oe-i-e large " + json.icon;
			this.titleDate.textContent = json.title + " - " + json.date;
			
			// returns a promise
			uiApp.xhr('/idg-php/v3/_load/sidebar/quick-view/' + json.php)
				.then( html => {
					if(this.open === false) return;
					this.open = true;
					this.content.innerHTML = html;
					this.div.classList.remove('fade-out');
					this.div.classList.add("fade-in");
				})
				.catch(e => console.log('PHP failed to load',e));  // maybe output this to UI at somepoint, but for now...
			
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			this.open = false;
			this.div.classList.add('fade-out');
			this.div.classList.remove("fade-in");
			/*
			Must remove the fade-out class or it will cover
			the Event and prevent interaction!
			*/
			setTimeout(() => this.div.classList.remove('fade-out'), 300); 	// CSS fade-out animation lasts 0.2s
		}
	});
	
	/**
	* quickView singleton 
	* (using IIFE to maintain code pattern)
	*/
	const quickView = (() => {	
		const div = document.createElement('div');
		div.className = "oe-event-quick-view";
		div.id = "js-event-quick-view";
		div.innerHTML = [
			'<div class="event-icon"><i class="oe-i-e large"></i></div>',
			'<div class="title-date">Title - DD Mth YYYY</div>',
			'<div class="audit-trail">Michael Morgan</div>',
			'<div class="quick-view-content"></div>'].join('');
		
		uiApp.appendTo('body',div);
		
		return Object.assign(	{	div: div,
									titleDate: div.querySelector('.title-date'),
									icon: div.querySelector('.event-icon > .oe-i-e'),
									content: div.querySelector('.quick-view-content'),
									open:false,
								},
								_show(),
								_hide() );
	})();
	
	/*
	Events 
	*/
	uiApp.userEnter('.event .event-type', (ev) => {	showQuickLook(ev.target);
															quickView.show(ev.target);	});	
																				
	uiApp.userLeave('.event .event-type', (ev) => {	hideQuickLook(); 
															quickView.hide();	});
	
	/*
	No click events?! Why?
	Event sidebar is a list of <a> links, historically (and semantically)
	they  are simply the way to navigate through the Events. Quicklook popup was
	added later as a desktop (hover) enhancement. Then QuickView was added 
	but it should STILL be only a hover enhancement (at least for now on IDG).
	
	If 'click' to lock OR touch support is required this will handle default <a> click:
	document.addEventListener('click',(e) => {
		if(e.target.matches('.event .event-type')){
			e.preventDefault();
			e.stopImmediatePropagation();
			console.log('phew');
		}
	},{capture:true})
	*/

	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('textAreaResize');	
	
	/**
	* Resize textarea 
	* @param {HTMLElement} <textarea>
	*/ 
	const resize = (textArea) => {
		let h = textArea.scrollHeight;
		if(h < 20) return;
		textArea.style.height = 'auto';
		textArea.style.height = h + 'px';
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
		bj.appendTo('body', div);
		
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
	
	uiApp.addModule('userPIN');	
	
	/*
	Little PIN entry demo, see:
	Drugs Administered (User can only use PSD Sets)
	Clinic steps and Patient actions steps in WS
	*/
	
	const demoInput = (input) => {
		let pin = input.value;
		let div = input.parentNode;
		div.classList.remove('accepted-pin','wrong-pin');
		
		if(pin.length === 4){
			if (pin == '1234'){
				div.classList.add('accepted-pin');
			} else {
				div.classList.add('wrong-pin');
			} 	
		}
	};
	
	document.addEventListener('input', (ev) => {
		if(ev.target.matches('.user-pin-entry')){
			demoInput(ev.target);
		}
	},{capture:true});
	

})(bluejay); 
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
	*/
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
		this.all.forEach((popup) => popup.close());
	};
		
	/*
	initialise	
	*/
	addSelect.init = function(){
			/*
			Find all the green + buttons
			*/
			const greenBtns = uiApp.nodeArray(document.querySelectorAll('.js-add-select-btn'));
			if(greenBtns.length < 1) return;
			
			greenBtns.forEach((btn) => {
				let newPopup = new addSelect.Popup(btn);
				this.all.push(newPopup);
			});
	};
	
	/*
	onLoad initialise
	*/
	document.addEventListener('DOMContentLoaded', () => addSelect.init(), {once:true});
	
		
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
	
	addSelect.Popup = function(greenBtn){	
		
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