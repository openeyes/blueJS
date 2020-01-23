/**
 * Element.matches() polyfill (simple version)
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
/**
* OE3 JS layer to handle UI interactions.
* Tooltips, popups, etc. 
* Using "bluejay" for namespace
* @namespace
*/
const bluejay = (function () {

	'use strict';

	const methods = {}; 	// Create a public methods object 
	const debug = true;		// Output debug to console
	let extendID = 1;		// Method IDs

	/**
	* Extend the public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	methods.extend = (name,fn) => {
		/*
		only extend if not already added 
		and if the name is available
		*/
		if(!fn.id && !(name in methods)){
			// ok, extend		
			bluejay.log('method: '+ name + '()');
			fn.id = extendID++;
			methods[name] = fn;
			return true;
			
		} else {
			// method already added!
			bluejay.log('** Err: Can not extend again: "' + name + '"');
			return false;
		}
	};
	
	
	/**
	* Log to console, if debug is true
	* @param {String} msg - message to log
	*/
	methods.log = function (msg) {
		if(debug){
			console.log('[bluejay] ' + msg);
		}
	};
	
	methods.log('OE JS UI layer... Setting up');
	
	// Return public methods object
	return methods;

})();
/**
* DOM Events
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate all events. 
	Modules register callbacks for listeners here.
	*/
	const click = [];	// mousedown
	const hover = [];	// mouseenter
	const exit = [];	// mouseleave
	const scroll = [];	// window (any) scroll
	const resize = [];	// window resize

	/**
	* Register a Module callback with an Event
	* @param {Array} arr - listeners array  
	* @param {String} CSS selector to match
	* @param {Function} callback 
	*/
	const addListener = (arr,selector,cb) => {
		arr.push({	selector:selector, 
					cb:cb });
	};

	/**
	* Check Listeners for Selector matches	
	* @param {Event}  event 
	* @param {Array}  Listeners
	*/
	const checkListeners = (event,listeners,useMatch=true) => {
		if(event.target === document) return;
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	/**
	* Basic broadcaster for Scroll and Resize
	* @param {Array}  Listeners
	*/
	const broadcast = (listeners) => {
		listeners.forEach((item) => {
			item.cb(event);
		});
	};

	/**
	* Throttle Scroll & Resize events
	* As these fire at such high rates they need restricting
	* @oaram {Array} listeners array	
	*/
	function EventThrottler(listeners){
		let throttle = false;
		return () => {
			if(throttle) return;
			throttle = true;
			
			broadcast(listeners); // broadcast at start
			
			// throttle events
			let timerID = setTimeout( () => {
				clearTimeout(timerID);
				throttle = false;
			},320);  // 16ms * 20
		};
	}
	
	const scrollThrottle = EventThrottler(scroll);
	const resizeThrottle = EventThrottler(resize);
	
	/**
	To improve performance delegate Event handling to the document
	*/
	document.addEventListener('mouseenter',	(event) => checkListeners(event,hover),		true);
	document.addEventListener('mousedown',	(event) => checkListeners(event,click),		false);  // need to use bubbling for "click"
	document.addEventListener('mouseleave',	(event) => checkListeners(event,exit),		true);
	// Throttle high rate events
	window.addEventListener('scroll', () => scrollThrottle(), true); 
	window.onresize = () => resizeThrottle(); 
	
	// extend App
	uiApp.extend('registerForHover',	(selector,cb) => addListener(hover,selector,cb));
	uiApp.extend('registerForClick',	(selector,cb) => addListener(click,selector,cb));
	uiApp.extend('registerForExit',		(selector,cb) => addListener(exit,selector,cb));
	uiApp.extend('listenForScroll',		(cb) => addListener(scroll,null,cb));
	uiApp.extend('listenForResize',		(cb) => addListener(resize,null,cb));


})(bluejay);
/**
* Custom App Events 
* (lets try and keep it loose)
*/
(function (uiApp) {

	'use strict';
	
	/**
	* Create Custom Event
	* @param {string} eventType
	* @param {Object}
	*/
	const createEvent = (eventType,eventDetail) => {
		eventType = "oeui-" + eventType; 
		const event = new CustomEvent(eventType,{detail:eventDetail});
		document.dispatchEvent(event);
		bluejay.log('[Custom Event] - "'+eventType+'"');
	};
		
	uiApp.extend('triggerCustomEvent',createEvent);	
	
})(bluejay);
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
	const appendTo = (selector,el,base) => {
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
/**
* Namespace controller within App for Modules
*/
(function (uiApp) {

	'use strict';
	
	/**
	Manage Modules 
	*/
	const modules = {};
	
	/**
	 * Add a new module
	 * @param {String} name of module 
	 * @param {Object} public methods
	 * @returns {Boolean} 
	 */
	let add = (name, methods) => {
		// check for unique namespace
		if (!(name in modules)){
			
			uiApp.log('[Module] '+name);
			modules[name] = {};
			return modules[name];
	
		} else {
			
			uiApp.log('** Err: Module aleady added? ' + name);
			return false;
		}
	};
	
	/**
	 * Get module namespace
	 * @param  {String} namespace
	 * @return {Object} 
	 */
	let get = (name) => {
		
		if (!(name in modules)){
			uiApp.log('Module does not exist?: '+name);
			return;	
		}
		
		return modules[name];
	};
	
	// Extend App
	uiApp.extend('addModule',add);
	uiApp.extend('getModule',get);
	
})(bluejay);
/**
* Settings (useful globals)
*/
(function (uiApp) {

	'use strict';

	const settings = {
		/*
		Newblue CSS contains some key
		media query widths, this are found in: config.all.scss
		Story the key ones for JS
		*/
		css : {
			extendedBrowserSize: 1440,
			browserHotlistFixSize: 1890,
		},
	};
	
	/**
	* Standardise data-attributes names
	* @param {String} suffix optional
	* @returns {Sting} 
	*/
	const domDataAttribute = (suffix = false) => {
		let attr = suffix === false ? 'oeui' : 'oeui-' + suffix;
		return attr;
	};
	
	/**
	 * Get settings
	 * @param  {String} key The setting key (optional)
	 * @return {*}          The setting
	 */
	var getSetting = function (key) {
		return settings[key];
	};
	
	// Extend App
	uiApp.extend('getSetting',getSetting);
	uiApp.extend('getDataAttributeName',domDataAttribute);

})(bluejay);
/**
* Hidden DOM Elements
*/
(function (uiApp) {

	'use strict';
	
	/*
	To avoid a 'flickering' effect
	DOM elements that need to be 'hidden'
	on page load need to use "hidden" CSS class
	when the JS loads it can switch it over
	*/ 
	
	let hidden = uiApp.nodeArray(document.querySelectorAll('.hidden'));
	if(hidden.length < 1) return; // no elements!
	
	hidden.forEach( (elem) => {
		elem.style.display = "none";
		elem.classList.remove('hidden');
	});
	
})(bluejay);
/**
* Tooltips (on icons)
*/
(function (uiApp) {
	
	'use strict';
	
	uiApp.addModule('tooltip'); // flag 
	
	const selector = ".js-has-tooltip";
	const cssTooltip = "oe-tooltip";

	let showing = false;
	let winWidth = window.innerWidth; // forces reflow
		
	// create DOM
	let div = document.createElement('div');
	div.className = cssTooltip;
	div.style.display = "none";
	uiApp.appendTo('body',div);
	
	/**
	* Resize Windoe - as innerWidth forces a reflow, only update when necessary
	*/
	const resize = () => winWidth = window.innerWidth;
	
	/**
	* click - show and hide (unclick)
	*/
	const userClick = (event) => showing? hide(event) : show(event);
	
	/**
	* Show tooltip. Update from Event
	* @param {Event} event
	*/
	const show = (event) => {
		if(showing) return;
		showing = true;
						
		const icon = event.target; // always an icon	
		div.innerHTML = icon.dataset.tooltipContent; // could contain HTML
		
		/*
		tooltip could be anything check the tooltip height
		width is restricted in the CSS to 200px;	
		*/
		let offsetW = 100; // toptip is 200px
		let offsetH = 8; // visual offset, allows for the arrow
		let css = ""; // classes to position the arrows correct
		
		// can't get the height without some trickery...
		let h = uiApp.getHiddenElemSize(div).h;
						
		/*
		work out positioning based on icon
		this is a little more complex due to the hotlist being
		fixed open by CSS above a certain browser size, the
		tooltip could be cropped on the right side if it is.
		*/
		let domRect = icon.getBoundingClientRect();
		let center = domRect.right - (domRect.width/2);
		let top = domRect.top - h - offsetH + 'px';
	
		// watch out for the hotlist
		let extendedBrowser = uiApp.getSetting('css').extendedBrowserSize;
		let maxRightPos = winWidth > extendedBrowser ? extendedBrowser : winWidth;
		
		// Icon too near either side?
		if(center <= offsetW){
			offsetW = 20; 			// position right of icon, needs to match CSS arrow position
			css = "offset-right";
		} else if (center > (maxRightPos - offsetW)) {
			offsetW = 180; 			// position left of icon, needs to match CSS arrow position
			css = "offset-left";
		}
		
		// is there enough space above icon for standard posiitoning?
		if( domRect.top < h ){
			top = domRect.bottom + offsetH + 'px'; // nope, invert and position below
			css = "inverted";
		} 
		
		// update DOM and show the tooltip
		div.className = cssTooltip + " " + css;
		div.style.top = top;
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	/**
	* Hide tooltip and reset
	* @param {Event}
	*/
	const hide = (event) => {
		if(!showing) return;
		showing = false;
		
		div.innerHTML = "";
		div.className = cssTooltip;
		div.style.cssText = "display:none"; // clear all styles
	};
	
	// Register/Listen for Events
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,show);
	uiApp.registerForExit(selector,hide);
	uiApp.listenForScroll(hide);
	uiApp.listenForResize(resize);
	
})(bluejay); 