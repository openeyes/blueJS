/**
* Collapse/Expand (show/hide) Data 
*/
(function () {

	'use strict';	
	
	const app = bluejay.addModule('collapseData'); 	// get unique namespace for module
	const selector = '.collapse-data-header-icon';	
	const dataAttrName = bluejay.getSetting('dom').dataAttr;
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
	
	/* 
	set up inheritance for CollapseExpander	
	*/
	CollapseExpander.prototype.btnClass = "collapse-data-header-icon";
	
	// add change method
	CollapseExpander.prototype.change = function(){
		if(this.collapsed){
			this.content.style.display = "block";
			this.btn.className = this.btnClass + " collapse";
			
			//	idg.restrictDataHeight( content.querySelector('.restrict-data-shown'); )
				
		} else {
			this.content.style.display = "none";
			this.btn.className = this.btnClass + " expand";
		}
		
		this.collapsed = !this.collapsed;
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
		let collapseData = bluejay.nodeArray(document.querySelectorAll('.collapse-data'));
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
	bluejay.registerForClick(selector,userClick);

})(); 