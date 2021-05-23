(function( bj, clinic ){

	'use strict';	
	
	/**
	* Adder configurable popup step
	*/
	const popup = ( stepCode ) => {
		// keeping this pretty basic to demo the UIX concept
		let php; 
		switch( stepCode ){
			case 'i-drug-admin': php = "drugadmin-preset-orders.php";
			break;
			default: php = `${ stepCode}.php`;
		}

		// xhr returns a Promise... 
		bj.xhr('/idg-php/load/pathway-popups/' + php)
			.then( xreq => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = xreq.html;
				// reflow DOM
				document.body.append( div );
				
				// fake a click through
				// steps are already added (config makes no difference but shows the UIX)
				div.querySelector('.js-fake-add')
					.addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						bj.remove(div);
					},{ once:true });
					
				// cancel is handled by the Clinic app
			})
			.catch(e => console.log('overlayPopupJSON: Failed to load',e));  // maybe output this to UI at somepoint, but for now...	
	};
	
	// make component available to Clinic SPA	
	clinic.pathwayPopup = popup;			
  
})( bluejay, bluejay.namespace('clinic')); 