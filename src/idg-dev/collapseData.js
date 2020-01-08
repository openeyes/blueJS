/**
* Collapse/Expand (show/hide) Data 
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseData');
	const selector = '.collapse-data-header-icon, .collapse-data-header-icon small';  // header uses <small> for count
	const dataAttrName = uiApp.getDataAttributeName();
	let store = []; // store instances 

	/**
	* @class
	* @param {DOMElement} elem
	* @private
	*/
	function CollapseExpander(elem){
		this.btn = elem.querySelector('.' + this.btnClass);
		this.content = elem.querySelector('.collapse-data-content');
		this.collapsed = true;
	}
	
	/**
	* Defaults
	*/	
	CollapseExpander.prototype.btnClass = "collapse-data-header-icon";
	
	/**
	* change state of content
	* @method 
	*/
	CollapseExpander.prototype.change = function(){
		let display = "none";
		let css = "expand";
		let collapsed = this.collapsed;
		if(collapsed){
			display = "block";
			css = "collapse";
			uiApp.triggerCustomEvent("collapse-data-revealed",{content:this.content});		
		} 
		// update DOM
		this.content.style.display = display;
		this.btn.className = this.btnClass + " " + css;
		this.collapsed = !collapsed;
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (event) => {
		let p = event.target.parentNode;
		// so if the user clicks on <small> in the DOM go up a level! 
		let id = event.target.matches("small") ? p.parentNode.dataset[dataAttrName]	: p.dataset[dataAttrName];
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
	uiApp.registerForClick(selector,userClick);		

})(bluejay); 