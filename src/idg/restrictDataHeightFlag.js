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
		setTimeout(() => uiApp.remove(this.flag), 400); 	// CSS fade-out animation lasts 0.2s
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
	uiApp.userDown('.' + css.flag, userClicksFlag);
	
	
})(bluejay); 