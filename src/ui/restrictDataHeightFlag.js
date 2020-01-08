
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
	const dataAttrName = uiApp.getDataAttributeName();
	const flagClass = 'restrict-data-shown-flag';
	const store = []; // store Flag instances
	
	/**
	* @class 
	* @param {DOMElement} elem
	* @private
	*/
	function Flag(el, content, scrollEnd){
		this.userKnows = false; // does user know?
		this.content = content;
		this.scrollTo = scrollEnd;
		this.flag = document.createElement('div');
		this.flag.className = flagClass;
		this.flag.setAttribute('data-'+dataAttrName, store.length);
		el.appendChild(this.flag); // reflow in loop, but should be OK
		// watch for scrolling
		this.content.addEventListener("scroll",() => this.scroll(), {once:true});
	}

	/**
	* User scrolls (they're aware of the extra data)
	* @param {Event} e
	*/
	Flag.prototype.scroll = function(e){
		// note! Either animation OR user scrolling will fire this!
		this.userKnows = true; 
		this.flag.className += " fade-out"; 
		setTimeout(() => uiApp.removeElement(this.flag), 500); 	// CSS fade-out lasts 0.2s
	};

	/**
	* Animate the scroll down to end 
	* @method
	*/ 
	Flag.prototype.userClick = function(){
		if(this.userKnows) return;
		this.animateID = animateScroll(this); // note! this will fire the scroll event
	};
		
	/**
	* Simple scroll animation
	* @param {DOMElement} elem
	* @param {numnber} scrollTop position for end of scroll
	* @returns {number} the setInterval ID
	*/		
	const animateScroll = (flag) => {
		let easeOutQuad = (t) => t * (2 - t);
		let duration = 200; // num of steps
		let step = 1;	
		let time = 0;	
		// set up the animation		
		let id = setInterval(() => {
			time = Math.min(1, (step/duration));
			flag.content.scrollTop = Math.ceil((easeOutQuad(time) * flag.scrollTo));
			step = step + 1; // increment animation
			if(time == 1) clearInterval(id); 
		}, 2);
		
		return id;
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
	* Initialise, setup DOM Elements
	* wrapped in case it needs calling on a UI update
	*/
	const init = () => {
		let restrictedData = uiApp.nodeArray(document.querySelectorAll('.restrict-data-shown'));
		if(restrictedData.length < 1) return; // no elements!
		
		restrictedData.forEach( (el) => {
			let content = el.querySelector('.restrict-data-content');
			let elemHeight = el.clientHeight; // reflow
			let scrollHeight = content.scrollHeight; // reflow
			
			// is data hidden by a scroll? Flag it.
	 		if(scrollHeight > elemHeight && content.scrollTop === 0){
		 		store.push( new Flag(el, content, scrollHeight - elemHeight) );
	 		}
		});
	};
	
	// init DOM Elements
	init();
	
	// register Events
	uiApp.registerForClick('.'+flagClass, userClicksFlag);
	
	
})(bluejay); 