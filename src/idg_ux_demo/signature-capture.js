(function( bj ){

	'use strict';	
	
	bj.addModule('signatureCapture');
	
	/*
	Check for "capture signature" buttons 
	*/
	if( document.querySelector('.js-idg-capture-signature') === null ) return;
	

	const captureSignature = () => {		
	
		var wrapper = document.getElementById("signature-pad");
		var canvas = wrapper.querySelector("canvas");
		var clearBtn = document.getElementById('signature-pad-clear');
		var signaturePad = new SignaturePad(canvas, {
		  // It's Necessary to use an opaque color when saving image as JPEG;
		  // this option can be omitted if only saving as PNG or SVG
		  backgroundColor: 'rgb(255, 255, 255)'
		});
		
		// On mobile devices it might make more sense to listen to orientation change,
		// rather than window resize events.
		window.onresize = resizeCanvas;
		resizeCanvas();
		
		// Adjust canvas coordinate space taking into account pixel ratio,
		// to make it look crisp on mobile devices.
		// This also causes canvas to be cleared.
		function resizeCanvas() {
		  // When zoomed out to less than 100%, for some very strange reason,
		  // some browsers report devicePixelRatio as less than 1
		  // and only part of the canvas is cleared then.
		  var ratio =  Math.max(window.devicePixelRatio || 1, 1);
		
		  // This part causes the canvas to be cleared
		  canvas.width = canvas.offsetWidth * ratio;
		  canvas.height = canvas.offsetHeight * ratio;
		  canvas.getContext("2d").scale(ratio, ratio);
		
		  // This library does not listen for canvas changes, so after the canvas is automatically
		  // cleared by the browser, SignaturePad#isEmpty might still return false, even though the
		  // canvas looks empty, because the internal data of this library wasn't cleared. To make sure
		  // that the state of this library is consistent with visual state of the canvas, you
		  // have to clear it manually.
		  signaturePad.clear();
		}
		
		clearBtn.addEventListener("click", function (event) {
		  signaturePad.clear();
		});
		
	};
	
	const loadSignaturePad = () => {
		// xhr returns a Promise... 
		bj.xhr('/idg-php/v3/_load/signature-pad.php')
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
			.catch( e => console.log('signature pad: failed to load', e ));  // maybe output this to UI at somepoint, but for now...
	};
	

	/*
	Load Signature Pad library when required
	https://github.com/szimek/signature_pad
	*/
	bj.loadJS('https://cdn.jsdelivr.net/npm/signature_pad@2.3.2/dist/signature_pad.min.js', true)
	    .then( () => {
		    // loaded, ok allow user to sign...
		    bj.userDown('.js-idg-capture-signature', loadSignaturePad );
	    });
	  

})( bluejay ); 