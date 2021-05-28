(function( bj ) {

	'use strict';

	/*
	Demo the expand / collapse 
	these are also on a demo home hub!
	*/
	bj.userDown('.js-idg-fav-demo .expand-fav i', ( ev ) => {
		const icon = ev.target;
		const fav = bj.getParent( icon, '.fav');
		if( icon.classList.contains('expand')){
			icon.classList.replace('expand','collapse');
			bj.show( fav.querySelector('.js-full-details'));
		} else {
			icon.classList.replace('collapse','expand');
			bj.hide( fav.querySelector('.js-full-details'));
		}
	});
	
	
})( bluejay ); 