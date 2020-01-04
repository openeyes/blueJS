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
	To improve performance all events are routed 
	through a single Event Listener.
	Modules register here and get a callback
	*/
	const listeners = {
		click:[],
		hover:[],
		exit:[]
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
	bluejay.extend('listenForExit',addHover);
	
	/**
	* Document Event Listener for 'mousedown'
	* @param {Event} 
	*/
	const userClick = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	// mouseenter
	const userHover = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
	
	const userExit = (event) => {
		listeners.click.forEach((item) => {
			if(event.target.matches(item.selector)){
				item.cb(event);
			}
		});
	};
	
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
	
	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendTo',appendTo);
	
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
Tooltips (on icons)
These may be loaded after intial DOM load (asynchronously)
Build DOM structure and watch for Events, as only ONE tooltip
is open at a time, reuse DOM, update and position
*/
(function () {

	'use strict';

	const selector = ".js-has-tooltip";
	const dataAttribute = "tooltipContent"; 			// data-tooltip-content
	const app = bluejay.addModule('tooltip'); 			// get unique namespace for module
	
	let showing = false;
	
	// create DOM
	const div = document.createElement('div');
	div.className = "oe-tooltip";
	div.style.top = '20px';
	div.style.left = '20px';
	
	bluejay.appendTo('body',div);
	
	// on user click or hover
	const show = (event) => {
		if(showing) return;
		console.log(event);
		//div.innerHTML = tip; // could contain HTML
	};
	
	const hide = () => {
		console.log('hide tooltip');
	};
	
	// Register to listen for Events
	bluejay.listenForHover(selector,show);
	bluejay.listenForClick(selector,show);
	bluejay.listenForExit(selector,hide);
	

})(); 


/*
idg.tooltips = function(){
	$('.js-has-tooltip').hover(
		function(){
			var text = $(this).data('tooltip-content');
			var leftPos, toolCSS; 
		
			// get icon DOM position
			let iconPos = $(this)[ 0 ].getBoundingClientRect();
			let iconCenter = iconPos.width / 2;
			
			// check for the available space for tooltip:
			if ( ( $( window ).width() - iconPos.left) < 100 ){
				leftPos = (iconPos.left - 188) + iconPos.width // tooltip is 200px (left offset on the icon)
				toolCSS = "oe-tooltip offset-left";
			} else {
				leftPos = (iconPos.left - 100) + iconCenter - 0.5 	// tooltip is 200px (center on the icon)
				toolCSS = "oe-tooltip";
			}
			
			// add, calculate height then show (remove 'hidden')
			var tip = $( "<div></div>", {
								"class": toolCSS,
								"style":"left:"+leftPos+"px; top:0;"
								});
			// add the tip (HTML as <br> could be in the string)
			tip.html(text);
			
			$('body').append(tip);
			// calc height:
			var h = $(".oe-tooltip").height();
			// update position and show
			var top = iconPos.y - h - 25;
			
			$(".oe-tooltip").css({"top":top+"px"});
			
		},
		function(){
			$(".oe-tooltip").remove();
		}
	);	
}
*/

/**
* Events
*/
(function () {

	'use strict';
	
	/**
	To improve performance capture all events
	are routed through single Event Listeners
	*/
	
	document.addEventListener('mouseenter',	bluejay.hoverEvent,	false); // useCapture, not required as it bubbles
	document.addEventListener('mousedown',	bluejay.clickEvent,	false); 
	document.addEventListener('mouseout',	bluejay.exitEvent,	false); 
	
	
})();