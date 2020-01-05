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
		hover:[],		// mouseenter
		exit:[],		// mouseout
	};
	
	/**
	* Register to receive Event
	* @param {Sting}  	selector	DOM selector, or set of selectors e.g '.class' or '#id' 	
	* @param {Function} cb			callback function
	*/
	const addClick = (selector,cb) => {
		listeners.click.push({ 	selector:selector,
								cb:cb });
	};
	
	const addHover = (selector,cb) => {
		listeners.hover.push({ 	selector:selector,
								cb:cb });
	};
	
	const addExit = (selector,cb) => {
		listeners.exit.push({ 	selector:selector,
								cb:cb });
	};
	
	// extend app
	bluejay.extend('listenForHover',addHover);
	bluejay.extend('listenForClick',addClick);
	bluejay.extend('listenForExit',addExit);
	
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
	const userClick = (event) => checkListeners(listeners.click,event);
	
	/**
	* Receive Event: 'mouseenter'
	* @param {Event} 
	*/
	const userHover = (event) => checkListeners(listeners.hover,event);
	
	/**
	* Receive Event: 'mouseout'
	* @param {Event} 
	*/
	const userExit = (event) => checkListeners(listeners.exit,event);
	
	// extend App
	bluejay.extend('clickEvent',userClick);
	bluejay.extend('hoverEvent',userHover);
	bluejay.extend('exitEvent',userExit);

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

	const selector = ".js-has-tooltip";
	const app = bluejay.addModule('tooltip'); 	// get unique namespace for module
	
	let showing = false;
	
	// create DOM
	let div = document.createElement('div');
	div.className = "oe-tooltip";
	div.style.display = "none";
	bluejay.appendTo('body',div);

	/*
	Interaction.
	1: Click or Touch - (scroll will hide)
	2: Hover on/off enhancement.
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
		let css = ""; // classes to add
		
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
		
		// is there enough space above icon for standard posiitoning?
		if( domRect.top >= h ){
			div.style.top =  domRect.top - h - offsetH + 'px'; 	// yep, position above 
		} else {
			div.style.top = domRect.bottom + offsetH + 'px';  	// nope, invert and position below
		}
	
		// watch out for the hotlist
		let extendedBrowser = bluejay.getSetting('css').extendedBrowserSize;
		let maxRightPos = window.innerWidth > extendedBrowser ? extendedBrowser : window.innerWidth;
		
		// Icon too near a side?
		if(center <= offsetW){
			offsetW = 10; // position right of icon
		} else if (center > (maxRightPos - offsetW)) {
			offsetW = 190; // position left of icon
		}
		
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	const hide = () => {
		div.innerHTML = "";
		div.style.cssText = "display:none"; // clear all styles
		showing = false;
	};
	
	// Register to listen for Events
	bluejay.listenForClick(selector,show);
	bluejay.listenForHover(selector,show);
	bluejay.listenForExit(selector,hide);
	
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
	
	document.addEventListener('mouseenter',	bluejay.hoverEvent,	true);
	document.addEventListener('mousedown',	bluejay.clickEvent,	false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,	true); 
	
	
})();