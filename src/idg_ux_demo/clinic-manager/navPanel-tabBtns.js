(function( bj ){

	'use strict';	
	
	/**
	* Nav worklist panel
	* Link up the buttons to the actual lists in the DOM
	* Also demo switching to "No context"
	*/
	
	const listPanel = document.getElementById('js-worklists-panel');
	if( listPanel === null ) return;
	
	
	const lists = document.getElementById("js-idg-worklist-panel-lists");
	const favourites = document.getElementById("js-idg-worklist-panel-favourites");

	bj.userDown('#js-idg-worklist-tab-btns > button', ev => {
		listPanel.querySelector('#js-idg-worklist-tab-btns > button.selected').classList.remove('selected');
		
		const btn = ev.target;
		btn.classList.add("selected");
		
		if( btn.name == "lists" ){
			bj.show( lists );
			bj.hide( favourites );
		} else {
			bj.hide( lists );
			bj.show( favourites );;
		}
	});			
			
  
})( bluejay ); 