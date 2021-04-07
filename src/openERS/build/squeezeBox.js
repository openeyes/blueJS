(function( bj ) {

	'use strict';	
	
	bj.addModule('squeezeBox');
	
	// <button class="i-btn contract js-squeeze-box"></button>
	
	const squeezeBoxes = bj.nodeArray( document.querySelectorAll('.squeeze-box'));
	if( squeezeBoxes.length == 0 ) return;
	
	/**
	* Set up the squeezeBoxes
	* add the expand/contract i-Btn
	*/
	squeezeBoxes.forEach( box => {
		const button = document.createElement('button');
		button.className = "i-btn js-squeeze-box";
		
		// check box default state
		if( box.classList.contains('open')){
			button.classList.add('contract');
		} else {
			button.classList.add('expand');
		}
		
		box.prepend( button );
	});
	
	// Events
	bj.userDown('.js-squeeze-box', ev => {
		const btn = ev.target;
		const box = btn.parentNode;
		// had content summary?
		const summary = box.querySelector('.content-summary');
		
		if( btn.classList.contains('contract')){
			// collapse the squeeze box
			box.classList.replace('open','closed');
			btn.classList.replace('contract', 'expand');
			
			if( summary != null ){
				bj.show( summary );
			} 
					
		} else {
			box.classList.replace('closed','open');
			btn.classList.replace('expand','contract');
			
			if( summary != null ){
				bj.hide( summary );
			} 
		}
	});	
	

})( bluejay ); 