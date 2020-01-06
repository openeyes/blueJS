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