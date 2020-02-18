(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('textAreaResize');	
	
	/**
	* Resize textarea 
	* @param {HTMLElement} <textarea>
	*/ 
	const resize = (textArea) => {
		let h = textArea.scrollHeight;
		if(h < 20) return;
		textArea.style.height = 'auto';
		textArea.style.height = h + 'px';
	};

	uiApp.extend('resizeTextArea',resize);	
	
	/**
	* Resize textarea on inputs
	*/
	document.addEventListener('input', (ev) => {
		if(ev.target.matches('textarea')){
			resize(ev.target);
		}
	},{capture:true});
	
	/**
	* Expand textareas that are overflowing onLoad
	*/
	document.addEventListener('DOMContentLoaded', () => {
		let all = uiApp.nodeArray( document.querySelectorAll('textarea') );
		all.forEach((t)=>{
			resize(t);
		});
	});
	
	
	
})(bluejay); 