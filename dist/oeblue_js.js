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

	console.time('[blue] Ready');

	const methods = {}; 	// Create a public methods object 
	const debug = true;		// Output debug to console
	let extendID = 1;		// Method ID

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
		if(!fn._app && !(name in methods)){
			// ok, extend		
			fn._app = extendID++;
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
			console.log('[blue] ' + msg);
		}
	};
	
	/**
	* Provide set up feedback whilst debugging
	*/
	if(debug){
		methods.log('OE JS UI layer... starting');
		methods.log('DEBUG MODE');
		document.addEventListener('DOMContentLoaded', () => {
			// list API methods 
			let apiMethods = [];
			for(const name in methods)	apiMethods.push(name); 
			methods.log('[API] [Helper Methods] ' + apiMethods.join(', ') );
			console.timeEnd('[blue] Ready');
		},{once:true});
	}

	// Return public methods object
	return methods;

})();
/**
* DOM Event Delegation
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
	const checkListeners = (event,listeners) => {
		if(event.target === document) return;
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	/**
	* Basic broadcaster for Resize
	* @param {Array}  Listeners
	*/
	const broadcast = (listeners) => {
		listeners.forEach((item) => {
			item.cb();
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
			setTimeout( () => {
				throttle = false;
				broadcast(listeners); // broadcast to listeners
			},160);  // 16ms * 10
		};
	}
	
	const scrollThrottle = EventThrottler(scroll);
	const resizeThrottle = EventThrottler(resize);
	
	/**
	To improve performance delegate Event handling to the document
	setup Event listeners... 
	*/
	document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mouseenter', (event) => checkListeners(event,hover), {capture:true} );
		document.addEventListener('mousedown', (event) => checkListeners(event,click), {capture:true} ); 
		document.addEventListener('mouseleave', (event) => checkListeners(event,exit), {capture:true} );
		// Throttle high rate events
		window.onresize = () => resizeThrottle(); 
    },{once:true});
	
	// extend App
	uiApp.extend('registerForHover', (selector,cb) => addListener(hover,selector,cb));
	uiApp.extend('registerForClick', (selector,cb) => addListener(click,selector,cb));
	uiApp.extend('registerForExit', (selector,cb) => addListener(exit,selector,cb));
	uiApp.extend('listenForResize', (cb) => addListener(resize,null,cb));


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
	* getParent - search UP the DOM (restrict to body) 
	* @param {HTMLElement} el
	* @parent {String} class to match
	* @returns {HTMLElement} or False
	*/
	const getParent = (el,selector) => {
		while( !el.matches('body') ){
			if(el.matches(selector)) return el; // found it!
			el = el.parentNode;
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
		
		return new Promise((resolve,reject) => {
			let xReq = new XMLHttpRequest();
			xReq.open("GET",url);
			xReq.onreadystatechange = function(){
				
				if(xReq.readyState !== 4) return; // only run if request is DONE 
				
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
	uiApp.extend('getParent',getParent);
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
		For newblue CSS media query widths see: config.all.scss
		*/
		get cssTopBarHeight(){ return 60; },
		get cssExtendBrowserSize(){ return 1890; },
		get cssBrowserHotlistFixSize(){ return 1440; },
		get PHPLOAD(){ return '/idg-php/v3/_load/'; }
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
	const setDataAttr = (el,value) => {
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
			return null;
		}
	};

	// Extend App
	uiApp.extend('settings',settings);
	uiApp.extend('getDataAttributeName',domDataAttribute);
	uiApp.extend('setDataAttr',setDataAttr);
	uiApp.extend('getDataAttr',getDataAttr);

})(bluejay);
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseExpand');
	
	const states = [];
	
	/*
	(Collapse) Data 
	DOM: 
	.collapse-data
	- .collapse-data-header-icon (expand/collapse)
	- .collapse-data-content
	*/
	const data = {
		selector: ".collapse-data-header-icon",
		btn: "collapse-data-header-icon",
		content: ".collapse-data-content"
	};

	/*
	(Collapse) Groups
	DOM: 
	.collapse-group
	- .header-icon (expand/collapse)
	- .collapse-group-content
	*/
	const group = {
		selector: ".collapse-group > .header-icon",  
		btn: "header-icon",
		content: ".collapse-group-content"
	};

	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Change state 
		*/		
		change: function(){	
			if(this.collapsed){
				this.view("block","collapse");		
			} else {
				this.view("none","expand");	
			}
			
			this.collapsed = !this.collapsed;
		}
	});
	
	const _view = () => ({
		/**
		* Update View
		* @param {string} display
		* @param {string} icon CSS class
		*/	
		view: function(display,icon){
			this.content.style.display = display;
			this.btn.className = [this.btnCSS,icon].join(" ");	
		}
	});
	
	/**
	* @Class
	* @param {Object} me 
	* @returns new Object
	*/
	const CollapseExpander = (me) => {
		return Object.assign(	me, 
								_change(),
								_view() );
	};

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev, defaults) => {
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
			let expander = CollapseExpander( {	btn: btn,
												btnCSS: defaults.btn,
												content: btn.parentNode.querySelector( defaults.content ),
												collapsed:btn.classList.contains('expand') });
				
			expander.change(); // user has clicked, update view	
			uiApp.setDataAttr(btn, states.length); // flag on DOM										
			states.push(expander); // store state			
		}
	};
	
	// Regsiter for Events
	uiApp.registerForClick( data.selector, 	ev => userClick(ev, data) );
	uiApp.registerForClick( group.selector, ev => userClick(ev, group) );

})(bluejay); 
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
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => showing ? hide(ev) : show(ev);
	
	/**
	* Callback for 'hover'
	* @param {Event} ev
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
		let extendedBrowser = uiApp.settings.cssExtendBrowserSize;
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
		
		// hide if user scrolls
		window.addEventListener('scroll', hide, {capture:true, once:true});
	};
	
	/**
	* Callback for 'exit'
	* @param {Event} ev
	*/
	const hide = (ev) => {
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
	// innerWidth forces a reflow, only update when necessary
	uiApp.listenForResize(() => winWidth = window.innerWidth);
	
})(bluejay); 