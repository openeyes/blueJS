/**
* Collapse/Expand (show/hide) 
* (Collapse) Data & (Collapse) Groups 
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseExpand');
	
	// store state ref on DOM data-attributes
	const dataAttr = uiApp.getDataAttributeName();
	const states = [];
	
	/*
	DOM: 
	.collapse-data
	- .collapse-data-header-icon (expand/collapse)
	- .collapse-data-content
	*/
	const data = {
		selector: ".collapse-data-header-icon",
		btn: "collapse-data-header-icon",
		content: "collapse-data-content"
	};

	/*
	DOM: 
	.collapse-group
	- .header-icon (expand/collapse)
	- .collapse-group-content
	*/
	const group = {
		selector: ".collapse-group > .header-icon",  
		btn: "header-icon",
		content: ".collapse-group-content"
	};

	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Change state 
		*/		
		change: function(){	
			if(this.collapsed){
				this.view("block","collapse");		
			} else {
				this.view("none","expand");	
			}
			
			this.collapsed = !this.collapsed;
		}
	});
	
	const _view = () => ({
		/**
		* Update View
		* @param {string} display
		* @param {string} icon CSS class
		*/	
		view: function(display,icon){
			this.content.style.display = display;
			this.btn.className = [this.btnCSS,icon].join(" ");	
		}
	});
	
	/**
	* @Class
	* @param {Object} me 
	*/
	const CollapseExpander = (me) => {
		return Object.assign(	me, 
								_change(),
								_view() );
	};

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev, defaults) => {
		let btn = ev.target;
		// If there is no dataAttr on DOM, it needs setting up
		if(btn.hasAttribute(dataAttr) === false){
			/*
			Set up	
			user data-collapsed="true" attribute if expanded by default
			*/
			let collpased = btn.parentNode.dataset.collapsed ? true : false;  		
			let expander = CollapseExpander( {	btn: btn,
												btnCSS: defaults.btn,
												content: btn.parentNode.querySelector( defaults.content ),
												collapsed:collpased}  );
			expander.change(); 								// as user has clicked, update view						
			states.push(expander); 							// store state
			btn.setAttribute(dataAttr, states.length-1); 	// store ref on DOM
		} else {
			/*
			Already set up! update state	
			*/
			let stateID = btn.dataset[dataAttr.substring(5)];
			states[stateID].change();
		}
	};
	
	// Regsiter for Events
	uiApp.registerForClick( data.selector, 	ev => userClick(ev, data) );
	uiApp.registerForClick( group.selector, ev => userClick(ev, group) );

})(bluejay); 