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

	console.time('[blue] Ready'); // endTime called by './_last/ready.js' the last JS concatenated by Gulp
	console.time('[blue] DOM Loaded'); // this is called by "DOMContentLoaded" event (to watch out for scripts that are slowing things down)

	const debug = true;		// Output debug '[blue]' to console
	const methods = {}; 	// Create a public methods object 
	let extendID = 1;		// Method IDs

	/**
	* Extend the public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	methods.extend = (name, fn) => {
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
		methods.log('OE JS UI layer ("blue") ...');
		methods.log('DEBUG MODE');
		document.addEventListener('DOMContentLoaded', () => {
			// list API methods 
			let apiMethods = [];
			for(const name in methods)	apiMethods.push(name); 
			methods.log('[API] [Helper Methods] ' + apiMethods.join(', '));
			console.timeEnd('[blue] DOM Loaded');
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
	const addListener = (arr, selector, cb) => {
		arr.push({selector:selector, cb:cb});
	};

	/**
	* Check Listeners for Selector matches	
	* @param {Event}  event 
	* @param {Array}  Listeners
	*/
	const checkListeners = (event, listeners) => {
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
	
	const resizeThrottle = EventThrottler(resize);
	
	/**
	To improve performance delegate Event handling to the document
	setup Event listeners... 
	*/
	document.addEventListener('mouseenter', (event) => checkListeners(event,hover), {capture:true});
	document.addEventListener('mousedown', (event) => checkListeners(event,click), {capture:true}); 
	document.addEventListener('mouseleave', (event) => checkListeners(event,exit), {capture:true});
	// Throttle high rate events
	window.onresize = resizeThrottle; 
	
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
	const myEvent = (eventType, eventDetail) => {
		/*
		Create unique prefix & dispatch 
		*/
		const event = new CustomEvent(eventType, {detail: eventDetail});
		document.dispatchEvent(event);
		
		// DEBUG
		// bluejay.log('[Custom Event] - "'+eventType+'"');
	};
		
	uiApp.extend('uiEvent', myEvent);	
	
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
	* Show a DOM Element - this assumes CSS has set display: "none"
	* @param {DOM Element} el
	* @param {String} block - "block","flex",'table-row',etc
	*/
	const show = (el, block = "block") => {
		if(el === null) return;
		el.style.display = block;
	};
	
	/**
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
	* @parent {String} class to match
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
	
})(bluejay);
/**
* Namespace controller within App for Modules
*/
(function (uiApp) {

	'use strict';
	
	/**
	Manage Modules 
	*/
	const modules = new Map();
	
	/**
	 * Get module namespace
	 * @param  {String} namespace
	 * @return {Object} 
	 */
	let get = (name) => {
		if(modules.has(name)){
			return modules.get(name);	
		}
		uiApp.log('Module does not exist?: '+name);
		return false;
	};
	
	/**
	 * Add a new module
	 * @param {String} name of module 
	 * @param {Object} public methods
	 * @returns {Boolean} 
	 */
	let add = (name, methods) => {
		// check for unique namespace
		if(!modules.has(name)){
			uiApp.log('[Module] ' + name);
			modules.set(name, {});
			return get(name);
		} else {
			uiApp.log('** Err: Module aleady added? ' + name);
			return false;
		}
	};

	
	// Extend App
	uiApp.extend('addModule', add);
	uiApp.extend('getModule', get);
	
})(bluejay);
/**
* Settings (useful globals)
*/
(function (uiApp) {

	'use strict';

	// useful global settings
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
	uiApp.extend('settings', settings);
	uiApp.extend('getDataAttributeName', domDataAttribute);
	uiApp.extend('setDataAttr', setDataAttr);
	uiApp.extend('getDataAttr', getDataAttr);

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
			uiApp.show(this.content);
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
	uiApp.registerForClick( ".collapse-data-header-icon", ev => userClick(ev, "data"));
	uiApp.registerForClick( ".collapse-group > .header-icon", ev => userClick(ev, "group"));

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
(function (uiApp) {
	
	'use strict';
	
	uiApp.addModule('tooltip'); 
	
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
		uiApp.listenForResize(() => winWidth = window.innerWidth);
		
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
			uiApp.appendTo('body', div);
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
			let h = uiApp.getHiddenElemSize(div).h;
							
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
			let extendedBrowser = uiApp.settings.cssExtendBrowserSize;
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
	uiApp.registerForClick(m.selector, userClick);
	uiApp.registerForHover(m.selector, userOver);
	uiApp.registerForExit(m.selector, userOut);
	
	
})(bluejay); 
/**
* Last loaded
*/
(function () {

	'use strict';
	
	console.timeEnd('[blue] Ready');

})(bluejay);