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
			_filter: "all", // "hideCompleted", "Unassigned", "MM", etc
			get filter(){
				return this._filter;
			},
			set filter( val ){
				this._filter = val; 
				this.views.notify();
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
		
		/**
		* VIEW: Update Filter Buttons
		* loop through patients and get all their assignments
		*/
		const updateFilters = () => {
			const assignments = [];
			patients.forEach( patient => assignments.push( patient.getAssigned()));
			filters.forEach( filter => filter.update( assignments, model.filter ));
		};
		
		model.views.add( filterPatients );
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
		});
		
		// Button: "DNA"
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		// Icon: "tick" (complete)
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onComplete();
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
		bj.userDown('.oe-clinic-filter button.add-to-all', ( ev ) => {
			if( adderAllBtn.classList.contains('open')){
				adderAllBtn.classList.replace('open', 'close');
				adder.showAll();
			} else {
				hideAdder();
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
			
			// add in filter buttons to the header
			const ul = document.getElementById('js-clinic-filter');
			[
				['Show all','all'],
				['Hide completed','completed']
			].forEach( btn => {
				filters.add( clinic.filterBtn({
					name: btn[0],
					filter: btn[1],
				}, ul ));
			});
			
			// add in + all adder button to header
			const li = document.createElement('li');
			adderAllBtn = bj.dom('button', "add-to-all open");
			li.append( adderAllBtn );
			ul.append( li );

			// clinic always starts on "all"
			model.filter = "all";
		
			// the clock is running! 
			clinic.clock();
	
		})();
	};

	// add to namespace
	clinic.app = app;			

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 