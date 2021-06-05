(function( bj ){

	'use strict';	
	
	/**
	* Nav worklist panel
	* Link up the buttons to the actual lists in the DOM
	* Also demo switching to "No context"
	*/
	
	const listPanel = document.getElementById('js-worklists-panel');
	if( listPanel === null ) return;
	
	// Lists / Favourites / Recents
	const tabPanels = document.querySelectorAll('.js-idg-tab-panel');

	bj.userDown('#js-idg-worklist-tab-btns > button', ev => {
		listPanel.querySelector('#js-idg-worklist-tab-btns > button.selected').classList.remove('selected');
		
		// flag the clicked one
		const btn = ev.target;
		btn.classList.add("selected");
		
		tabPanels.forEach( panel => {
			if( panel.classList.contains( btn.name )){
				bj.show( panel );
			} else {
				bj.hide( panel );
			}
		});
	});			
			
  
})( bluejay ); 