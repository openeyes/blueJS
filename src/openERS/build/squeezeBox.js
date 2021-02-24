(function( bj ) {

	'use strict';	
	
	bj.addModule('squeezeBox');
	
	// <button class="i-btn contract js-squeeze-box"></button>
	
	const squeezeBoxes = bj.nodeArray( document.querySelectorAll('.squeeze-box'));
	if( squeezeBoxes.length == 0 ) return;
	
	squeezeBoxes.forEach( box => {
		const button = document.createElement('button');
		button.className = "i-btn js-squeeze-box";
		
		// check box default state
		if( box.classList.contains('open')){
			button.classList.add('contract');
		} else {
			button.classList.add('expand');
		}
		
		box.prepend( button);
	});
	
	// Events
	bj.userDown( '.js-squeeze-box', ev => {
		const btn = ev.target;
		const box = btn.parentNode;
		
		if( btn.classList.contains('contract')){
			box.classList.replace('open','closed');
			btn.classList.replace('contract', 'expand');
		} else {
			box.classList.replace('closed','open');
			btn.classList.replace('expand','contract');
		}
	});	
	

})( bluejay ); 