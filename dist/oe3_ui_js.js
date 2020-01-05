/**
 * Element.matches() polyfill (simple version)
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
/**
OE3 JS layer to handle UI interactions.
Tooltips, popups, etc. 
Using "bluejay" for namespace
@namespace
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
			bluejay.log('Err: Can not extend again: "' + name + '"');
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
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance route all events through 
	single Event Listener on the document. Modules register 
	callbacks here. The functionality they want is basically
	"click","hover","exit" 
	*/
	const listeners = {
		click:[],		// mousedown
		hover:[],		// mouseover
		exit:[],		// mouseout
		scroll:[],		// scroll
		resize:[],		// window resize
	};
	
	/**
	* Register to receive Event
	* @param {Sting}  	selector	DOM selector, or set of selectors e.g '.class' or '#id' 	
	* @param {Function} cb			callback function
	*/
	const addToClick = (selector,cb) => {
		listeners.click.push({ 	selector:selector,
								cb:cb });
	};
	
	const addToHover = (selector,cb) => {
		listeners.hover.push({ 	selector:selector,
								cb:cb });
	};
	
	const addToExit = (selector,cb) => {
		listeners.exit.push({ 	selector:selector,
								cb:cb });
	};
	
	/**
	* Register to receive Scroll / Resize
	* @param {Function} cb			callback function
	*/
	const addToScroll = (cb) => {
		listeners.scroll.push({ cb:cb });
	};
	
	const addToResize = (cb) => {
		listeners.scroll.push({ cb:cb });
	};
	
	
	// extend app
	bluejay.extend('registerForHover',addToHover);
	bluejay.extend('registerForClick',addToClick);
	bluejay.extend('registerForExit',addToExit);
	
	bluejay.extend('listenForScroll',addToScroll);
	bluejay.extend('listenForResize',addToResize);
	
	
	/**
	* Handle Events from the Document Event Listener for
	* @param {Array}  Callback that are listening 
	* @param {Event} 
	*
	*/
	const checkListeners = (listeners,event) => {
		// only a few listeners, forEach should be fast enough
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
	
	// 'mousedown'
	const userClick = (event) => checkListeners(listeners.click,event);
	
	// 'mouseover'
	const userHover = (event) => checkListeners(listeners.hover,event);
	
	// 'mouseout'
	const userExit = (event) => checkListeners(listeners.exit,event);
	
	/**
	* Scroll & Resize fire at high rates so throttle them
	*/
	const throttler = {
		fire:true,
		timerID:null,
		throttleEvent: function(listeners){
			if(this.fire){
				this.fire = false;
				this.broadcast(listeners);
				this.timerID = setTimeout( () => {
					clearTimeout(this.timerID );
					this.fire = true;
				},300);
			}	
		},
		broadcast:function(listeners){
			listeners.forEach((item) => {
				item.cb();
			});
		}
	};

	// 'scroll'
	const windowScroll = () => throttler.throttleEvent(listeners.scroll);
	
	// onResize
	const windowResize = () => throttler.throttleEvent(listeners.resize);
	
	
	// extend App
	bluejay.extend('clickEvent',userClick);
	bluejay.extend('hoverEvent',userHover);
	bluejay.extend('exitEvent',userExit);
	bluejay.extend('windowScroll',windowScroll);
	bluejay.extend('windowResize',windowResize);

})();

/**
  * Helper functions
  */
(function () {

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
	* Get dimensions of hidden DOM element
	* only use on 'fixed' or 'absolute'elements
	* @param {DOM Element} el 	currently out of the document flow
	* @returns {Object} width and height as {w:w,h:h}
	*/
	const getHiddenElemSize = (el) => {
		// need to render with all the right CSS being applied
		// show but hidden...
		el.style.visibility = 'hidden';
		el.style.display = 'block';		// doesn't work for 'flex'
		
		// ok now calc...
		let props =  {	w:el.offsetWidth,
						h:el.offsetHeight }; 	
		
		// now hide properly again
		el.style.visibility = 'inherit';
		el.style.display = 'none';
		
		return props;
	};

	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendTo',appendTo);
	bluejay.extend('getHiddenElemSize', getHiddenElemSize);
	
})();

/**
  * Namespace functionality within App for Modules
  */
(function () {

	'use strict';
	
	/**
	Manage all my Modules 
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
			
			bluejay.log('Module added: '+name);
			modules[name] = {};
			return modules[name];
	
		} else {
			
			bluejay.log('Err: Module aleady added? ' + name);
			return false;
		}
	};
	
	/**
	 * Get namespace
	 * @param  {String} namespace
	 * @return {Object} 
	 */
	let get = (name) => {
		
		if (!(name in modules)){
			bluejay.log('Module does not exist?: '+name);
			return;	
		}
		
		return modules[name];
	};
	
	// Extend App
	bluejay.extend('addModule',add);
	bluejay.extend('getModule',get);
	
})();
/**
* Settings
* Useful global settings
*/
(function () {

	'use strict';

	const settings = {
		/*
		Newblue CSS contains some key
		media query widths, this are found in: config.all.scss
		Capture the key ones, for JS
		*/
		css : {
			extendedBrowserSize: 1440,
			browserHotlistFixSize: 1890,
		},
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
	bluejay.extend('getSetting',getSetting);
})();
/**
Tooltips (on icons)
These may be loaded after intial DOM load (asynchronously)
Build DOM structure and watch for Events, as only ONE tooltip
is open at a time, reuse DOM, update and position
*/
(function () {

	'use strict';

	const app = bluejay.addModule('tooltip'); 	// get unique namespace for module
	const selector = ".js-has-tooltip";
	const mainClass = "oe-tooltip";
	let showing = false;
		
	// create DOM (keep out of reflow)
	let div = document.createElement('div');
	div.className = mainClass;
	div.style.display = "none";
	bluejay.appendTo('body',div);

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
		let h = bluejay.getHiddenElemSize(div).h;
						
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
		let extendedBrowser = bluejay.getSetting('css').extendedBrowserSize;
		let maxRightPos = window.innerWidth > extendedBrowser ? extendedBrowser : window.innerWidth;
		
		// Icon too near a side?
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
		
		// update DOM
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
	bluejay.registerForClick(selector,show);
	bluejay.registerForHover(selector,show);
	bluejay.registerForExit(selector,hide);
	
	bluejay.listenForScroll(hide);
	
})(); 
/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('mouseover',	bluejay.hoverEvent,		false);
	document.addEventListener('mousedown',	bluejay.clickEvent,		false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,		false);
	 
	// these are handled a bit differently
	window.addEventListener('scroll',		bluejay.windowScroll,	true);
	window.onresize = bluejay.windowResize; 
	
})();