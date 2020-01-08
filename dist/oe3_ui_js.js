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
			bluejay.log('extending app: '+ name + '()');
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
	To improve performance delegate all events. Modules register 
	callbacks here. Basically they want "click","hover","exit" 
	*/
	const listeners = {
		click:[],		// mousedown
		hover:[],		// mouseover
		exit:[],		// mouseout
		scroll:[],		// scroll
		resize:[],		// window resize
		update:[],		// UI updated (something added)
	};
	
	/**
	* Register to receive Events
	* @param {Sting}  	selector	DOM selector, or set of selectors e.g '.class' or '#id' 	
	* @param {Function} cb			callback function
	*/
	const addToClick = (selector,cb) => listeners.click.push({ selector:selector, cb:cb });
	const addToHover = (selector,cb) => listeners.hover.push({ selector:selector, cb:cb });
	const addToExit = (selector,cb) => listeners.exit.push({ selector:selector, cb:cb });
	/**
	* Listen for Events 
	* @param {Function} cb			callback function
	*/
	const addToScroll = (cb) => listeners.scroll.push({ cb:cb });
	const addToResize = (cb) => listeners.resize.push({ cb:cb });
	const addToUpdate = (cb) => listeners.update.push({ cb:cb });

	// extend app
	uiApp.extend('registerForHover',addToHover);
	uiApp.extend('registerForClick',addToClick);
	uiApp.extend('registerForExit',addToExit);
	uiApp.extend('listenForScroll',addToScroll);
	uiApp.extend('listenForResize',addToResize);
	uiApp.extend('listenForDomChange',addToUpdate);
	
	/**
	* Handle Listeners awaiting Document Events
	* @param {Array}  Callback that are listening 
	* @param {Event}  Event - check event.target against selector
	*/
	const checkListeners = (listeners,event) => {
		if(event.target === document) return;
		listeners.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	/**
	* Receive Event: 'mousedown'
	* @param {Event} 
	*/
	const userClick = (event) => checkListeners(listeners.click,event);		// 'mousedown'
	const userHover = (event) => checkListeners(listeners.hover,event);		// 'mouseover'
	const userExit = (event) => checkListeners(listeners.exit,event);		// 'mouseout'
	
	/**
	* Scroll & Resize 
	* These fire at high rates and need throttling
	*/
	const throttler = {
		fire:true,
		timerID:0,
		throttleEvent: function(listeners){
			if(this.fire){
				this.fire = false;
				this.broadcast(listeners);
				this.timerID = setTimeout( () => {
					clearTimeout(this.timerID );
					this.fire = true;
				},320);  // 16ms * 20
			}	
		},
		broadcast:function(listeners){
			listeners.forEach((item) => {
				item.cb(event);
			});
		}
	};

	const windowScroll = () => throttler.throttleEvent(listeners.scroll);	// 'scroll'
	const windowResize = () => throttler.throttleEvent(listeners.resize);	// 'resize'
	
	/**
	* DOM updated. 
	* Called whenever a change is made to the DOM
	*/
	const domChange = () => {
		listeners.udpate.forEach((item) => {
			item.cb(event);
		});
	};

	// extend App
	uiApp.extend('onClickEvent',userClick);
	uiApp.extend('onHoverEvent',userHover);
	uiApp.extend('onExitEvent',userExit);
	uiApp.extend('onWindowScroll',windowScroll);
	uiApp.extend('onWindowResize',windowResize);
	uiApp.extend('onDomUpdate',domChange);

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
	* Provide a consistent approach to appending DOM Element to <body>, 	
	* @param {DOM Element} el
	*/
	const appendTo = (dom,el) => {
		let body = document.querySelector(dom);
		body.appendChild(el);
	};
	
	/**
	* Remove a DOM Element 	
	* @param {DOM Element} el
	*/
	const removeDOM = (el) => {
		el.parentNode.removeChild(el);
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
			
			uiApp.log('[Module] added: '+name);
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
* Tooltips (on icons)
* These may be loaded after intial DOM  load (asynchronously)
*/
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('tooltip');
	const selector = ".js-has-tooltip";
	const mainClass = "oe-tooltip";
	let showing = false;
	let winWidth = window.innerWidth; // forces reflow
		
	// create DOM (keep out of reflow)
	let div = document.createElement('div');
	div.className = mainClass;
	div.style.display = "none";
	uiApp.appendTo('body',div);
	
	/**
	* Window Resize 
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
		
		// can't get the height without some tricky...
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
		div.className = mainClass + " " + css;
		div.style.top = top;
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	/**
	* Hide tooltip and reset
	* @param {Event}
	*/
	const hide = (event) => {
		if(showing === false) return;
		showing = false;
		
		div.innerHTML = "";
		div.className = mainClass;
		div.style.cssText = "display:none"; // clear all styles
	};
	
	// Register/Listen for Events
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,show);
	uiApp.registerForExit(selector,hide);
	uiApp.listenForScroll(hide);
	uiApp.listenForResize(resize);
	
})(bluejay); 
/**
* Event Listeners
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseover',	uiApp.onHoverEvent,		true);
	document.addEventListener('mousedown',	uiApp.onClickEvent,		true); 
	document.addEventListener('mouseout',	uiApp.onExitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll', uiApp.onWindowScroll,	true);
	window.onresize = uiApp.onWindowResize; 
	
})(bluejay);