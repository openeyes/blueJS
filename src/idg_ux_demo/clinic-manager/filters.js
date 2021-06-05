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
		const sortBtn = bj.dom('button', 'table-sort', 'Time');
		const waitingFor = bj.dom('button', 'to-do', 'To-do ...');
		
		/**
		* Quick filter Btns - [ Name, filter ]
		*/
		[
			//['For me', 'user'], // Not working, but capturing the UIX concept
			['All','all'],
			//['Booked','later'], // not needed for A&E?!
			['Checked in','clinic'],
			//['-f','-f'], 
			//['Active','active'],
			//['Waiting','waiting'],
			['Checked out','discharged'], // BUT patient is checked out but still has "todo"s
			['Issues','issues'], // groups the 3 below!
			// ['Delayed','long-wait'],
			// ['No path','stuck'],
			// ['Break', 'break'],
			//['Completed','done'],
		].forEach( btn => {
			filters.add( clinic.filterBtn({
				name: btn[0],
				filter: btn[1],
			}, quickFilters ));
		});

		const filtersHook = document.getElementById('js-clinic-filters');
		const patientSearch = bj.dom('input', 'search');
		patientSearch.setAttribute('type', 'text');
		patientSearch.setAttribute('placeholder', 'Name filter');
		filtersHook.append( patientSearch, sortBtn, quickFilters, waitingFor );
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
/*
		bj.userDown('button.filter-all', ( ev ) => {
			clinic.pathwayPopup('advanced-filter');
		});
*/
		
		bj.userDown('#js-clinic-filters button.to-do', ( ev ) => {
			clinic.pathwayPopup('to-do');
		});
		
		bj.userDown('#js-clinic-filters button.table-sort', ( ev ) => {
			clinic.pathwayPopup('table-sort');
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