(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	Eyedraw v2 (2.5)
	*/
	
	if(document.querySelector('.js-idg-demo-ed2') === null) return;


	uiApp.registerForClick('.js-idg-demo-doodle-drawer', (ev) => {
		let icon = ev.target; 
		let li = uiApp.getParent(icon,'li');
		li.classList.toggle('ed-drawer-open');
	});
	
	
	uiApp.registerForClick('.ed-canvas-edit', (ev) => {
		let canvas = ev.target; 
		let editor = uiApp.getParent(canvas,'.ed-editor');
		let popup = editor.querySelector('.ed-doodle-popup');
		popup.classList.toggle('closed');	
	});
	
	uiApp.registerForClick('#js-idg-demo-ed-search-input', (ev) => {
		let autocomplete = ev.target.nextElementSibling;
		if(autocomplete.style.display == "none"){
			autocomplete.style.display = 'block';
		} else {
			autocomplete.style.display = 'none';
		}
	});
	
			
})(bluejay); 