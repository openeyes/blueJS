(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientPopups');	
	
	const cssActive = 'active';
	const cssOpen = 'open';
	
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
		out: function(){
			this.btn.classList.remove( cssActive );
			this.hide();
		}	
	});
	
	const _changeState = () => ({
		/**
		* Callback for 'click'
		* Hotlist can be quickly viewed or 'locked' open
		*/
		changeState:function(){
			if(!this.open){
				this.makeLocked();
				this.over();
			} else {
				if(this.isLocked){
					this.isLocked = false;
					this.hide();
				} else {
					this.makeLocked();
				}
			}
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
			this.popup.style.display = "block";
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
			this.popup.style.display = "none";
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
	* hotlist singleton 
	* (using IIFE to maintain code pattern)
	*/
	const PatientPopup = (me) => {
		me.open = false;
		me.isLocked = false;
		return Object.assign( 	me,
								_changeState(),
								_over(),
								_out(),
								_makeLocked(),
								_show(),
								_hide(),
								_makeHidden() );
	};


	const hideOtherPopups = (showing) => {
		allPopups.forEach((popup)=>{
			if(popup != showing){
				popup.makeHidden();
			}
		});
	};
	
	const popupMap = [
		{btn:'#js-quicklook-btn', popup:'#patient-summary-quicklook' },
		{btn:'#js-demographics-btn', popup:'#patient-popup-demographics'},
		{btn:'#js-management-btn', popup:'#patient-popup-management'},
		{btn:'#js-allergies-risks-btn', popup:'#patient-popup-allergies-risks'},
		{btn:'#js-charts-btn', popup:'#patient-popup-charts'},
		{btn:'#js-patient-extra-btn', popup:'#patient-popup-trials'},
	];
	
	
	const allPopups = [];
	
	popupMap.forEach((item)=>{
		let popup = PatientPopup(	{	btn:document.querySelector(item.btn),
										popup:document.querySelector(item.popup)
									});
		
		uiApp.registerForClick(item.btn, () => popup.changeState());
		uiApp.registerForHover(item.btn, () => popup.over());
		uiApp.registerForExit(item.btn, () => popup.out());
		
		allPopups.push(popup);
	});
	

})(bluejay); 