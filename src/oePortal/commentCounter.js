(function( bj ) {

	'use strict';	
	
	bj.addModule('commentCounter');	
	
	/**
	* Provide small UI feedback for allowed characters
	* @param { Element} <textarea> with 'add-comment'
	*/
	const countCharacters = ( textArea) => {
		// check to see if counter is added...
		const div = textArea.parentNode;
		let counter = div.querySelector('.charcounter');
		
		// if not add one
		if( counter == null ){
			counter = bj.div('charcounter');
			div.appendChild( counter );
		}		
		
		const chars = textArea.value.length;
		const max = textArea.dataset.maxcount;
		counter.textContent = `${chars}/${max} characters`;	 
	};
	
	
	document.addEventListener('input', ( ev ) => {
		if( ev.target.matches('textarea.add-comment')){
			countCharacters( ev.target );
		}
	},{ capture:true });

	
})( bluejay ); 