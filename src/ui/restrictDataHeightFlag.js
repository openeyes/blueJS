/**
* Restrict Data Height
* Tile Element data (in SEM) and "Past Appointments"
* can be very long lists. There high is restricted by 
* CSS but the data overflow needs visually flagged so 
* as not to be missed.
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
	function Flag(elem, content, endPos){
		this.content = content;
		this.end = endPos;
		this.flag = document.createElement('div');
		this.flag.className = flagClass;
		this.flag.setAttribute('data-'+dataAttrName, store.length);
		elem.appendChild(this.flag); // reflow in loop! should be OK as only a few of these
		// store Flag instance
		store.push(this);
	}

	/**
	* Animate scroll down to end 
	* remove flag
	* @method
	*/
	Flag.prototype.scroll = function(){
		let easeOutQuad = (t) => t * (2 - t);
		let duration = 200; // num of steps
		let step = 1;	
		let time = 0;	
				
		let id = setInterval(() => {
			time = Math.min(1, (step/duration));
			this.content.scrollTop = Math.ceil((easeOutQuad(time) * this.end));
			if(time == 1) clearInterval(id);
			step = step + 1; // increment animation
		}, 4);
	};
				
	/*
	* setup Restricted Data Visual Flag 
	* once clicked on, or scrolled it's removed.
	*/
	const checkForScroll = (elem) => {
		const content = elem.querySelector('.restrict-data-content');
		const elemHeight = elem.clientHeight; // reflow
		const scrollHeight = content.scrollHeight; // reflow
		
		/*
		CSS restricts high on 'rows' e.g. 'rows-10','rows-5'
		but the only concern is hidden data, this we flag
		check there is scrolling and the user hasn't scrolled
		*/
 		if(scrollHeight > elemHeight && content.scrollTop === 0){
	 		store.push( new Flag(elem, content, scrollHeight - elemHeight) );
 		}
	};	
	
	
	const userClicksFlag = (event) => {
		let flag = store[event.target.getAttribute('data-'+dataAttrName)];
		flag.scroll();
	};
	
	
	/**
	* Initialise DOM Elements
	* setup wrapped in case it needs calling on a UI update
	*/
	const init = () => {
		let restrictedData = uiApp.nodeArray(document.querySelectorAll('.restrict-data-shown'));
		if(restrictedData.length < 1) return; // no elements!
		
		restrictedData.forEach( (elem) => {
			checkForScroll(elem);
		});
	};
	
	// init DOM Elements
	init();
	
	// register Events
	uiApp.registerForClick('.'+flagClass, userClicksFlag);
	
	
})(bluejay); 