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
	function EventThrottler(){
		let throttleID = 0;
		return (listeners) => {
			clearTimeout(throttleID);
			throttleID = setTimeout(() => broadcast(listeners), 100);
		};
	}
	// set up closure
	const resizeThrottle = EventThrottler();
	
	/**
	Specific functions for each event. This is so that they can be remove
	*/
	function handleMouserEnter(e){
		checkListeners(e, hover);
	}
	function handleMouserDown(e){
		checkListeners(e, click);
	}
	function handleMouserLeave(e){
		checkListeners(e, exit);
	}
	
	
	
	/**
	To improve performance delegate Event handling to the document
	setup Event listeners... 
	*/
	document.addEventListener('mouseenter', handleMouserEnter, {capture:true});
	document.addEventListener('mousedown', handleMouserDown, {capture:true}); 
	document.addEventListener('mouseleave', handleMouserLeave, {capture:true});
	
	/* 
	** Touch **
	*/
	let handleTouchStart = (e) => {
		
		/*
		With touch I'll get: touchstart, mouseenter then mousedown.
		This will mess up the UI because of "hover" enhancment behaviour for mouse users.
		Therefore remove the Mouse events.
		*/
		document.removeEventListener('mouseenter', handleMouserEnter, {capture:true});
		document.removeEventListener('mousedown', handleMouserDown, {capture:true}); 
		document.removeEventListener('mouseleave', handleMouserLeave, {capture:true});
		
		// basic "click" behaviour
		checkListeners(e, click);
		
		// only need to removeListeners once!
		handleTouchStart = (e) => {
			checkListeners(e, click);
		};
	};
	
	
	document.addEventListener('touchstart', (e) => handleTouchStart(e), {capture:true});
	
	
	
	// Throttle high rate events
	window.onresize = () => resizeThrottle(resize); 
	
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
(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	Eyedraw v2 (2.5)
	*/
	
	if(document.querySelector('.js-idg-demo-ed2') === null) return;


	uiApp.registerForClick('.js-idg-demo-doodle-drawer', (ev) => {
		let icon = ev.target; 
		let li = uiApp.getParent(icon,'li');
		li.classList.toggle('ed2-drawer-open');
	});
	
	
	uiApp.registerForClick('.ed-canvas-edit', (ev) => {
		let canvas = ev.target; 
		let editor = uiApp.getParent(canvas,'.ed2-editor');
		let popup = editor.querySelector('.ed2-doodle-popup');
		popup.classList.toggle('closed');	
	});
	
	uiApp.registerForClick('#js-idg-demo-ed2-search-input', (ev) => {
		let autocomplete = ev.target.nextElementSibling;
		console.log('hi');
		if(autocomplete.style.display == "none"){
			autocomplete.style.display = 'block';
		} else {
			autocomplete.style.display = 'none';
		}
	});
	
			
})(bluejay); 
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
				uiApp.show(ongoingTxt);
				uiApp.show(durDis);
				uiApp.reshow(taperBtn);	
			} else {
				// off
				uiApp.show(stopBtn);
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
			uiApp.show(stopDate);
			uiApp.show(reasons);
			uiApp.show(cancelIcon);
		} else {
			uiApp.show(stopBtn);
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
					uiApp.removeElement(div);
				}, {once:true} );
				
				// reflow DOM
				uiApp.appendTo('body',div);
			})
			.catch(e => console.log('failed to load',e));  // maybe output this to UI at somepoint, but for now... 
	};

	uiApp.registerForClick('.js-idg-demo-remove-oph-diag', showDeletePopup);
	
	
			
})(bluejay); 
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
		if(json.type === "png"){
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
		uiApp.removeElement(div);
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
	uiApp.registerForClick('.' + css.thumb, userClick);
	
	/*
	If there is an "Annotate" button under the thumbail
	*/
	if(document.querySelectorAll('.js-annotate-attachment')){
		uiApp.registerForClick('.js-annotate-attachment',userClick); 
	}
	
		
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
			
			uiApp.show(commentsR);
			uiApp.show(commentsL);
			
			commentsR.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
			
			commentsL.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
				
		} else {
			// single comment input
			const comments = document.querySelector('#' + json.id);
			uiApp.show(comments);
			comments.querySelector('textarea').focus();
			comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(comments);
			},{once:true});	
		}
	};
	
	uiApp.registerForClick('.js-add-comments', userClick );
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('commentHotlist');	
	
	/*
	Basic implement for IDG 
	whilst moving over from jQuery 
	needs improving ...
	*/
	
	const selector = '.oe-hotlist-panel .js-patient-comments';
	const quick = document.querySelector('#hotlist-quicklook');

	const quickOut = () => {
		uiApp.hide(quick);
	};
	
	const quickOver = (ev) => {
		const icon = ev.target;
		/*
		icon is relative positioned by CSS to '.parent-activity'
		offset of 21px allows for the height of the <tr>
		*/
		let relativeTo = uiApp.getParent(icon, '.patient-activity');
		let top = icon.getBoundingClientRect().top - relativeTo.getBoundingClientRect().top + 21;
	
		if(icon.classList.contains('comments-added')){
			quick.textContent = getComments(icon);
			quick.style.top = top + 'px';
			uiApp.show(quick);
		} 
	};
	
	const getComments = (icon) => {
		const trComments = uiApp.getParent(icon,'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		return textArea.value;
	};
	
	const userClick = (ev) => {
		const icon = ev.target;
		const comments = getComments(icon);
		const trComments = uiApp.getParent(icon, 'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		trComments.style.display = "table-row";
		uiApp.resizeTextArea(textArea);
	};
	
	uiApp.registerForClick(selector, userClick);
	uiApp.registerForHover(selector,quickOver);
	uiApp.registerForExit(selector,quickOut);
	
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
		uiApp.show(ed3app);
		
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

	uiApp.registerForClick('.js-idg-ed3-app-btn', userClick);

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
			uiApp.removeElement(this.nav);	
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
		uiApp.registerForClick('#js-manage-elements-btn', (ev) => manager.change(ev) );
		uiApp.registerForClick('.oe-element-selector .close-icon-btn button', () => manager.close() );
	}
		
	/*
	Sidebar Element view should be available in all Events
	Only set up if DOM is available
	*/
	if(document.querySelector('#js-element-structure-btn') !== null){
		const sidebar = ElementOverlay('sidebar element-overlay');
		// register Events
		uiApp.registerForClick('#js-element-structure-btn', (ev) => sidebar.change(ev) );
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
			uiApp.show(this.content);
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
	uiApp.registerForClick('.collapse-tile-group .oe-i', userClick);
	
	
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
		uiApp.show(popup);
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
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,show);
	uiApp.registerForExit(selector,hide);


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
		uiApp.removeElement(div);
	};
	

	uiApp.registerForClick('#js-events-user-trail', show);
	uiApp.registerForClick('.js-idg-toggle-event-audit-trail',toggleEventDetails);
	uiApp.registerForClick('.oe-events-user-trail .close-icon-btn .oe-i', hide);
		

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
		uiApp.show(popup);
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
	uiApp.registerForClick(	'#js-search-in-event',	userClick );

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
			uiApp.show(this.content);
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
	const FilterOption = (me) => {
		return Object.assign(	me,
								_change(),
								_show(),
								_hide(),
								_mouseOutHide(),
								_closeIconBtn(),
								_positionContent() );
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
	uiApp.registerForClick('.oe-filter-options .oe-filter-btn', ev => userClick(ev) );	
	
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
			uiApp.show(document.querySelector(this.stackPrefix + stackID));
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
	uiApp.registerForClick('#lightning-left-btn', () => app.stepThrough(-1));
	uiApp.registerForClick('#lightning-right-btn', () => app.stepThrough(1));
	uiApp.registerForClick('.lightning-view', () => app.swipeLock());
	uiApp.registerForClick('.icon-event', () => app.swipeLock());
	
	uiApp.registerForHover('.icon-event', (ev) => {
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
	
	uiApp.addModule('lightningFilterOptions');
	
	const cssActive = 'active';
	const selector = '.lightning-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;

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
			uiApp.show(this.content);
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
	
	
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const lightningFilter = (() => {
		return Object.assign({	
			btn:btn,
			content: document.querySelector('.change-timeline'),
			open: false 
		},
		_change(),
		_show(),
		_hide() );
	})();
	

	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => lightningFilter.change());
	
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
			uiApp.show(group.nextElementSibling);
			icon.classList.replace('collapse','expand');
		} else {
			uiApp.show(group);
			uiApp.hide(group.nextElementSibling);
			icon.classList.replace('expand','collapse');
		}
	};
	
	/*
	Events 
	*/
	uiApp.registerForClick('.js-timeline-date', collapseTimeline);
	
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
	uiApp.registerForClick(	'.js-expand-message',	userClick );

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
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navHotlist');
			
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-nav-hotlist-btn';
	const btn = document.querySelector(selector);
	
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
			if(this.isFixed) return;
			if(!this.open){
				this.makeLocked();
				this.over();
			} else {
				if(this.isLocked){
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
			if(this.open) return;
			this.open = true;
			uiApp.show(this.content);
			this.mouseOutHide();
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false || this.isLocked || this.isFixed ) return;
			this.open = false;
			this.btn.classList.remove( cssActive, cssOpen );
			uiApp.hide(this.content);
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
			}, {once:true});
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
	* hotlist singleton 
	* (using IIFE to maintain code pattern)
	*/
	const hotlist = (() => {
		return Object.assign( 	{	btn:btn,
									content: document.querySelector('#js-hotlist-panel'),
									wrapper: document.querySelector('#js-hotlist-panel-wrapper'),
									open: false,
									isLocked: false,
									isFixed: false,
								},
								_changeState(),
								_over(),
								_mouseOutHide(),
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
			hotlist.fixedOpen((window.innerWidth > uiApp.settings.cssExtendBrowserSize));
		}
	};
	
	/*
	Events
	*/
	uiApp.registerForClick(selector, () => hotlist.changeState() );			
	uiApp.registerForHover(selector, () => hotlist.over() );
	uiApp.listenForResize(checkBrowserWidth);
	checkBrowserWidth();

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navLogo');
	
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-openeyes-btn';
	
	/*
	on Login flag the logo
	*/
	if(document.querySelector('.oe-login') !== null){
		document.querySelector(selector).classList.add(cssActive);	
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
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( cssOpen );
			uiApp.show(this.content);
			this.mouseOutHide();
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false) return;
			this.open = false;
			this.btn.classList.remove( cssOpen, cssActive );
			uiApp.hide(this.content);			
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
	
	/**
	* oelogo singleton 
	* (using IIFE to maintain code pattern)
	*/
	const oelogo = (() => {
		let btn = document.querySelector(selector);
		return Object.assign( 	{	btn: btn,
									content: document.querySelector('#js-openeyes-info'),
									wrapper: uiApp.getParent(btn, '.openeyes-brand'),
									open: false
								},
								_over(),
								_out(),
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events
	*/
	uiApp.registerForClick(selector, () => oelogo.change());			
	uiApp.registerForHover(selector, () => oelogo.over());
	uiApp.registerForExit(selector, () => oelogo.out());
	

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navShortcuts');
	
	const cssActive = 'active';
	const selector = '#js-nav-shortcuts-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;
		
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
			uiApp.show(this.content);
			this.mouseOutHide();
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
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const shortcuts = (() => {
		return Object.assign(	{	btn:btn,
									content: document.querySelector('#js-nav-shortcuts-subnav'),
									wrapper: document.querySelector('#js-nav-shortcuts'),
									open: false 
								},
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => shortcuts.change() );			
	uiApp.registerForHover(selector, () => shortcuts.show() );
	

})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navShortlists');
	
	const cssActive = 'active';
	const selector = '#js-nav-shortlists-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;
		
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
			uiApp.show(this.content);
			this.mouseOutHide();
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
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const shortlists = (() => {
		return Object.assign(	{	btn:btn,
									content: document.querySelector('#js-shortlists-panel'),
									wrapper: document.querySelector('#js-shortlists-panel-wrapper'),
									open: false 
								},
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => shortlists.change() );			
	uiApp.registerForHover(selector, () => shortlists.show() );
	

})(bluejay); 
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
		uiApp.show(longInfo);
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
	
	uiApp.registerForHover(	selector,	() => showHide(otherDisplay,defaultDisplay) );
	uiApp.registerForExit(	selector,	() => showHide(defaultDisplay,otherDisplay) );	
	uiApp.registerForClick(	selector,	changeDefault );

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
						uiApp.removeElement(div);
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',div);
				})
				.catch(e => console.log('OverlayPopup failed to load: Err msg -',e));  // maybe output this to UI at somepoint, but for now... 
		};
		
		// register Events
		uiApp.registerForClick(id,showPopup);
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
						uiApp.removeElement(div);
					}, {once:true} );
				}
			})
			.catch(e => console.log('overlayPopupJSON: Failed to load',e));  // maybe output this to UI at somepoint, but for now... 
	};
	
	
	uiApp.registerForClick('.js-idg-demo-popup-json', showPopup);
			
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
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,userHover);
	uiApp.registerForExit(selector,userOut);
	uiApp.registerForClick('.oe-pathstep-popup .close-icon-btn .oe-i',hide);
		
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
			uiApp.show(this.content);
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
			uiApp.registerForClick(item.btn, () => popup.change());
			uiApp.registerForHover(item.btn, () => popup.over());
			uiApp.registerForExit(item.btn, (e) => popup.out(e));
			uiApp.registerForExit(item.content, (e) => popup.out(e));
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
			uiApp.show(closeBtn);
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
			uiApp.show(closeBtn);
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
	

	uiApp.registerForClick('.js-patient-quick-overview',userClick);
	uiApp.registerForHover('.js-patient-quick-overview',userHover);
	uiApp.registerForExit('.js-patient-quick-overview',userOut);
	uiApp.registerForClick('.oe-patient-quick-overview .close-icon-btn .oe-i',hide);
	
	// innerWidth forces a reflow, only update when necessary
	uiApp.listenForResize(() => winHeight = window.inneHeight );
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('printOptions');
	
	const cssActive = 'active';
	const selector = '#js-header-print-dropdown-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;
		
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
			uiApp.show(this.content);
			this.mouseOutHide();
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
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const shortcuts = (() => {
		return Object.assign(	{	btn:btn,
									content: document.querySelector('#js-header-print-subnav'),
									wrapper: document.querySelector('#js-header-print-dropdown'),
									open: false 
								},
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => shortcuts.change() );			
	uiApp.registerForHover(selector, () => shortcuts.show() );
	

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
	uiApp.registerForClick('.pro-view-btn', userClick);


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
			uiApp.removeElement(list.childNodes[i]);
		});
		
		// update listMap
		listMap.splice(i,1);
	};

	/* 
	Events
	*/
	uiApp.registerForClick('.create-new-problem-plan button', addListItem);
	uiApp.registerForClick('.problems-plans-sortable .remove-circle', removeListItem);
	
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

	uiApp.registerForClick('.element .js-elem-reduce .oe-i', userClick );
	
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
		setTimeout(() => uiApp.removeElement(this.flag), 400); 	// CSS fade-out animation lasts 0.2s
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
	uiApp.registerForClick('.' + css.flag, userClicksFlag);
	
	
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
			uiApp.show(document.querySelector('#'+listID));
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
	
	uiApp.addModule('sidebarEventFilter');
	
	const cssActive = 'active';
	const selector = '#js-sidebar-filter-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;

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
			uiApp.show(this.content);
			this.mouseOutHide();
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
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const eventFilter = (() => {
		return Object.assign(	{	btn:btn,
									content: document.querySelector('#js-sidebar-filter-options'),
									wrapper: document.querySelector('#js-sidebar-filter'),
									open: false 
								},
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => eventFilter.change() );			
	uiApp.registerForHover(selector, () => eventFilter.show() );

	
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
	uiApp.registerForHover('.event .event-type', (ev) => {	showQuickLook(ev.target);
															quickView.show(ev.target);	});	
																				
	uiApp.registerForExit('.event .event-type', (ev) => {	hideQuickLook(); 
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
			uiApp.show(scratchPad);
			btn.textContent = 'Hide ScratchPad';
		}
		show = !show;		
	};
	
	uiApp.registerForClick('#js-vc-scratchpad', change );


})(bluejay); 
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('whiteboard');
	
	// Check for Whiteboard UI
	if(document.querySelector('main.oe-whiteboard') === null) return;
	
	// hide these
	uiApp.hide(document.querySelector('#oe-minimum-width-warning'));
	uiApp.hide(document.querySelector('#oe-admin-notifcation'));
	
	const actionsPanel = document.querySelector('.wb3-actions');
	
	uiApp.registerForClick('#js-wb3-openclose-actions', (ev) => {
		let iconBtn= ev.target;
		if(iconBtn.classList.contains('up')){
			// panel is hidden
			iconBtn.classList.replace('up','close');
			actionsPanel.classList.replace('down','up'); // CSS animation
		} else {
			iconBtn.classList.replace('close','up');
			actionsPanel.classList.replace('up','down'); // CSS animation
		}
	});
	
	// provide a way to click around the whiteboard demos:		
	uiApp.registerForClick('.wb-idg-demo-btn',(ev) => {
		window.location = '/v3-whiteboard/' + ev.target.dataset.url;
	});
	
	
	// dirty demo of editor
