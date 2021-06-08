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
		
		/**
		* Quick filter Btns - [ Name, filter ]
		*/
		[
			['All','all'],
			['Me', 'user'], // Not working, but capturing the UIX concept
			//['Booked','later'], // not needed for A&E?!
			['Arrived','clinic'],
			//['-f','-f'], 
			//['Active','active'],
			//['Waiting','waiting'],
			['Issues','issues'], // groups the 3 below!
			// ['Delayed','long-wait'],
			// ['No path','stuck'],
			// ['Break', 'break'],
			['Departed','discharged'], // BUT patient is still active out but still has "todo"s
			['Completed','done'],
		].forEach( btn => {
			filters.add( clinic.filterBtn({
				name: btn[0],
				filter: btn[1],
			}, quickFilters ));
		});

		const patientSearch = bj.dom('input', 'search');
		patientSearch.setAttribute('type', 'text');
		patientSearch.setAttribute('placeholder', 'Name filter');
		
		const popupBtn = ( css, name, inner ) => {
			const dom =  bj.dom('button', `${css} ${name}`, inner );
			dom.setAttribute('name', name );
			return dom;
		};
		
		document.getElementById('js-clinic-filters').append( 
			patientSearch, 
			 popupBtn('popup-filter', 'table-sort', 'Time'), 
			 quickFilters, 
			 popupBtn('popup-filter', 'waiting-for', 'Waiting for...'),
			 popupBtn('popup-filter', 'to-do', 'To-do...'),
			 popupBtn('popup-filter', 'help', '<!-- icon -->')
		);
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
/*
		bj.userDown('button.filter-all', ( ev ) => {
			clinic.pathwayPopup('advanced-filter');
		});
*/
		
		bj.userDown('#js-clinic-filters button.popup-filter', ( ev ) => {
			clinic.pathwayPopup( ev.target.name );
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