(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* App
	* @param {Element} tbody = <tbody>
	* @param {JSON} json - data to initiate with
	*/
	const app = ( tbody, json ) => {
		
		const root = document.querySelector('.oe-clinic');
		const patients = new Map();
		const filters = new Set();
		const adder = clinic.adder();
	
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_filter: "", // clinic filter state
			delayID: null,
			
			get filter(){
				return this._filter;
			},
			set filter( val ){
				this._filter = val; 
				this.views.notify();
			},
			
			/* 
			Delay the view filters updates
			Allow the user to see what happened then update
			If they are not using the popup
			*/
			updateFilterView(){
				if( this.delayID ) clearTimeout( this.delayID );
				this.delayID = setTimeout(() => {
					// check user isn't working on a step first!
					if( document.querySelector('.oe-pathstep-popup') == null ){
						this.views.notify();
					}
					this.delayID = null;
				}, 750 );
			}
			
		}, bj.ModelViews());

		/**
		* VIEW
		* Filter Patients in Clinic and render DOM 
		*/
		const onFilterPatients = () => {
			// build new <tbody>
			const fragment = new DocumentFragment();
			
			// Patients decide if they match the filter
			// if so, show in the DOM and update the filterPatients set
			patients.forEach( patient => {
				const tr = patient.render( model.filter );
				if( tr != null ){
					fragment.appendChild( tr );
				}
			});
			
			// update <tbody>
			bj.empty( tbody );
			tbody.append( fragment );
		};
		
		model.views.add( onFilterPatients );
		
		/**
		* VIEW
		* Update Filter Buttons
		* Loop through patients and get their status
		* Filter btns will figure out their count
		*/
		const updateFilters = () => {
			const status = [];
			patients.forEach( patient => status.push( patient.getStatus()));
			filters.forEach( filter => filter.update( status, model.filter ));
		};
		
		model.views.add( updateFilters );

		/**
		* Add steps to patients
		* Insert step option is pressed. Update selected patients
		* @param {Object} dataset from <li>
		*/
		const handleAddStepToPatients = ({ code, type }) => {
			// get the IDs for the checked patients
			const patientIDs = getAllSelectedPatients();
			
			// add to pathways...
			patientIDs.forEach( key => {
				const patient = patients.get( key );
				
				if( code == 'c-last' ){
					// Remove last step button
					patient.removePathStep( code );
				} else {
					patient.addPathStep({
						shortcode: code, // pass in code
						mins: 0,
						status: 'todo',
						type, // pass in type
					});
				}	
			});
		};
		
		/**
		* Patient select checkboxes
		* select all/none (tick in <th>) 
		*/
		const selectAllPatients = ( checked) => {
			const allTicks = bj.nodeArray( root.querySelectorAll('input.js-check-patient'));
			allTicks.forEach(( tick, index ) => {
				if( index ) tick.checked = checked; // ignore the "all" tick in <th>
			});
		};
		
		/**
		* Deselect and remove the adder 
		*/
		const deselectAllPatients = () => {
			const allTicks = bj.nodeArray( root.querySelectorAll('input.js-check-patient'));
			allTicks.forEach( tick => tick.checked = false );
			adder.hide();
		};
		
		/**
		* Get all the selected patients (ticked)
		* get ids from the value
		* @returns {Set} ids
		*/
		const getAllSelectedPatients = () => {
			const ids = new Set();
			const allTicks = bj.nodeArray( root.querySelectorAll('input.js-check-patient'));
			allTicks.forEach(( tick, index ) => {
				if( index && tick.checked ) ids.add( tick.value); // ignore the "all" tick
			});
			
			return ids;
		};
		
		/**
		* Event delegation
		*/
		
		// Button: "Arrived"
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			const id = ev.target.dataset.patient;
			patients.get( id ).onArrived();
			model.updateFilterView();
		});
		
		// Button: "DNA"
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		// Icon: "tick" (completed)
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onComplete();
			model.updateFilterView();
		});
		
		// Filter button (in header bar)
		bj.userDown('.js-idg-clinic-btn-filter', ( ev ) => {
			deselectAllPatients();
			model.filter = ev.target.dataset.filter;
			gui.pathStepPopup.remove();
		});
		
		/*
		* Advanced search filter in header
		* Not doing anything - just show/hide it
		*/
		bj.userDown('button.search-all', ( ev ) => {
			const btn = ev.target;
			const quick = document.querySelector('.clinic-filters ul.quick-filters');
			const search = document.querySelector('.clinic-filters .search-filters');
			
			if( btn.classList.contains('close')){
				btn.classList.remove('close');
				bj.hide( search );
				bj.show( quick );
			} else {
				btn.classList.add('close');
				bj.hide( quick );
				bj.show( search );
			}
		});
		
		/*
		* Adder 
		* User clicks on a step to add it to patients
		*/
		bj.userDown('.oe-clinic-adder .insert-steps li', ( ev ) => {
			handleAddStepToPatients( ev.target.dataset );
		});
		
		// Adder close btn
		bj.userDown('.oe-clinic-adder .close-btn', deselectAllPatients );
		
		/*
		* Patient select checkboxes 
		* anytime any is checked show the adder
		*/
		root.addEventListener('change', ev => {
			ev.stopPropagation();
			const input = ev.target;
			if( input.matches('.js-check-patient')){
				if( input.checked ){
					adder.show();
				}
				if( input.value == "all"){
					selectAllPatients( input.checked );
				}
			}
		}, { useCapture:true });
		
		/**
		* Init Patients and set an inital state from the JSON	
		* Add filters in the header bar
		*/
		(() => {
			/**
			* Build patients (<tr>)
			* and build Map
			*/
			json.forEach( patient => patients.set( patient.uid, clinic.patient( patient )));
			
			/**
			* Filters in header
			*/
			const div = document.getElementById('js-clinic-filters'); // option-right area in in the <header>
			const ul = bj.dom('ul', "quick-filters" ); // Quick filters based on patient status
			
			// Filter Btns - [ Name, filter ]
			[
				['Clinic','clinic'], 
				['All','all'],
				['Active','active'],
				['Waiting','waiting'],
				['Delayed','long-wait'],
				['No path','stuck'],
				['Scheduled','later'], // not needed for A&E
				['Completed','done'],
			].forEach( btn => {
				filters.add( clinic.filterBtn({
					name: btn[0],
					filter: btn[1],
				}, ul ));
			});
			
			const searchBtn = bj.dom('button', 'search-all');
			const searchFilters = bj.div('search-filters');
			searchFilters.style.display = "none";
			
			searchFilters.innerHTML = Mustache.render( [
				`<input class="search" type="text" placeholder="Patient name or number">`,
				`<div class="group"><select>{{#age}}<option>{{.}}</option>{{/age}}</select></div>`,
				`<div class="group"><select>{{#wait}}<option>{{.}}</option>{{/wait}}</select></div>`,
				`<div class="group"><select>{{#step}}<option>{{.}}</option>{{/step}}</select></div>`,
				`<div class="group"><select>{{#assigned}}<option>{{.}}</option>{{/assigned}}</select></div>`,
				`<div class="group"><select>{{#flags}}<option>{{.}}</option>{{/flags}}</select></div>`,
				`<div class="group"><select>{{#states}}<option>{{.}}</option>{{/states}}</select></div>`,
			].join(''), {
				age: ['All ages', '0 - 16y Paeds', '16y+ Adults'],
				wait: ['Wait - all', '0 - 1hr', '2hr - 3hr', '3hr - 4rh', '4hr +'],
				step: ['Steps - all', 'Waiting - Triage', 'Waiting - Nurse', 'Waiting - Doctor', 'VisAcu - Visual Acuity', 'Dilate', 'etc, etc ...'],
				assigned: ['Assigned - all', 'Unassigned', 'GJB - Dr Georg Joseph Beer', 'GP - Dr George Bartischy', 'MM - Mr Michael Morgan', 'Su - Sushruta', 'ZF - Dr Zofia Falkowska'],
				flags: ['Flags - all', 'No Flags', 'Change in pupils', 'Diplopia', 'Post Op Diplopia', 'Rapid change in VA', 'Systemically unwell'],
				states: ['in Clinic', 'Waiting', 'Delayed', 'No path', 'Scheduled', 'Completed'],
			});
			
			// build DOM
			div.append( ul, searchFilters, searchBtn );

			// set up Clinic filter default
			model.filter = "clinic";
			
			/**
			* Custom Event: If a patient changes it status
			*/
			document.addEventListener('onClinicPatientStatusChange', ( ev ) => {
				model.updateFilterView();
			});
		
			// and the clock is running! 
			clinic.clock();
			
		})();
	};

	// add to namespace
	clinic.app = app;			

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 