/*
	$('.edit-widget-btn').click(function(){
		$('.oe-i',this).toggleClass('pencil tick');
		let wbData = $(this).parent().parent().children('.wb-data');
		wbData.find('ul').toggle();
		wbData.find('.edit-widget').toggle();
		
	});
	
	let $nav = $('.multipage-nav .page-jump');
		let $stack = $('.multipage-stack');
		let numOfImgs = $('.multipage-stack > img').length;
		
	
		Get first IMG height Attribute 
		to work out page scrolling.
		Note: CSS adds 20px padding to the (bottom) of all images !
	
		let pageH = 20 + parseInt( $('.multipage-stack > img:first-child').height() );
		
		function resize() {
		  pageH = 20 + parseInt( $('.multipage-stack > img:first-child').height() );
		}

		window.onresize = resize;
		
		
		Animate the scrolling
		
		let animateScrolling = function( page ){
			var scroll = pageH * page;
			$stack.animate({scrollTop: scroll+'px'},200,'swing');
		}
		
		let scrollPage = function( change ){
			let newPos = $stack.scrollTop() + change;
			$stack.animate({scrollTop: newPos+'px'},200,'swing');
		}

	
		Build Page Nav Btns
		loop through and create page buttons
		e.g. <div class="page-num-btn">1/4</div>
			
		for(var i=0;i<numOfImgs;i++){
			var btn = $( "<div></div>", {
							text: (i+1),
							"class": "page-num-btn",
							"data-page": i,
							click: function( event ) {
								animateScrolling( $(this).data('page') );
							}
						}).appendTo( $nav );
		}
		
		$('#js-scroll-btn-down').click(function(){
			scrollPage( -200 );
		});
		
		$('#js-scroll-btn-up').click(function(){
			scrollPage( 200 );
		});
	
*/
	
})(bluejay); 



/*
Add Select Search insert Popup (v2)
Updated to Vanilla JS for IDG
*/

(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.addModule('addSelect');	
	
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
	
	const addSelect = uiApp.getModule('addSelect');	
	
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
	
	const addSelect = uiApp.getModule('addSelect');	
	
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
					if(group.holder) uiApp.show(group.holder);
				} else {
					if(group.holder) uiApp.hide(group.holder);
					// show required Lists
					group.lists.forEach( list => {
						uiApp.show(list);
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
				if(group.holder) uiApp.show(group.holder);
			});
		};
			
	};
	
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.getModule('addSelect');	
	
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
	
	const addSelect = uiApp.getModule('addSelect');	
	
	addSelect.Popup = function(greenBtn){	
		
		let popup = document.querySelector('#' + greenBtn.dataset.popup);
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
			uiApp.show(popup);
			
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
(function () {

	'use strict';
	
	console.timeEnd('[blue] Ready');

})(bluejay);