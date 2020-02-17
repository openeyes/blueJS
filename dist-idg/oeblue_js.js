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
	const checkListeners = (event,listeners) => {
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
			event.stopPropagation();
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
			
			setTimeout( () => {
				throttle = false;
			},320);  // 16ms * 20
		};
	}
	
	const scrollThrottle = EventThrottler(scroll);
	const resizeThrottle = EventThrottler(resize);
	
	/**
	To improve performance delegate Event handling to the document
	*/
	document.addEventListener('DOMContentLoaded', () => {
        document.addEventListener('mouseenter',	(event) => checkListeners(event,hover),		{capture:true} );
		document.addEventListener('mousedown',	(event) => checkListeners(event,click),		{capture:false} ); 
		document.addEventListener('mouseleave',	(event) => checkListeners(event,exit),		{capture:true} );
		// Throttle high rate events
		window.addEventListener('scroll', () => scrollThrottle(), true); 
		window.onresize = () => resizeThrottle(); 
    },{once:true});
	
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
		Newblue CSS contains some key
		media query widths, this are found in: config.all.scss
		Store the key ones for JS
		*/
		get cssTopBarHeight(){ return 60; },
		get cssExtendBrowserSize(){ return 1890; },
		get cssBrowserHotlistFixSize(){ return 1440; }
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
	* Resize Window - as innerWidth forces a reflow, only update when necessary
	*/
	const resize = () => winWidth = window.innerWidth;
	
	/**
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => showing? hide(ev) : show(ev);
	
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
	uiApp.listenForScroll(hide);
	uiApp.listenForResize(resize);
	
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
	**/
	
	const userClick = (ev) => {
		const btn = ev.target;
		const comments = document.querySelector('#'+btn.dataset.input);
		btn.style.display = "none";
		comments.style.display = "block";
		comments.querySelector('textarea').focus();
		comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', ()=>{
			btn.style.display = "inline-block";
			comments.style.display = "none";
		},{once:true});	
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
		quick.style.display = 'none';
	};
	
	const quickOver = (ev) => {
		const icon = ev.target;
		/*
		icon is relative positioned by CSS to '.parent-activity'
		offset of 21px allows for the height of the <tr>
		*/
		let relativeTo = uiApp.getParent(icon,'.patient-activity');
		let top = icon.getBoundingClientRect().top - relativeTo.getBoundingClientRect().top + 21;
	
		if(icon.classList.contains('comments-added')){
			quick.textContent = getComments(icon);
			quick.style.top = top + 'px';
			quick.style.display = 'block';
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
		const trComments = uiApp.getParent(icon,'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		trComments.style.display = "table-row";
		uiApp.resizeTextArea(textArea);
		
		// update the icon based on the textarea
	};
	
	uiApp.registerForClick(selector, userClick);
	uiApp.registerForHover(selector,quickOver);
	uiApp.registerForExit(selector,quickOut);
	
	/*
		if(textArea.val() == ""){
			if($(this).hasClass("comments-added")){
				$(this).removeClass("comments-added active");
				$(this).addClass("comments");
			}
		} else {
			if($(this).hasClass("comments")){
				$(this).removeClass("comments");
				$(this).addClass("comments-added active")
			}
		};
	*/
	
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
		loadPHP:function(){
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/sidebar/' + this.php)
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
				.catch(e => console.log('PHP failed to load',e));  // maybe output this to UI at somepoint, but for now...
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
			if(this.btn === null)	this.btn = ev.target;

			if(this.open){
				this.close();
			} else {
				this.open = true;
				this.loadPHP();
			}
		}
	});
	
	/**
	* @Class 
	* @param {Object} set up
	* @returns new Object
	*/	
	const ElementOverlay = (me) => {
		me.btn = null;
		me.open = false; 
		return Object.assign(	me, 
								_change(),
								_loadPHP(), 
								_close() );			
	};

	// Only set up if DOM needs it...
	if(document.querySelector('#js-manage-elements-btn') !== null){
		
		const manager = ElementOverlay({	wrapClass: 'oe-element-selector', 
											php: 'element-selector.php' });
												
		const sidebar = ElementOverlay({ 	wrapClass: 'sidebar element-overlay', 
											php: 'examination-elements.php' });
 	
		// register Events
		uiApp.registerForClick('#js-manage-elements-btn', (ev) => manager.change(ev) );
		uiApp.registerForClick('.oe-element-selector .close-icon-btn button', () => manager.close() );
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
			this.content.style.display = "block";
		}
	});
	
	const _hideTile = () => ({
		/**
		* Hide the tile content (data)
		*/
		hide: function(){
			this.h3.innerHTML = this.title + " <small>["+ this.count +"]</small>";
			this.content.style.display = "none";
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
			states[parstFloat(dataAttr)].change();
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
			uiApp.getDataAttr(parent, states.length);
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
	'popup' content should be loaded in the DOM
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
		popup.style.display = "block";
		icon.classList.add('active');
		showing = true;
	};
	
	/**
	* Callback for 'ext'
	* @param {Event} ev
	*/
	const hide = (ev) => {
		popup.style.display = "none";
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
	
	uiApp.addModule('examElementSearch');	
	
	/*
	Exam Element Search (pre OE 3.0
	IDG basic demo. DOM is included
	*/
	
	if(document.querySelector('#js-search-in-event-popup') === null) return;

	const userClick = (ev) => {
		const	hdBtn = ev.target,
				popup = document.querySelector('#js-search-in-event-popup'),
				mainEvent = document.querySelector('.main-event'),
				closeBtn = popup.querySelector('.close-icon-btn');
		
		hdBtn.classList.add('selected');
		popup.style.display = "block";
		// the pop will overlay the Event.. add this class to push the Exam content down
		mainEvent.classList.add('examination-search-active');
		
		closeBtn.addEventListener('mousedown',(ev) => {
			ev.stopPropagation();
			mainEvent.classList.remove('examination-search-active');
			popup.style.display = "none";
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
	
	uiApp.addModule('messagePreview');	
	
	/*
	Message hub... view all the message
	*/
	if( document.querySelector('.home-messages') === null ) return;
	
	
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
	
	uiApp.addModule('navHotlist');
			
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-nav-hotlist-btn';
	const btn = document.querySelector(selector);
	
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
			this.content.style.display = "block";
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
			this.content.style.display = "none";
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
		if(btn.dataset.fixable){
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
			this.content.style.display = "block";
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
			this.content.style.display = "none";			
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
			this.content.style.display = "block";
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
			this.content.style.display = "none";
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
		shortInfo.style.display = "none";
		longInfo.style.display = "block";
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
	const pops = [ 	{id:'#js-change-context-btn', php:'change-context.php', close:'.close-icon-btn' },	// change context (firm)
					{id:'#copy-edit-history-btn', php:'previous-history-elements.php', close:'.close-icon-btn' }, // duplicate history element
					{id:'#copy-edit-anterior-segment-btn', php:'previous-ed-anterior.php', close:'.close-icon-btn' }, // duplicate history element ED
					{id:'#js-virtual-clinic-btn', php:'virtual-clinic.php', close:'.close-icon-btn' }, // virtual clinic change:
					{id:'#js-delete-event-btn', php:'delete-event.php', close:'.js-demo-cancel-btn' }, // Delete Event generic example:
					{id:'#js-close-element-btn', php:'close-element.php', close:'.js-demo-cancel-btn' }, // Remove element confirmation
					{id:'#js-add-new-event', php:'add-new-event.php', close:'.close-icon-btn' }, // Add New Event in SEM view mode
					{id:'#js-idg-preview-correspondence', php:'letter-preview.php', close:'.close-icon-btn' }, // duplicate history element
					{id:'#js-idg-exam-complog', php:'exam-va-COMPlog.php', close:'.close-icon-btn' }, // Duplicate Event
					{id:'#js-duplicate-event-btn', php:'duplicate-event-warning.php', close:'.close-icon-btn' }, 
					{id:'#js-idg-worklist-ps-add', php:'worklist-PS.php', close:'.close-icon-btn' }, // Worklist PSD / PSG	
					{id:'#analytics-change-filters', php:'analytics-filters.php', close:'.close-icon-btn' }, // Analytics Custom Filters	
					{id:'#js-idg-add-new-contact-popup', php:'add-new-contact.php', close:'.close-icon-btn' }, // Add new contact
					{id:'#js-idg-admin-queset-demo',php:'admin-add-queue.php',close:'.close-icon-btn'}
					];
	
	
	const overlayPopup = (id,php,closeSelector) => {
		
		const showPopup = () => {
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/' + php)
				.then( html => {
					const div = document.createElement('div');
					div.className = "oe-popup-wrap";
					div.innerHTML = html;
					div.querySelector(closeSelector).addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.removeElement(div);
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',div);
				})
				.catch(e => console.log('overlayPopup failed to load',e));  // maybe output this to UI at somepoint, but for now... 
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
							p.php,
							p.close);
		}
	}
			
})(bluejay); 
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientPopups');	
	
	const cssActive = 'active';
	const cssOpen = 'open';
	
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
		out: function(){
			this.btn.classList.remove( cssActive );
			this.hide();
		}	
	});
	
	const _changeState = () => ({
		/**
		* Callback for 'click'
		* Hotlist can be quickly viewed or 'locked' open
		*/
		changeState:function(){
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
			hideOtherPopups(this);
			this.popup.style.display = "block";
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
			this.popup.style.display = "none";
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
								_changeState(),
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
	const all = [];
	const hideOtherPopups = (showing) => {
		all.forEach((popup)=>{
			if(popup != showing){
				popup.makeHidden();
			}
		});
	};
	
	/**
	* Init
	*/
	const popupMap = [
		{btn:'#js-quicklook-btn', popup:'#patient-summary-quicklook' },
		{btn:'#js-demographics-btn', popup:'#patient-popup-demographics'},
		{btn:'#js-management-btn', popup:'#patient-popup-management'},
		{btn:'#js-allergies-risks-btn', popup:'#patient-popup-allergies-risks'},
		{btn:'#js-charts-btn', popup:'#patient-popup-charts'},
		{btn:'#js-patient-extra-btn', popup:'#patient-popup-trials'},
	];
	
	popupMap.forEach((item)=>{
		let btn = document.querySelector(item.btn);
		if(btn !== null){
			let popup = PatientPopup({	btn:document.querySelector(item.btn),
										popup:document.querySelector(item.popup) });
										
			uiApp.registerForClick(item.btn, () => popup.changeState());
			uiApp.registerForHover(item.btn, () => popup.over());
			uiApp.registerForExit(item.btn, () => popup.out());
			all.push(popup);
		}	
	});
	

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
								_hideShow() );
	};
	
	

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		const btn = ev.target;
		let dataAttr = uiApp.getDataAttr(btn);
		
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
			let pro = ProView( uiApp.getParent(btn, '.pro-data-view') );
			pro.options( JSON.parse(btn.dataset.proview) );
			pro.change();		// update UI (because this a click)
			uiApp.setDataAttr(btn, states.length); // flag on DOM
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
			states[dataAttr].change();
		} else {
			/*
			Collapsed Data is generally collapsed (hidden)
			But this can be set directly in the DOM if needed
			*/
			let reducer = ReduceHeight( {	elem: uiApp.getParent(icon,'.element'),
											icon: icon });
				
			reducer.change(); 		// user has clicked, update view
			uiApp.getDataAttr(icon, states.length);											
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
	uiApp.registerForClick('.'+css.flag, userClicksFlag);
	
	
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
			document.querySelector('#'+listID).style.display = "block";
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
			const json = JSON.parse(target.dataset.quickview);
			this.icon.className = "oe-i-e large " + json.icon;
			this.titleDate.textContent = json.title + " - " + json.date;
			
			// returns a promise
			uiApp.xhr('/idg-php/v3/_load/sidebar/quick-view/' + json.php)
				.then( html => {
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
			this.div.classList.add('fade-out');
			this.div.classList.remove("fade-in");
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
	but it should STILL be only a hover enhancement (at least for now).
	
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

	uiApp.extend('resizeTextArea',resize);	
	
	/**
	* Resize textarea on inputs
	*/
	document.addEventListener('input', (ev) => {
		if(ev.target.matches('textarea')){
			resize(ev.target);
		}
	},true);
	
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
	
	uiApp.addModule('vcScratchPad');	
	
	const scratchPad = document.querySelector('#oe-vc-scratchpad');
	if(scratchPad === null) return;
	
	let offsetX, offsetY;

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
	

})(bluejay); 