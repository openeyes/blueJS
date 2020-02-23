(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('proView');	
	
	/**
	Generally Pro view has 2 states: Collapsed (pro) list and Exapanded (normal) of the SAME data
	However, there are situations where the Pro view remains open and more data is shown by expanding 
	AND the View change is controlled BILATERALY! ... e.g. PCR Risks 
	*/

	const states = []; // store UI states
	
	/*
	Methods	
	*/
	const _hideShow = () => ({
		/**
		* hide/show content areas
		* @param {HTMLElement} to hide 
		* @param {HTMLElement} to show
		*/
		hideShow: function(hide,show){
			if(hide) hide.style.display = "none";
			if(show) show.style.display = "block";
		}	
	});
	
	const _icon = () => ({
		/**
		* Update icon state
		* @param {string}  
		* @param {string} 
		*/
		icon: function(find,replace){
			this.oei.classList.replace(find,replace);
		}	
	});
	
	const _change = () => ({
		/**
		* Change state 
		*/
		change: function(){
			if(this.inPro){
				this.hideShow(this.pro,this.standard);
				this.icon('expand','collapse');
			} else {
				this.hideShow(this.standard,this.pro);
				this.icon('collapse','expand');
			}
			
			if(this.linked){
				this.linkedProView.change();
			}
			
			this.inPro = !this.inPro;
		}	
	});
	
	const _changeContent = () => ({
		/**
		* Basic state change, 
		* only changes content and only used by LinkedProView
		*/
		change: function(){
			if(this.inPro){
				this.hideShow(this.pro,this.standard);
			} else {
				this.hideShow(this.standard,this.pro);
			}
			this.inPro = !this.inPro;
		}	
	});
	
	const _options = (json) => ({
		/**
		* Customise based on JSON settings in the DOM
		* @param {Obj} json
		*/
		options: function(json){
			/*
			Lock Pro view open?
			i.e. Standard data expands data shown (PCR Risk)
			*/
			if(json.lock) this.pro = null;	// hide/show will ignore it
			 
			/*
			DOM will provide ID for linked ProView 
			then this ProView will control 2 ProViews (Bilateral)
			*/
			if(json.linkID != false){
				this.linked = true; 
				this.linkedProView = LinkedProView( document.querySelector('#' + json.linkID));
				if(json.lock) this.linkedProView.pro = null; // set up to behave the same
			}
		}
	});
	
	/**
	* @Class 
	* @param {Node} .pro-data-view
	* @returns new Object
	*/
	const ProView = (parentNode) => {
		
		let btn = parentNode.querySelector('.pro-view-btn');
		let pro = parentNode.querySelector('.data-pro-view');
		let standard = parentNode.querySelector('.data-standard-view');
		
		let me = {	btn: btn,
					oei: btn.querySelector('.oe-i'),
					pro: pro,
					standard: standard,		
					inPro: true,
					linked: false };
		
		return Object.assign(	me,
								_change(),
								_hideShow(),
								_icon(),
								_options() );
	};
	
	/**
	* @Class
	* Provide a basic version of ProView for when they are 'linked'
	* This will be controlled through the ProView instance
	* @param {Node} .pro-data-view
	* @returns new Objec
	*/
	const LinkedProView = (parentNode) => {
		let me = {	pro: parentNode.querySelector('.data-pro-view'),
					standard: parentNode.querySelector('.data-standard-view'),		
					inPro: true };
					
		return Object.assign(	me,
								_changeContent(),
								_hideShow() 
							);
	};
	
	

	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		const btn = ev.target;
		let dataAttr = uiApp.getDataAttr(btn);
		if(dataAttr){
			// DOM already setup, change it's current state
			states[parseFloat(dataAttr)].change();
		} else {
			// ...not setup yet, record state ref in DOM
			uiApp.setDataAttr(btn, states.length);
			
			let pro = ProView(uiApp.getParent(btn, '.pro-data-view'));
			pro.options(JSON.parse(btn.dataset.proview));
			pro.change();		// update UI (because this a click)
			states.push(pro);	// store 
		}
	};

	// Regsiter for Events
	uiApp.registerForClick('.pro-view-btn', userClick);


})(bluejay); 