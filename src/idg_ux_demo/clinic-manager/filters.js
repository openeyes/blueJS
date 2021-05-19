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
		const searchFilters = bj.div('search-filters');
		const searchBtn = bj.dom('button', 'search-all');
		
		bj.hide( searchFilters );

		// Quick filter Btns - [ Name, filter ]
		[
			['All','all'],
			['Scheduled','later'], // not needed for A&E
			['Started','clinic'],
			['-f','-f'], 
			//['-r2','-r2'],
			//['-r3','-r3'],
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
		
		// Advanced search complex filters (not working in iDG)
		searchFilters.innerHTML = Mustache.render( [
			`<input class="search" type="text" placeholder="Patient or number">`,	
			`<div class="group"><select>{{#age}}<option>{{.}}</option>{{/age}}</select></div>`,
			`<div class="group"><select>{{#wait}}<option>{{.}}</option>{{/wait}}</select></div>`,
			`<div class="group"><select>{{#step}}<option>{{.}}</option>{{/step}}</select></div>`,
			`<div class="group"><select>{{#assigned}}<option>{{.}}</option>{{/assigned}}</select></div>`,
			`<div class="group"><select>{{#flags}}<option>{{.}}</option>{{/flags}}</select></div>`,
			`<div class="group"><select>{{#risks}}<option>{{.}}</option>{{/risks}}</select></div>`,
			`<div class="group"><select>{{#states}}<option>{{.}}</option>{{/states}}</select></div>`,
		].join(''), {
			age: ['All ages', '0 - 16y Paeds', '16y+ Adults'],
			wait: ['Wait time', '0 - 1hr', '2hr - 3hr', '3hr - 4rh', '4hr +'],
			step: ['Location/Waiting for', 'Visual acuity', 'Fields', 'Colour photos', 'OCT', 'Dilate'],
			assigned: ['People', 'Unassigned', 'Nurse', 'Dr', 'Dr Georg Joseph Beer', 'Dr George Bartischy', 'Mr Michael Morgan', 'Sushruta', 'Dr Zofia Falkowska'],
			flags: ['Flagged', 'Change in puplis', 'Systemically unwell', 'etc..', 'Not flagged'],
			risks: ['Risks/Priortiy', 'High/Immediate', 'Medium/Urgent', 'Low/Standard' ],
			states: ['in Clinic', 'Scheduled', 'All'],
		});
		
		document.getElementById('js-clinic-filters').append( quickFilters, searchFilters, searchBtn );
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
		bj.userDown('button.search-all', ( ev ) => {
			const btn = ev.target;
			const quick = document.querySelector('.clinic-filters ul.quick-filters');
			
			if( btn.classList.contains('close')){
				btn.classList.remove('close');
				bj.hide( searchFilters );
				bj.show( quickFilters );
			} else {
				btn.classList.add('close');
				bj.hide( quickFilters );
				bj.show( searchFilters );
			}
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