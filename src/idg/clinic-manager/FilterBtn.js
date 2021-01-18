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
		const li = document.createElement('li');
		const count = bj.div('count');
		
		li.className = "filter-btn js-idg-clinic-btn-filter"; 
		li.setAttribute('data-filter', filter );
		
		
		// build btn and add to <ul> header
		(() => {
			const name = props.name;
			// check if it's short code
			const fullName = clinic.fullShortCode( name ) == name ? false : clinic.fullShortCode( name );
			
			const div = bj.div('filter');
			let html = `<div class="name">${name}</div>`;
			if( fullName ) html += `<div class="fullname">${fullName}</div>`;
			div.innerHTML = html;
			
			// only show the count for patient assignments
			if( filter !== "all" && filter !== "completed"){
				div.appendChild( count );	
			}
			
			
			
			li.appendChild( div );
			
			// update DOM
			ul.appendChild( li );
			
		})();
		
		
		const update = ( allPatientAssignments, currentFilter ) => {
			// work out the counts per filter.
			const num = allPatientAssignments.reduce((acc, assigned ) => {
				if( assigned == filter ) return acc + 1; 
				return acc;
			}, 0 );
			
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