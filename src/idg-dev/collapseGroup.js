/**
* Collapse/Expand (show/hide) Groups 
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseGroup');

	const css = {
		selector: ".collapse-group > .header-icon",
		btn: "header-icon",
	};

	const states = []; // store instances states 
	
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
			this.btn.className = [css.btn,icon].join(" ");	
		}
	});
	
	const _checkDefaultState = () => ({
		/**
		* Check the DOM default state
		* @param {boolean} collapsed
		*/
		checkDefaultState: function(collapsed){
			this.collapsed = collapsed;	
		}
	});
	

	/**
	* @Class
	* @param {HTMLElement} parentNode (.collapse-data)
	*/
	const CollapseExpander = (parentNode) => {
		/*
		DOM: 
		.collapse-data
		- .collapse-data-header-icon (expand/collapse)
		- .collapse-data-content
		*/
		let me = {
			btn: parentNode.querySelector('.header-icon'),
			content: parentNode.querySelector('.collapse-group-content'),
			collapsed:true,
		};
		
		return Object.assign(	me, 
								_change(),
								_view(),
								_checkDefaultState() );
	};
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		
		let btn = ev.target;
		let dataAttr = uiApp.getDataAttributeName();
		
		// does DOM need a state setting up? 
		if(btn.hasAttribute(dataAttr) === false){
			// yep, no state, set up
			btn.setAttribute(dataAttr, states.length);
			let expander = CollapseExpander( btn.parentNode );
			expander.checkDefaultState( btn.parentNode.dataset.collapsed );
			expander.change();		// click, update view						
			states.push(expander);	// store state
		} else {
			let stateID = btn.dataset[dataAttr.substring(5)];
			states[stateID].change();
		}
	};

	// Regsiter for Events
	uiApp.registerForClick(css.selector, userClick);		

})(bluejay); 