(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filter Btn <li>
	* @param {Object} props 
	* @param {parentNode} ul - <ul>
	* @return {Element} 
	*/
	const filterBtn = ( props, ul ) => {
		
		const filter = props.filter; 
		const count = bj.div('count');
		
		const li = document.createElement('li');
		li.className = "filter-btn js-idg-clinic-btn-filter"; 
		li.setAttribute('data-filter', filter );
		
		// build btn and add to <ul> header
		(() => {
			const div = bj.div('filter');
			// red flagged filter?
			if( props.name.startsWith('-f')){
				div.innerHTML = `<div class="name"><i class="oe-i flag-red medium-icon no-click"></div>`;
			} else {
				// change some to icons: 
				div.innerHTML = `<div class="name">${props.name}</div>`;
			}

			div.append( count );	
			li.append( div );
			ul.append( li );
		})();
		
		/**
		* updateCount
		* On any updates to clinic need to update the filter count
		* @param {Array} status - Patient row status
		* @param {Array} redflagged - 
		*/	
		const updateCount = ( status, redflagged  ) => {
			let num = 0;
			
			switch( filter ){
				case "all": num = status.length;
				break; 
				case "clinic": 
					num = status.reduce(( acc, val ) => (val != "done" && val != 'later') ? acc + 1 : acc, 0 );
				break;
				case "-f": 
					num = redflagged.reduce(( acc, val ) => val ? acc + 1 : acc, 0 );
				break;
				case "waiting": 
					num = status.reduce(( acc, val ) => (val == "waiting" || val == 'long-wait' || val == 'stuck' ) ? acc + 1 : acc, 0 );
				break;
				case "issues":
					num = status.reduce(( acc, val ) => (val == "break" || val == 'long-wait' || val == 'stuck' ) ? acc + 1 : acc, 0 );
				break;
				default: num = status.reduce(( acc, val ) => val == filter ? acc + 1 : acc, 0 );
			}
			
			// update DOM text
			count.textContent = num;
		};
		
		/**
		* Set selected btn
		* @param {String} clinicFilter - current filter for the clinic list
		*/
		const selected = ( clinicFilter ) => {
			if( clinicFilter === filter ){
				li.classList.add('selected');	
			} else {
				li.classList.remove('selected');
			}
		};
		
		return { updateCount, selected };	
	};
	
	// make component available to Clinic SPA	
	clinic.filterBtn = filterBtn;			
  
})( bluejay, bluejay.namespace('clinic')); 