(function( bj ){

	'use strict';	
	
	const signatureDevicePopup = () => {
		// xhr returns a Promise... 
		bj.xhr('/idg-php/v3/_load/signature-device-link.php')
			.then( xreq => {
				const div = bj.div("oe-popup-wrap");
				div.innerHTML = xreq.html;
				
				// reflow DOM
				document.body.appendChild( div );
				
				// need this in case PHP errors and doesn't build the close btn DOM
				let closeBtn = div.querySelector('.close-icon-btn');
				if(closeBtn){
					closeBtn.addEventListener("mousedown", (ev) => {
						bj.remove(div);
					}, {once:true} );
				}
				
				// init Signature Pad
				captureSignature();
				
			})
			.catch( e => console.log('signature popup: failed to load', e ));  // maybe output this to UI at somepoint, but for now...
	};
	

	bj.extend('demoSignatureDeviceLink', signatureDevicePopup);
	  

})( bluejay ); 