/**
* Collapse/Expand (show/hide) Data 
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseData');

	const css = {
		btn: "collapse-data-header-icon", 	// header and icon
	};

	const states = []; // store instances states 

	/**
	* @class
	* @param {Element} btn
	* @param {Element} content
	* @private
	*/
	function CollapseExpander(btn){
		this.btn = btn;
		this.content = btn.parentNode.querySelector('.collapse-data-content');
		this.collapsed = true;
		this.change(); // because initiated by click event
	}

	/**
	* change state of content
	* @method 
	*/
	CollapseExpander.prototype.change = function(){
		
		if(this.collapsed){
			this.view("block","collapse");		
		} else {
			this.view("none","expand");	
		}
		
		this.collapsed = !this.collapsed;
	};
	
	/**
	* udpate view state
	* @param {string} display style
	* @param {string} icon class
	* @method 
	*/
	CollapseExpander.prototype.view = function(display,icon){
		this.content.style.display = display;
		this.btn.className = css.btn + icon;	
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		/*
		DOM Structure: 
		.collapse-data
		- .collapse-data-header-icon (expand/collapse)
		- .collapse-data-content
		*/
		let btn = ev.target;
		let dataAttr = uiApp.getDataAttributeName();
		
		// does DOM needs a state setting up? 
		if(btn.hasAttribute(dataAttr) === false){
			// yep, no state, set up
			btn.setAttribute(dataAttr, states.length);									
			states.push(new CollapseExpander(btn));
		} else {
			let stateID = btn.dataset[dataAttr.substring(5)];
			states[stateID].change();
		}
	};

	// Regsiter for Events
	uiApp.registerForClick('.' + css.btn, userClick);		

})(bluejay); 