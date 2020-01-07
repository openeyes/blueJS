/**
* Collapse/Expand (show/hide) Data 
*/
(function (uiApp) {

	'use strict';	
	
	const app = uiApp.addModule('collapseData'); 	// get unique namespace for module
	const selector = '.collapse-data-header-icon';	
	const dataAttrName = uiApp.getSetting('dom').dataAttr;
	let store = []; // store all elements 
	
	/**
	* @class CollapseExpander
	* @param {DOMElement} elem 
	*/
	function CollapseExpander(elem){
		this.btn = elem.querySelector('.' + this.btnClass);
		this.content = elem.querySelector('.collapse-data-content');
		this.collapsed = true;
	}
	
	// set up inheritance...	
	CollapseExpander.prototype.btnClass = "collapse-data-header-icon";
	
	// add change method
	// expand / collapse css sets the icon 
	CollapseExpander.prototype.change = function(){
		let display = "none";
		let css = "expand";
		let collapsed = this.collapsed;
		if(collapsed){
			display = "block";
			css = "collapse";
			uiApp.triggerCustomEvent("collapse-data-revealed",{content:this.content});		
		} 
		this.content.style.display = display;
		this.btn.className = this.btnClass + " " + css;
		collapsed = !collapsed;
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (event) => {
		let id =  event.target.parentNode.dataset[dataAttrName];
		store[id].change();
	};
	
	/**
	* Initialise DOM Elements
	* setup wrapped in case it needs calling on a UI update
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