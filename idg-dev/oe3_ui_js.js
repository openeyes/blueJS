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
			bluejay.log('method: '+ name + '()');
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
		hover:[],		// mouseenter
		exit:[],		// mouseleave
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
	const userHover = (event) => checkListeners(listeners.hover,event);		// 'mouseenter'
	const userExit = (event) => checkListeners(listeners.exit,event);		// 'mouseleave'
	
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
	* XMLHttpRequest 
	* @param {string} url
	* @param {Function} cb - callback
	* @retuns {String} responseText
	*/
	const xhr = (url,cb) => {
		uiApp.log('[XHR] - '+url);
		let xReq = new XMLHttpRequest();
		xReq.onreadystatechange = function(){
			
			if(xReq.readyState !== 4) return; // only run if request is DONE 
			
			if(xReq.status >= 200 && xReq.status < 300){
				uiApp.log('[XHR] - Success');
				cb(xReq.responseText);
				// success
			} else {
				// failure
				uiApp.log('[XHR] - Failed');
				return false;
			}			
		};
		// open and send request
		xReq.open("GET",url);
		xReq.send();
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
	uiApp.extend('xhr',xhr);
	uiApp.extend('getHiddenElemSize', getHiddenElemSize);
	
})(bluejay);
/**
* Hidden DOM Elements
*/
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
	const css = {
		tooltip: "oe-tooltip",
	};

	let showing = false;
	let winWidth = window.innerWidth; // forces reflow
		
	// create DOM (keep out of reflow)
	let div = document.createElement('div');
	div.className = css.tooltip;
	div.style.display = "none";
	uiApp.appendTo('body',div);
	
	/**
	* Window Resize 
	* innerWidth forces a reflow, only update when necessary
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
		div.className = css.tooltip + " " + css;
		div.style.top = top;
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	/**
	* Hide tooltip and reset
	* @param {Event}
	*/
	const hide = (event) => {
		if(!showing) return;
		showing = false;
		
		div.innerHTML = "";
		div.className = css.tooltip;
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
* Attachments Thumbnails
* Open up a fullscreen popup up of PNG or PDF
*/
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('attachmentThumbnail');
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
		
			// load in PHP using XHR	
			uiApp.xhr(json.idgPHP,(html) => {
				notes.innerHTML = html;
				// IDG demo eyelat inputs... 
				if(json.eyelat == "L")	notes.querySelector('#annotation-right').style.visibility = "hidden"; // maintain layout?
				if(json.eyelat == "R")	notes.querySelector('#annotation-left').style.visibility = "hidden";
			});
			
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
/**
* Collapse/Expand (show/hide) Data 
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseData');

	const css = {
		btn: "collapse-data-header-icon", 	// header and icon
		content:"collapse-data-content",	// content
	};

	const dataAttrName = uiApp.getDataAttributeName();
	let store = []; // store instances 

	/**
	* @class
	* @param {Element} btn
	* @param {Element} content
	* @private
	*/
	function CollapseExpander(btn,content){
		this.btn = btn;
		this.content = content;
		this.collapsed = true;
	}

	/**
	* change state of content
	* @method 
	*/
	CollapseExpander.prototype.change = function(){
		
		if(this.collapsed){
			this.content.style.display = "block";
			this.btn.className = css.btn + " collapse";	
			uiApp.triggerCustomEvent("collapse-data-revealed",{content:this.content});		
		} else {
			this.content.style.display = "none";
			this.btn.className = css.btn + " expand";
		}
		
		this.collapsed = !this.collapsed;
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (event) => {
		console.log(event.target);
		let id = event.target.parentNode.dataset[dataAttrName];
		store[id].change();
	};
	
	/**
	* Initialise DOM Elements
	* setup up wrapped in case it needs calling later
	*/
	const init = () => {
		let collapseData = uiApp.nodeArray(document.querySelectorAll('.collapse-data'));
		if(collapseData.length < 1) return; // no elements!
		
		collapseData.forEach( (elem) => {
			/*
			store ref to instance on data-attribute, unless already setup
			*/
			if(elem.hasAttribute('data-'+dataAttrName) === false){	
				
				elem.setAttribute('data-'+dataAttrName, store.length);
				store.push( new CollapseExpander(	elem.querySelector('.' + css.btn),
													elem.querySelector('.' + css.content) ));	
																
			}
		});
	};
	
	// init DOM Elements
	init();
	
	// Regsiter for Events
	uiApp.registerForClick('.' + css.btn, userClick);		

})(bluejay); 

/**
* Restrict Data Height User Flag 
* Tile Element data (in SEM) and "Past Appointments"
* can be very long lists. There high is restricted by 
* CSS but the data overflow needs visually flagged so 
* as not to be missed.
* CSS restricts height by 'rows' e.g. 'rows-10','rows-5'
*/
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('restrictDataHeightFlag');
	
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
		let flag = store[event.target.getAttribute('data-'+dataAttrName)];
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
				elemDiv.setAttribute('data-'+dataAttrName, store.length);
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
/**
* Event Listeners
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseenter',	uiApp.onHoverEvent,		true);
	document.addEventListener('mousedown',	uiApp.onClickEvent,		false); 
	document.addEventListener('mouseleave',	uiApp.onExitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll', uiApp.onWindowScroll,	true);
	window.onresize = uiApp.onWindowResize; 
	
})(bluejay);