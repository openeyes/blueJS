(function( bj ) {

	'use strict';

	/*
	Quick demo
	When user ticks checkbox OR
	When a user toggles a radio
	Enable and focus on textarea
	*/
	
	if( document.querySelector('.js-idg-enable-textarea') == null ) return;
	
	const map = new Map();
	
	document.querySelectorAll('.js-idg-enable-textarea').forEach( wrap => {
		const idg = JSON.parse( wrap.dataset.idg );
		map.set( idg.input, idg.textarea ); // textarea is an array (could be 2)		
	});
	
	// listen for changes
	document.addEventListener('change', ev => {
		const input = ev.target;
		if(! map.has( input.name )) return; // ignore 
		
		// should the textarea be active?
		let activate = false;
		if( input.type == "radio" && input.value == "1" ) activate = true;
		if( input.type == "checkbox" && input.checked ) activate = true;
		
		// array 
		map.get( input.name ).forEach(( textareaID, index ) => {
			const textarea = document.getElementById(textareaID);
			
			if( activate ){
				textarea.disabled = false;
				if( index == 0) textarea.focus();
			} else {
				textarea.value = "";
				textarea.style.height = "";
				textarea.disabled = true;
			}
		});
	});
	
	
	
	
})( bluejay ); 