(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseExpand');
	
	const states = [];
	
	/*
	(Collapse) Data 
	DOM: 
	.collapse-data
	- .collapse-data-header-icon (expand/collapse)
	- .collapse-data-content
	*/
	const data = {
		selector: ".collapse-data-header-icon",
		btn: "collapse-data-header-icon",
		content: ".collapse-data-content"
	};

	/*
	(Collapse) Groups
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
	* @returns new Object
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
		let dataAttr = uiApp.getDataAttr(btn);
		if(dataAttr){
			/*
			Setup already, change it's state
			*/
			states[parseFloat(dataAttr)].change();
		} else {
			/*
			Collapsed Data is generally collapsed (hidden)
			But this can be set directly in the DOM if needed
			*/
			let expander = CollapseExpander( {	btn: btn,
												btnCSS: defaults.btn,
												content: btn.parentNode.querySelector( defaults.content ),
												collapsed:btn.classList.contains('expand') });
				
			expander.change(); // user has clicked, update view	
			uiApp.setDataAttr(btn, states.length); // flag on DOM										
			states.push(expander); // store state			
		}
	};
	
	// Regsiter for Events
	uiApp.registerForClick( data.selector, 	ev => userClick(ev, data) );
	uiApp.registerForClick( group.selector, ev => userClick(ev, group) );

})(bluejay); 