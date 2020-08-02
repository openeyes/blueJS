(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientPopups');	
	
	const cssActive = 'active';
	const cssOpen = 'open';
	
	/*
	Patient popup (icons at the top next to the Patient name)
	Originally, hover interaction was only on the icon but this 
	has been changed to allow 'hover' over the popup content	
	uses unique IDs for DOM elements
	*/
	const map = [
		{btn:'#js-quicklook-btn', content:'#patient-summary-quicklook' },
		{btn:'#js-demographics-btn', content:'#patient-popup-demographics'},
		{btn:'#js-management-btn', content:'#patient-popup-management'},
		{btn:'#js-allergies-risks-btn', content:'#patient-popup-allergies-risks'},
		{btn:'#js-charts-btn', content:'#patient-popup-charts'},
		{btn:'#js-patient-extra-btn', content:'#patient-popup-trials'},
	];
	
	
	/*
	Methods	
	*/
	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			this.btn.classList.add( cssActive );
			this.show();
		}	
	});
	
	const _out = () => ({
		/**
		* Callback for 'exit'
		*/
		out: function(e){
			if(e.relatedTarget === this.content) return;
			this.hide();
			this.btn.classList.remove( cssActive );
			
		}	
	});
	
	const _change = () => ({
		/**
		* Callback for 'click'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			hideOtherPopups(this);
			this.btn.classList.add( cssOpen );
			uiApp.show(this.content, 'block');
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false || this.isLocked ) return;
			this.open = false;
			this.btn.classList.remove( cssActive, cssOpen );
			uiApp.hide(this.content);
		}
	});
	
	const _makeLocked = () => ({
		/**
		* 'locked' open if user clicks after opening with 'hover'
		*/
		makeLocked: function(){
			this.isLocked = true; 
			this.btn.classList.add( cssOpen );
		}
	});	
	
	const _makeHidden = () => ({
		makeHidden:function(){
			if(this.open){
				this.isLocked = false;
				this.hide();
			}
		}
	});
	

	/**
	* @class
	* PatientPopups
	* @param {object} me - set up
	*/
	const PatientPopup = (me) => {
		me.open = false;
		me.isLocked = false;
		return Object.assign( 	me,
								_change(),
								_over(),
								_out(),
								_makeLocked(),
								_show(),
								_hide(),
								_makeHidden() );
	};

	
	/**
	* group control all popups
	*/
	const hideOtherPopups = (showing) => {
		map.forEach((item) => {
			if(item.popup != showing){
				item.popup.makeHidden();
			}
		});
	};
	
	/**
	* Init
	*/
	map.forEach((item) => {
		// only init if there is a btn in the DOM
		let btn = document.querySelector(item.btn);
		if(btn !== null){
			let popup = PatientPopup({	
				btn: btn,
				content: document.querySelector(item.content) 
			});					
			uiApp.userDown(item.btn, () => popup.change());
			uiApp.userEnter(item.btn, () => popup.over());
			uiApp.userLeave(item.btn, (e) => popup.out(e));
			uiApp.userLeave(item.content, (e) => popup.out(e));
			item.popup = popup; // store.
		}	
	});
	

})(bluejay); 