(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('textAreaResize');	
	
	/**
	* Resize textarea 
	* @param {HTMLElement} <textarea>
	*/ 
	const resize = ( textArea ) => {
		let h = textArea.scrollHeight;
		// check for line jumps
		if( (h - textArea.clientHeight) > 15 ){
			textArea.style.height = 'auto';
			textArea.style.height = h + 5 + 'px';
		}		
	};
	
	/**
	Make resize available for comments that reveal a textarea
	*/
	uiApp.extend('resizeTextArea',resize);	
	

	/**
	* Resize textarea on 'input'
	*/
	document.addEventListener('input', ( ev ) => {
		if(ev.target.tagName == "TEXTAREA"){
			resize( ev.target );
		}
	}, false );
	
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