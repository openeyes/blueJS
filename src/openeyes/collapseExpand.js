(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('collapseExpand');
	
	/*
	(Collapse) Data & Group DOMs: 
	.collapse-data
	- .collapse-data-header-icon (expand/collapse)
	- .collapse-data-content
	
	.collapse-group
	- .header-icon (expand/collapse)
	- .collapse-group-content
	*/
	const states = [];

	/*
	Methods	
	*/
	const _change = () => ({
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		show: function(){
			uiApp.show(this.content);
			this.btn.classList.replace('expand','collapse');
			this.open = true;
		}
	});
	
	const _hide = () => ({
		hide: function(){
			uiApp.hide(this.content);
			this.btn.classList.replace('collapse','expand');
			this.open = false;
		}
	});
	
	/**
	* @Class
	* @param {Object} me - initialise
	* @returns new Object
	*/
	const Expander = (me) => {
		return Object.assign(	me, 
								_change(),
								_show(),
								_hide() );
	};

	/**
	* Callback for 'Click' (header btn)
	* @param {event} event
	*/
	const userClick = (ev, type) => {
		let btn = ev.target;
		let stateRef = uiApp.getDataAttr(btn);
		if(stateRef){
			// DOM already setup, change it's current state
			states[parseFloat(stateRef)].change();
		} else {
			// ...not set up yet, record state ref in DOM
			uiApp.setDataAttr(btn, states.length); 
			/*
			Data/Group are generally collapsed by default
			but can be set in the DOM to be expanded, check 
			this by the class used on the btn
			*/
			let me = {
				btn: btn,
				content: btn.parentNode.querySelector('.collapse-' + type + '-content'),
				open: btn.classList.contains('collapse')
			};
			
			// create new Expander
			let expander = Expander(me);
			expander.change(); 	
			
			// store state							
			states.push(expander); 			
		}
	};

	/*
	Events
	*/
	uiApp.registerForClick( ".collapse-data-header-icon", ev => userClick(ev, "data"));
	uiApp.registerForClick( ".collapse-group > .header-icon", ev => userClick(ev, "group"));

})(bluejay); 