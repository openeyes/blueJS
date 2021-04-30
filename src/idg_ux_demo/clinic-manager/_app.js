(function( bj, clinic, gui ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	// Check we are on IDG Clinic Manager page... I expect a certain DOM
	const oeClinic = document.getElementById('js-clinic-manager');
	if( oeClinic === null ) return;
	
	/**
	* @callback
	* Init the Clinic Manager SPA - called by loading timeout.
	*/
	const init = () => {
		bj.log('[Clinic] - intialising');
		
		/**
		A&E was set up as a single list
		but need to test with multiple worklists
		*/
		const worklists = new Map(); 
		const filters = clinic.filters(); 
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
				this.renderLists();
				filters.selected( model.filter );	
			},
			
			/**
			* Updating clinic, the issue here is if the view is filtered
			* and the user changes a state of patient in view it will instantly 
			* vanish if it doesn't match the current filter... this stops that happening.
			* 1. Delay the view filters updates (allow the user to see what happened)
			* 2. Only update if Users are not working on things
			*/
			updateView(){
				if( this.delayID ) clearTimeout( this.delayID );
				this.delayID = setTimeout(() => {
					if( document.querySelector('.oe-pathstep-popup') == null && 
						adder.isOpen() == false ){
						// render lists...							
						this.renderLists();	
					}
					this.delayID = null;
				}, 1750 );
			}, 
			
			renderLists(){
				worklists.forEach( list => list.render( this._filter ));
			}
			
		}, bj.ModelViews());
		
		/**
		* Update Filters btn count
		* Whenever a patient changes status the count needs updating
		*/
		const updateFilterBtns = () => {
			// gather all the patient data and pass to filterBtns
			let status = [];
			let risks = [];
			worklists.forEach( list => {
				const patientFilters = list.getPatientFilterState();
				status = status.concat( patientFilters.status );
				risks = risks.concat( patientFilters.risks );
			});
			
			filters.updateCount( status, risks );
			model.updateView();
		};
	
		/**
		* @Event
		* Select or deselect all Patients; checkbox in <thead> (UI is '+' icons)
		*/
		oeClinic.addEventListener('change', ev => {
			const input = ev.target;
			if( input.matches('.js-check-patient') &&
				input.checked ){
				
				adder.show();
			}
		}, { useCapture:true });
		
		/**
		* @Events
		* Filter button (in header bar) 
		*/
		bj.userDown('.js-idg-clinic-btn-filter', ( ev ) => {
			gui.pathStepPopup.remove(); // if there is a popup open remove it
			worklists.forEach( list => list.untickPatients());
			model.filter = ev.target.dataset.filter;
		});
		
		/*
		*  @Events for Adder 
		* - User clicks on a step to add it to patients
		* - (Or closes the adder)
		*/
		bj.userDown('.oe-clinic-adder .insert-steps li', ( ev ) => {
			worklists.forEach( list => list.addStepsToPatients( ev.target.dataset.idg ));
		});
		
		bj.userDown('.oe-clinic-adder .close-btn', () => {
			worklists.forEach( list => list.untickPatients());
			adder.hide(); 
		});
		
		/**
		* @Events for Patient 
		* Button: "Arrived"
		* Button "DNA"
		* Button "Complete" 
		*/
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onArrived();
		});
		
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onComplete();
		});

		// Patient changes it status
		document.addEventListener('onClinicPatientStatusChange', ( ev ) => updateFilterBtns());
		
		/**
		* Initialise App
		*	
		* Build the Worklists
		* iDG demo can handle multple Worklits (or "Clinics")
		* PHP will provide an array of the different Worklists.	
		* loop through the global array and build the demo Worklists
		*/
		const fragment = new DocumentFragment();
		
		iDG_ClinicListDemo.forEach( list => {
			// add new Worklist
			const uid = bj.getToken();
			// Add new list and initalise the worklist DOM
			worklists.set( uid, clinic.addList( list, uid, fragment ));
		});
		
		oeClinic.append( fragment );
		
		// default clinic filter
		model.filter = "clinic"; 
		
		// update filter buttons count
		updateFilterBtns();
		
		// OK, ready to run this app, lets go!
		loading.remove();
	};
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => init(), 500 ); // ... now initate! ;) 
	
	
})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 
