(function( bj ) {

	'use strict';
	
	const listManager = document.getElementById('js-worklist-manager');

	if( listManager === null ) return;
	
	/*
	List mode: button names: "all"
	iDG will set up a default state	
	*/
	const checkBoxes = bj.nodeArray( listManager.querySelectorAll('input[type=checkbox]'));
	const allBtn = listManager.querySelector('button[name=all]');

	// User changes mode
	const checkAll = ( b ) => {
		// set up all the list states based on the mode selection
		checkBoxes.forEach( input => input.checked = b );
	};
	
	// list to the input checkboxes (only thing that changes)
	listManager.addEventListener('change', ev => {
		allBtn.classList.remove('selected');
	});
	

	allBtn.addEventListener('mousedown', ev => {
		if( allBtn.classList.contains("selected")){
			checkAll( false );
			allBtn.classList.remove('selected');
			setTimeout(() => allBtn.blur(), 100);
		} else {
			checkAll( true ); 
			
			allBtn.classList.add('selected');
		}
	});
	
	
})( bluejay ); 