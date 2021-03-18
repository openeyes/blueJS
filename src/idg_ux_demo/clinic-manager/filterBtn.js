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
			div.innerHTML = `<div class="name">${props.name}</div>`;
			if( filter !== "hide-done") div.append( count );	
			li.append( div );
			ul.append( li );
		})();
		
		/**
		* API - update
		* On any updates to clinic need to update the filter count
		* @param {Array} status - all status setting for all patients
		* @param {String} currentFilter - current filter for the clinic list
		*/	
		const update = ( status, currentFilter ) => {
			let num = 0;
			
			if( filter == "all"){
				num = status.length;
			} else {
				// work out the counts per filter.
				num = status.reduce(( acc, val ) => {
					if( val == filter ) return acc + 1; 
					return acc;
				}, 0 );
			}
			
			
			
			// update DOM
			count.textContent = num;
			
			if( currentFilter === filter ){
				li.classList.add('selected');	
			} else {
				li.classList.remove('selected');
			}
			
		};
		
		return { update };	
	};
	
	// make component available to Clinic SPA	
	clinic.filterBtn = filterBtn;			
  
})( bluejay, bluejay.namespace('clinic')); 