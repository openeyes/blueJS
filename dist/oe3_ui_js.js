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
Using bluejay on IDG for namespace (easy to replace)
@namespace
*/
const bluejay = (function () {

	'use strict';

	const methods = {}; 	// Create a public methods object
	const debug = true;		// Out debug to console
	let extendID = 1;		// Method IDs

	/**
	* Extend the public methods
	* @param  {String}   name 	App method name
	* @param  {Function} fn   	The method
	* @returns {boolean}  
	*/
	methods.extend = function (name, fn) {
		// only extend if not already been added
		if(!fn.id){
			bluejay.log('extending app: '+name);
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
	
	// Return public methods object
	return methods;

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
	* Append Element to <body> 	
	* @param {DOM Element} el
	*/
	const appendToBody = (el) => {
		let body = document.querySelector('body');
		body.appendChild(el);
	};
	
	// Extend App
	bluejay.extend('nodeArray', NodeListToArray);
	bluejay.extend('appendToBody',appendToBody);
	//bluejay.extend('getConfig', getSettings);
})();

/**
  * Settings functionality
  * asdfs
  */
(function () {

	'use strict';
	
	// Create app settings
	let config = {
		debug: false
	};
	
	/**
	 * Update the settings object
	 * @param  {String} key The setting key
	 * @param  {*}      val The new value
	 */
	let add = function (key, val) {
	
		// if the setting doesn't exist, bail
		if (!(key in settings)) return;
	
		// Update the settings
		settings[key] = val;
	
	};
	
	/**
	 * Get settings
	 * @param  {String} key The setting key (optional)
	 * @return {*}          The setting or object of settings
	 */
	var get = function (key) {
	
		// If there's a key, get a specific setting
		if (key) {
			return settings[key];
		}
	
		// Otherwise return the whole settings object
		return Object.assign({}, settings);
	
	};
	
	// Extend App
	//bluejay.extend('addConfig', setting);
	//bluejay.extend('getConfig', getSettings);
})();
/**
UI Tooltips 
*/
(function () {

	'use strict';
	
	/**
		Find all tooltips (js-has-tooltip)
		touch with hover enhancement
		build dom frame (and record state)
		position and update css to reflex this
	*/
	
	// do we have any tooltips?
	let tooltips = bluejay.nodeArray(document.querySelectorAll('.js-has-tooltip'));
	if(tooltips.length === 0) return; // none!
	
	bluejay.log('tooltips - init:' + tooltips.length);
	
	/*
	create and add the div to the DOM
	simply update the content when required
	hide offscreen when removed
	*/
	const div = document.createElement('div');
	div.className = "oe-tooltip";
	
	bluejay.appendToBody(div);
	
	


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
