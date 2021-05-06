(function( bj ) {

	'use strict';
	
	bj.addModule('popup');
	
	/*
	New approach to loading Popups (class based, rather than id) 
	Assumes node has a data-idgDemo={JSON}
	in JSON should be a PHP file path e.g, /file.php?name=value
	it also assumes the standard popup close btn structure (... JSON could provide)
	*/
	
	const popup = ( ev ) => {
		let php = ev.target.dataset.php;
		if( php == undefined ){
			throw new Error('popup: loads in PHP file from data-php attribute, this seems to be missing? ');
		}

		// xhr returns a Promise... 
		bj.xhr( php )
			.then( xreq => {
				const div = document.createElement('div');
				div.className = "popup-wrap";
				div.innerHTML = xreq.html;
				
				// reflow DOM
				document.body.append( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-i-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						bj.remove( div );
					},{ once:true });
				}
			})
			.catch( e => console.log('Popu[: Failed to load', e ));  // maybe output this to UI at somepoint, but for now... 
	};
	
	
	bj.userDown('.js-popup-json', popup );
			
})( bluejay ); 