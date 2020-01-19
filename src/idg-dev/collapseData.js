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