(function (uiApp) {

	'use strict';
	
	uiApp.addModule('overlayPopupJSON');
	
	/*
	New approach to loading Popups (class based, rather than id) 
	Assumes node has a data-idgDemo={JSON}
	in JSON should be a PHP file path e.g, /file.php?name=value
	it also assumes the standard popup close btn structure (... JSON could provide)
	*/
	
	const showPopup = (ev) => {
		let php; 
		
		if(ev.target.dataset.idgDemo !== undefined){
			php = JSON.parse(ev.target.dataset.idgDemo).php;
		} else {
			throw new Error('overlayPopupJSON: No php file info? Needs data-idg-demo=json');
		}

		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/' + php)
			.then( xreq => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = xreq.html;
				// reflow DOM
				document.body.appendChild( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-icon-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.remove(div);
					}, {once:true} );
				}
			})
			.catch(e => console.log('overlayPopupJSON: Failed to load',e));  // maybe output this to UI at somepoint, but for now... 
	};
	
	
	uiApp.userDown('.js-idg-demo-popup-json', showPopup);
			
})(bluejay); 