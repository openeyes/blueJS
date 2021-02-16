(function( bj ) {

	'use strict';	
	
	bj.addModule('textAreaResize');	
	
	const offset = 5;
	
	/**
	* Resize textarea 
	* @param {HTMLElement} <textarea>
	*/ 
	const resize = ( textArea ) => {
		const h = textArea.scrollHeight;
		// check for line jumps
		if( (h - textArea.clientHeight) > 15 ){
			textArea.style.height = 'auto';
			textArea.style.height = h + 5 + 'px';
		}		
	};
	
	/**
	Make resize available for comments that reveal a textarea
	*/
	bj.extend('resizeTextArea', resize);	
	

	/**
	* Resize textarea on 'input'
	*/
	document.addEventListener( 'input', ( ev ) => {
		if( ev.target.matches('textarea')){
			resize( ev.target );
		}
	},{ capture: true });
	
	/**
	* Expand textareas that are overflowing onLoad
	*/
	document.addEventListener('DOMContentLoaded', () => {
		let all = bj.nodeArray( document.querySelectorAll('textarea') );
		all.forEach((t)=>{
			resize(t);
		});
	}, { once: true });
	
})( bluejay ); 