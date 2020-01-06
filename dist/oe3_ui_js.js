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
* Custom App Events 
* (lets keep it a bit loose)
*/
(function () {

	'use strict';
	
	const myEvents = {};
	
	/**
	* Create Custom Event 
	* @param {string} eventType
	* @param {Object}
	*/
	const createEvent = (eventType,eventDetail) => {
		// check it's available
		if (!(eventType in myEvents)){
			bluejay.log('New Event added: '+eventType);
			myEvents[eventType] = new CustomEvent(eventType,{detail:eventDetail});
			return true;
	
		} else {
			
			bluejay.log('Err: Event aleady added? ' + eventType);
			return false;
		}
	};

	bluejay.extend('addCustomEvent',createEvent);	

})();
/**
* DOM Events
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
	bluejay.extend('registerForHover',addToHover);
	bluejay.extend('registerForClick',addToClick);
	bluejay.extend('registerForExit',addToExit);
	bluejay.extend('listenForScroll',addToScroll);
	bluejay.extend('listenForResize',addToResize);
	bluejay.extend('listenForDomChange',addToUpdate);
	
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
				},300);
			}	
		},
		broadcast:function(listeners){
			listeners.forEach((item) => {
				item.cb();
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
	bluejay.extend('clickEvent',userClick);
	bluejay.extend('hoverEvent',userHover);
	bluejay.extend('exitEvent',userExit);
	bluejay.extend('windowScroll',windowScroll);
	bluejay.extend('windowResize',windowResize);
	bluejay.extend('domUpdate',domChange);

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
* Namespace controller within App for Modules
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
* Settings (useful globals)
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
		dom : {
			dataAttr: 'bluejay',
		}
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
* Collapse/Expand (show/hide) Data 
*/
(function () {

	'use strict';	
	
	const app = bluejay.addModule('collapseData'); 	// get unique namespace for module
	const selector = '.collapse-data-header-icon';	
	const dataAttrName = bluejay.getSetting('dom').dataAttr;
	let store = []; // store all elements 

	/**
	* @class CollapseExpander
	* @param {DOMElement} elem 
	*/
	function CollapseExpander(elem){
		this.btn = elem.querySelector('.' + this.btnClass);
		this.content = elem.querySelector('.collapse-data-content');
		this.collapsed = true;
	}
	
	/* 
	set up inheritance for CollapseExpander	
	*/
	CollapseExpander.prototype.btnClass = "collapse-data-header-icon";
	
	// add change method
	CollapseExpander.prototype.change = function(){
		if(this.collapsed){
			this.content.style.display = "block";
			this.btn.className = this.btnClass + " collapse";
			
			//	idg.restrictDataHeight( content.querySelector('.restrict-data-shown'); )
				
		} else {
			this.content.style.display = "none";
			this.btn.className = this.btnClass + " expand";
		}
		
		this.collapsed = !this.collapsed;
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (event) => {
		let id =  event.target.parentNode.dataset[dataAttrName];
		store[id].change();
	};
	
	/**
	* Initialise DOM Elements
	* setup wrapped in case it needs calling on a UI update
	*/
	const init = () => {
		let collapseData = bluejay.nodeArray(document.querySelectorAll('.collapse-data'));
		if(collapseData.length < 1) return; // no elements!
		
		collapseData.forEach( (elem) => {
			// check to see if elem is already set up
			if(elem.hasAttribute('data-'+dataAttrName) === false){
				// store ID on DOM data-attribute and store Instance		
				elem.setAttribute('data-'+dataAttrName, store.length);
				store.push( new CollapseExpander(elem) );				
			}
		});
	};
	
	// init DOM Elements
	init();
	
	// Regsiter for Events
	bluejay.registerForClick(selector,userClick);

})(); 
/**
* Restrict Data Height (shown!) 
* Tile Element data (in SEM) and "Past Appointments"
* can be very long lists. There high is restricted by 
* CSS but the data overflow needs visually flagging.
*/
(function () {

	'use strict';

	
/*
	idg.restrictDataHeight = function( wasHiddenElem = false ){
	
	
	if( wasHiddenElem !== false){
		/*
		A restricted height element could be wrapped in hideshow
		wrapper DOM. Therefore when it's open IT calls this function 
		with an Elem and then sets it up. 
		
		console.log( wasHiddenElem)
		setupRestrict( $(wasHiddenElem) );
		return;
	}
	
	
	if( $('.restrict-data-shown').length == 0 ) return;
	/*
	Quick demo of the UI / UX behaviour	

	$('.restrict-data-shown').each(function(){
		setupRestrict( $(this) );
	});
	
	function setupRestrict( $elem ){

		/*
		Restrict data can have several different 
		heights, e.g. 'rows-10','rows-5'	
	
	
		let wrapHeight 		= $elem.height();
		let $content 		= $elem.find('.restrict-data-content');
		let scrollH 		= $content.prop('scrollHeight');
		
		
		/*
		if set up, don't do bother again, probably coming in from a
		hide show wrapper.
		
		if( $elem.data('build') ){
			// but fade in the flag UI.. 
			$elem.find('.restrict-data-shown-flag').fadeIn();
		} else {
			if(scrollH > wrapHeight){
				
				// it's scrolling, so flag it
				let flag = $('<div/>',{ class:"restrict-data-shown-flag"});
				$elem.prepend(flag);
				
				flag.click(function(){
					$content.animate({
						scrollTop: $content.height()
					}, 1000);
				});	
	
				$content.on('scroll',function(){
					flag.fadeOut();
				});
				
				$elem.data('build',true);
			}	
		}	
	}
}

*/
	
	
})(); 
/**
* Tooltips (on icons)
* These may be loaded after intial DOM  load (asynchronously)
*/
(function () {

	'use strict';

	const app = bluejay.addModule('tooltip'); 	// get unique namespace for module
	const selector = ".js-has-tooltip";
	const mainClass = "oe-tooltip";
	let showing = false;
	let winWidth = window.innerWidth; // forces layout / reflow
		
	// create DOM (keep out of reflow)
	let div = document.createElement('div');
	div.className = mainClass;
	div.style.display = "none";
	bluejay.appendTo('body',div);
	
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
	bluejay.registerForClick(selector,userClick);
	bluejay.registerForHover(selector,show);
	bluejay.registerForExit(selector,hide);
	bluejay.listenForScroll(hide);
	bluejay.listenForResize(resize);
	
})(); 
/**
* Event Listeners
*/
(function () {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseover',	bluejay.hoverEvent,		true);
	document.addEventListener('mousedown',	bluejay.clickEvent,		true); 
	document.addEventListener('mouseout',	bluejay.exitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll',		bluejay.windowScroll,	true);
	window.onresize = bluejay.windowResize; 
	
})();