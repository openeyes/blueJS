/*
Add Select Search insert Popup (v2)
Updated to Vanilla JS for IDG
*/

(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.addModule('addSelect');	
	
	/*
	keep a track of all popups	
	*/
	addSelect.all = [];
		
	/*
	Close all popups. Keep the interface tidy. 
	Actually there should be a popup controller... but for now:
	*/
	addSelect.closeAll = function(){
		this.all.forEach((popup) => popup.close());
	};
		
	/*
	initialise	
	*/
	addSelect.init = function(){
			
			console.log('addSelect - init',this);
			
			/*
			Find all the green + buttons
			*/
			const greenBtns = uiApp.nodeArray(document.querySelectorAll('.js-add-select-btn'));
			if(greenBtns.length < 1) return;
			
			greenBtns.forEach((btn) => {
				let newPopup = new addSelect.Popup(btn);
				this.all.push(newPopup);
			});
	};
	
	/*
	onLoad initialise
	*/
	document.addEventListener('DOMContentLoaded', () => addSelect.init(), {once:true});
	
		
})(bluejay); 
