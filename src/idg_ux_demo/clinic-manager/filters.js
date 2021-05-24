(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filters
	*/
	const filters = () => {

		const mode = "clinic";
		
		// Filter btns in the <header>
		const filters = new Set();
		
		/**
		Add Filter btns to <header> - these apply to all Worklists
		*/		
		const quickFilters = bj.dom('ul', "quick-filters");
		const searchBtn = bj.dom('button', 'filter-all');
		
		/**
		* Quick filter Btns - [ Name, filter ]
		*/
		[
			['All','all'],
			['Scheduled','later'], // not needed for A&E?!
			['Started','clinic'],
			['-f','-f'], 
			['Active','active'],
			['Waiting','waiting'],
			['Delayed','long-wait'],
			['No path','stuck'],
			['Break', 'break'],
			['Completed','done'],
		].forEach( btn => {
			filters.add( clinic.filterBtn({
				name: btn[0],
				filter: btn[1],
			}, quickFilters ));
		});

		const filtersHook = document.getElementById('js-clinic-filters');
		filtersHook.innerHTML = '<input class="search" type="text" placeholder="Patient">';
		filtersHook.append( quickFilters, searchBtn );
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
		bj.userDown('button.filter-all', ( ev ) => {
			clinic.pathwayPopup('advanced-filter');
		});
		
		/**
		* @method
		* Everytime a patient changes state or the view filter mode
		* is updated we need to update all the filter btns.
		* @param {Array} status 
		* @param {Array} risks 
		*/
		const updateCount = ( ...args ) => {
			filters.forEach( btn => btn.updateCount( ...args ));
		};
		
		const selected = ( filter ) => {
			filters.forEach( btn => btn.selected( filter ));
		};
		
		return { updateCount, selected };	
	};
	
	// make component available to Clinic SPA	
	clinic.filters = filters;			
  
})( bluejay, bluejay.namespace('clinic')); 