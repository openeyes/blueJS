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
		const waitingFor = bj.dom('button', 'waiting-for', 'Waiting for...');
		
		/**
		* Quick filter Btns - [ Name, filter ]
		*/
		[
			['For me', 'user'], // Not working, but capturing the UIX concept
			['All','all'],
			['Booked','later'], // not needed for A&E?!
			['Started','clinic'],
			['-f','-f'], 
			//['Active','active'],
			['Waiting','waiting'],
			['Issues','issues'], // groups the 3 below!
			// ['Delayed','long-wait'],
			// ['No path','stuck'],
			// ['Break', 'break'],
			['Incomplete','discharged'], // BUT patient is checked out but still has "todo"s
			['Completed','done'],
		].forEach( btn => {
			filters.add( clinic.filterBtn({
				name: btn[0],
				filter: btn[1],
			}, quickFilters ));
		});

		const filtersHook = document.getElementById('js-clinic-filters');
		filtersHook.innerHTML = '<input class="search" type="text" placeholder="Patient">';
		filtersHook.append( quickFilters, waitingFor, searchBtn );
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
		bj.userDown('button.filter-all', ( ev ) => {
			clinic.pathwayPopup('advanced-filter');
		});
		
		bj.userDown('button.waiting-for', ( ev ) => {
			clinic.pathwayPopup('waiting-for');
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