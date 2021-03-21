(function( bj, clinic, gui ){

	'use strict';	
	
	const app = ( tbody, json ) => {
		
		const patients = new Map();
		const filters = new Set();
		const adder = clinic.adder( json );
		let adderAllBtn;
	
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_filter: "", // view filter
			delayID: null,
			get filter(){
				return this._filter;
			},
			set filter( val ){
				this._filter = val; 
				this.views.notify();
			},
			// slightly delay the view filters
			updateFilterView(){
				if( this.delayID ) return;
				this.delayID = setTimeout(() => {
					this.views.notify();
					this.delayID = null;
				}, 750 );
			}
			
		}, bj.ModelViews());

		/**
		* VIEW: Filter Patients in Clinic
		*/
		const filterPatients = () => {
			const fragment = new DocumentFragment();
			patients.forEach( patient => {
				const tr = patient.render( model.filter );
				if( tr != null )fragment.appendChild( tr );
			});
			
			// update <tbody>
			bj.empty( tbody );
			tbody.append( fragment );
		};
		
		model.views.add( filterPatients );
		
		/**
		* VIEW: Update Filter Buttons
		* loop through patients and get their status
		*/
		const updateFilters = () => {
			const status = [];
			patients.forEach( patient => status.push( patient.getStatus()));
			filters.forEach( filter => filter.update( status, model.filter ));
		};
		
		model.views.add( updateFilters );

		/**
		* Adder: when an update options is pressed. Update all selected patients
		* @param {String} code - shortcode
		* @param {String} type - option type (assign, people, process)
		*/
		const updateSelectedPatients = ( code, type ) => {
			adder.getSelectedPatients().forEach( key => {
				const patient = patients.get( key );
				if( type == 'assign'){
					patient.setAssigned( code );
					updateFilters();
				} else {
					patient.addPathStep({
						shortcode: code,
						timestamp: false,
						status: 'todo',
						type,
					});
				}
			});
		};
		
		const hideAdder = () => {
			adderAllBtn.classList.replace('close', 'open');
			adder.hide();
		};
		
		/**
		* Event delegation
		*/
		
		// Button: "Arrived"
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			const id = ev.target.dataset.patient;
			patients.get( id ).onArrived();
			adder.onPatientArrived( id );
			model.updateFilterView();
		});
		
		// Button: "DNA"
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		// Icon: "tick" (complete)
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onComplete();
			model.updateFilterView();
		});
		
		// Filter button (in header bar)
		bj.userDown('.js-idg-clinic-btn-filter', ( ev ) => {
			model.filter = ev.target.dataset.filter;
			hideAdder();
			gui.pathStepPopup.remove();
			
		});
		
		//  + icon specific for patient (<tr>)
		bj.userDown('.js-idg-clinic-icon-add', ( ev ) => {
			const id = ev.target.dataset.patient;
			adder.showSingle( 
				id, 
				patients.get( id ).getTime(),
				patients.get( id ).getLastname()
			);
		});
		
		//  + icon for ALL patients in header
		bj.userDown('button.add-to-all', ( ev ) => {
			if( adderAllBtn.classList.contains('open')){
				adderAllBtn.classList.replace('open', 'close');
				adder.showAll();
			} else {
				hideAdder();
			}
		});
		
		//  Advanced search filter in header
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
		
		// Adder popup update action 
		bj.userDown('.oe-clinic-adder .update-actions li', ( ev ) => {
			updateSelectedPatients(
				ev.target.dataset.shortcode, 
				ev.target.dataset.type
			);
		});
		
		// Adder close btn
		bj.userDown('.oe-clinic-adder .close-btn', hideAdder );
		
		/**
		* Init Patients and set state from the JSON	
		* Add filters in the header bar
		*/
		(() => {
			// build patients (<tr>)
			json.forEach( patient => patients.set( patient.uid, clinic.patient( patient )));
			
			// option-right area in in the <header>
			const div = document.getElementById('js-clinic-filters');
			
			// Quick filters based on patient status
			const ul = bj.dom('ul', "quick-filters" );
			
			[
				['Hide done','hide-done'], 
				['All','all'],
				['Active','active'],
				['Waiting','waiting'],
				['Stuck','stuck'],
				//['Later','later'], // not needed for A&E
				['Done','complete'],
			].forEach( btn => {
				filters.add( clinic.filterBtn({
					name: btn[0],
					filter: btn[1],
				}, ul ));
			});
			
			adderAllBtn = bj.dom('button', "add-to-all open");
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
				age: ['All ages', '0 - 6y', '6 - 12y', '12 - 18y', '18 - 30y', '40 - 50y','50 - 60y'],
				wait: ['Wait - all', '0 - 1hr', '2hr - 3hr', '3hr - 4rh', '4hr +'],
				step: ['Steps - all', 'Waiting - Triage', 'Waiting - Nurse', 'Waiting - Doctor', 'VisAcu - Visual Acuity', 'Dilate', 'etc, etc ...'],
				assigned: ['Assigned - all', 'Unassigned', 'GJB - Dr Georg Joseph Beer', 'GP - Dr George Bartischy', 'MM - Mr Michael Morgan', 'Su - Sushruta', 'ZF - Dr Zofia Falkowska'],
				flags: ['Flags - all', 'No Flags', 'Change in pupils', 'Diplopia', 'Post Op Diplopia', 'Rapid change in VA', 'Systemically unwell'],
				states: ['Hide done', 'All', 'Active', 'Waiting', 'Done'],
			});
			
			// build DOM
			div.append( ul, searchFilters, searchBtn, adderAllBtn );

			// set up Clinic filter default
			model.filter = "hide-done";
		
			// the clock is running! 
			clinic.clock();
		})();
	};

	// add to namespace
	clinic.app = app;			

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 