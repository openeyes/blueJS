(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	Eyedraw v2 (2.5)
	*/
	
	if(document.querySelector('.js-idg-demo-ed2') === null) return;


	uiApp.userDown('.js-idg-demo-doodle-drawer', (ev) => {
		let icon = ev.target; 
		let li = uiApp.getParent(icon,'li');
		li.classList.toggle('ed2-drawer-open');
	});
	
	
	uiApp.userDown('.ed-canvas-edit', (ev) => {
		let canvas = ev.target; 
		let editor = uiApp.getParent(canvas,'.ed2-editor');
		let popup = editor.querySelector('.ed2-doodle-popup');
		popup.classList.toggle('closed');	
	});
	
	uiApp.userDown('#js-idg-demo-ed2-search-input', (ev) => {
		let autocomplete = ev.target.nextElementSibling;
		console.log('hi');
		if(autocomplete.style.display == "none"){
			autocomplete.style.display = 'block';
		} else {
			autocomplete.style.display = 'none';
		}
	});
	
			
})(bluejay); 