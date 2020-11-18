(function( bj ){

	'use strict';	
	
	/**
	* Clinic clock is so simple keeping it Vanilla
	* however, need to keep it out of the DOM that React is controlling.
	*/
	const addClinicClock = () => {
		const div = bj.div('oe-clinic-clock');
		div.textContent = "";
		div.style.top = "100%";
		document.body.appendChild( div );
		

		const updateClock = () => {
			const tableRows = bj.nodeArray( document.querySelectorAll('table.oe-clinic-list tbody tr'));
			
			// there should always be a table, but in case not...
			if( ! tableRows.length ){
				div.style.top = "100%";
				return;
			}
			
			// table TRs have a timestamp on them, this is provided by ReactJS
			const now = Date.now();
			
			// move offscreen if all TRs are in the "past". 
			let top = "100%"; 
			
			// find the next row booked time
			tableRows.every( tr  => {
				if( tr.dataset.timestamp > now ){
					top = ( tr.getBoundingClientRect().top - 4 ) + 'px';
					return false; // found it.
				} else {
					return true; // keep looking
				}
			});
			
			// update clock time and position
			div.style.top = top;
			div.textContent = bj.clock24( new Date( now ));
		};
		
		// check and update every second.
		setInterval( updateClock, 1000 );
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', addClinicClock, { once: true });
	  

})( bluejay ); 