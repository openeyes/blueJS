(function( bj, clinic ){

	'use strict';	
	
	/**
	* Clinic clock
	*/
	const showClock = () => {
		const div = bj.div('oe-clinic-clock');
		div.textContent = "";
		div.style.top = "100%"; // move offscreen
		document.body.appendChild( div );
		
		/**
		* @callback for setInvterval
		*/
		const updateClock = () => {
			let top = "100%";
			const tableRows = bj.nodeArray( document.querySelectorAll('table.oe-clinic-list tbody tr'));
			
			// check there are rows...
			if( ! tableRows.length ){
				div.style.top = top; // move offscreen if all TRs are in the "past".
				return;
			}
			
			// table TRs have a timestamp on them, use this to position clock
			const now = Date.now();
			
			// end row position 
			top = ( tableRows[ tableRows.length-1 ].getBoundingClientRect().bottom - 9 ) + 'px'; 
			
			// but see if there are later times and adjust
			tableRows.find( tr  => {
				if( tr.dataset.timestamp > now ){
					top = ( tr.getBoundingClientRect().top - 9 ) + 'px';
					return true;
				}
			});
			
			// update clock time and position
			div.style.top = top;
			div.textContent = bj.clock24( new Date( now ));
		};
		
		/**
		* Check and update every half second
		*/
		setInterval( updateClock, 500 );
	};
	
	// make component available to Clinic SPA	
	clinic.clock = showClock;
	  

})( bluejay, bluejay.namespace('clinic')); 