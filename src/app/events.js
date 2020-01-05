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