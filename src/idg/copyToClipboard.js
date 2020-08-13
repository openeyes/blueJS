(function( bj ) {

	'use strict';
	
	bj.addModule('copyToClipboard');
	
	/**
	"js-copy-to-clipboard"
	new 
	js-copytext-to-clipboard
	*/
	
	
	const copy = ( ev ) => {
		console.log( ev.target.textContent);
	}
	
	
	/**
	* Use the clipboard API (if available)
	* @param {String} str
	*/
	const copyToClipboard = ( str ) => {
		
		if( !navigator.clipboard) return;
		
		// returns a Promise
		navigator.clipboard.writeText( str ).then(
			() => {
				success();
			}, () => {
				failed();
		});
	}
	
	bj.userDown('.js-copytext-to-clipboard', copy )
		
		
})( bluejay ); 