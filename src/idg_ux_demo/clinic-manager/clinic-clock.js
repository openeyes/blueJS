(function( bj, clinic ){

	'use strict';	
	
	/**
	* Clinic clock
	* @param {Element} tbody - Each "clock" needs linking to it's own table
	*/
	const showClock = ( tbody ) => {
		const div = bj.div('oec-clock');
		bj.hide( div );
		
		// find the worklist group 
		const group = bj.getParent( tbody, '.oec-group');
		group.append( div );
		
		
		/**
		* @callback for setInvterval
		*/
		const updateClock = () => {
			const tableRows = bj.nodeArray( tbody.querySelectorAll('tr'));
			
			// check there are rows...
			if( ! tableRows.length ){
				bj.hide( div );
				return;
			} 
			
			// assume last table row as default
			let clockRow = tableRows[ tableRows.length - 1];
			
			// table TRs have a timestamp on them, use this to position clock
			const now = Date.now();
			
			// if there are later times than "now" change tr.
			tableRows.find( tr  => {
				if( tr.dataset.timestamp > now ){
					clockRow = tr;
					return true;
				}
			});
			
			// get the position:
			const top = clockRow.getBoundingClientRect().bottom;
			
			if( top < 160 ){
				bj.hide( div ); // offscreen!
			} else {
				bj.show( div );
			}
			
			// update clock time and position
			div.style.top = `${ top  }px`;
			div.textContent = bj.clock24( new Date( now ));
		};
		
		/**
		* Check and update every half second
		*/
		setTimeout(() => {
			// set top here otherwise it flickers in
			// need to allow time for the <tbody> render
			div.style.top = `${ tbody.getBoundingClientRect().bottom  }px`;
			setInterval( updateClock, 500 );
		}, 1000 );
		
	};
	
	// make component available to Clinic SPA	
	clinic.clock = showClock;
	  

})( bluejay, bluejay.namespace('clinic')); 