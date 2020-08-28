(function( bj ) {

	'use strict';
	
	bj.addModule('copyToClipboard');
	
	/**
	current: "js-copy-to-clipboard"
	new: "js-clipboard-copy"
	*/
	
	const selector = '.js-clipboard-copy';
	
	if( document.querySelector( selector ) === null ) return;
	
	/*
	Added to the hospital number and nhs number, provide a UI clue	
	*/
	const all = bj.nodeArray( document.querySelectorAll( selector ));
	all.forEach( ( elem )=>{
		elem.style.cursor = "pointer";	
	});
	
	/**
	* Copy success!
	* @param {Element} elem - <span>
	*/
	const success = ( elem ) => {
		
		let domRect = elem.getBoundingClientRect();
		let center = domRect.right - (domRect.width/2);
		let top = domRect.top - 5;
		let tipHeight = 30;
		
		const div = document.createElement( 'div' );
		div.className = "oe-tooltip fade-out";
		div.innerHTML = 'Copied';
		div.style.width = '80px'; // overide the newblue CSS
		div.style.top = ( top - tipHeight )+ 'px';
		div.style.left = ( center - 40 ) + 'px';
		bj.appendTo('body', div);
		
		setTimeout(() => bj.removeElement( div ) , 2500 ); // CSS fade out takes 2 secs.
	};
	

	/**
	* Use the clipboard API (if available)
	* @param {Element} elem - <span>
	*/
	const copyToClipboard = ( elem ) => {
		/*
		Note that the API only works when served over secured domains (https) 
		or localhost and when the page is the browser's currently active tab.
		*/
		if(navigator.clipboard){
			// if availabld use ASYNC new API
			navigator.clipboard.writeText( elem.textContent )
				.then(() => {
					bj.log('[ASYNC] copied text to clipboard');
					success( elem );
				})
				.catch(err => {
					bj.log('failed to copy text to clipboard');
				});
		} else {
			// or use the old skool method
			const input = document.createElement('input');
			input.value = elem.textContent;
			input.style.position = "absolute";
			input.style.top = '-200px';
			
			document.body.appendChild( input );
			
			input.select();
	
			document.execCommand("copy");
			
			success( elem );
			
			// clean up DOM
			bj.removeElement( input );
		}		
	};
	
	/*
	Events
	*/
	
	bj.userDown( selector, ( ev ) => copyToClipboard( ev.target ));
		
})( bluejay ); 