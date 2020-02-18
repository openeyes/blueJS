(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('reduceElementHeight');	
	
	const states = [];
	
	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Change state 
		*/		
		change: function(){	
			if(this.reduced){
				this.elem.classList.remove('reduced-height');
				this.icon.classList.replace('increase-height-orange','reduce-height');	
			} else {
				this.elem.classList.add('reduced-height');
				this.icon.classList.replace('reduce-height','increase-height-orange');
			}
			
			this.reduced = !this.reduced;
		}
	});
	
	/**
	* @Class
	* @param {Object} me 
	* @returns new Object
	*/
	const ReduceHeight = (me) => {
		me.reduced = false;
		return Object.assign(	me, 
								_change() );
	};

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev, defaults) => {
		let icon = ev.target;
		let dataAttr = uiApp.getDataAttr(icon);
		
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
			let reducer = ReduceHeight( {	elem: uiApp.getParent(icon,'.element'),
											icon: icon });
				
			reducer.change(); 		// user has clicked, update view
			uiApp.setDataAttr(icon, states.length);											
			states.push(reducer); 	// store state			
		}
	};

	uiApp.registerForClick('.element .js-elem-reduce .oe-i', userClick );
	
})(bluejay); 