(function( bj ) {

	'use strict';
	
	const listManager = document.getElementById('js-worklist-manager');

	if( listManager === null ) return;
	
	/*
	List mode: button names: "all" / "single" / "multi"
	iDG will set up a default state	
	*/
	const modeBtns = bj.nodeArray( listManager.getElementsByTagName('button'));
	const checkBoxes = bj.nodeArray( listManager.querySelectorAll('input[type=checkbox]'));
	
	// work out the mode from the default selected button
	let mode = listManager.querySelector('button.selected').name;
	
	// User changes mode
	const changeMode = ( btnTarget ) => {
		modeBtns.forEach( btn => {
			if( btn == btnTarget ){
				btn.className = "selected";
				mode = btn.name; 
			} else {
				btn.className = "";
			}
		});
		
		// set up all the list states based on the mode selection
		checkBoxes.forEach( input => {
			input.checked = mode === "all" ? true : false;
		});
	}
	
	const userSelectsList = ( inputTarget ) => {
		if( mode == "single"){
			// make it like a radio
			checkBoxes.forEach( input => {
				if( input !== inputTarget ) input.checked = false;
			});
		}
	}
	
	// list to the input checkboxes (only thing that changes)
	listManager.addEventListener('change', ev => {
		userSelectsList( ev.target );
	});
	

	bj.userDown('div.list-mode button', ev => {
		changeMode( ev.target );
	});
	
	
})( bluejay ); 