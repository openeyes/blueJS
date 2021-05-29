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
			let redflagged = [];
			worklists.forEach( list => {
				const patientFilters = list.getPatientFilterState();
				status = status.concat( patientFilters.status );
				redflagged = redflagged.concat( patientFilters.redflagged );
			});
			
			filters.updateCount( status, redflagged );
			model.updateView();
		};
	
		/**
		* @Event
		* Show the adder if ANY patient is checked!
		*/
		oeClinic.addEventListener('change', ev => {
			const input = ev.target;
			if( input.matches('.js-check-patient') && input.checked ){
				adder.show();
			}
			
			// how many patients are checked?
			const selectedPatients = oeClinic.querySelectorAll('tbody .js-check-patient:checked');
			adder.tickCount( selectedPatients.length );
			
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
		bj.userDown('div.oec-adder .insert-steps li', ( ev ) => {
			const data = JSON.parse( ev.target.dataset.idg );
			// check if configurable. if show a popup
			if( data.s == "popup"){
				clinic.pathwayPopup( data.c );
				data.s = "todo";
			}
			// demo a preset pathway
			if( data.c == "Pathways"){
				[
					{c:'Dilate', s:'todo', t:'process'},
					{c:'Nurse', s:'todo', t:'process'},
					{c:'i-fork', s:'buff', t:'fork'},
				].forEach( data => {
					worklists.forEach( list => list.addStepsToPatients( data ));
				});
			} else {
				worklists.forEach( list => list.addStepsToPatients( data ));
				adder.addSuccess();
			}
			
			
			
		});
		
		bj.userDown('div.oec-adder .close-btn', () => {
			worklists.forEach( list => list.untickPatients());
			adder.hide(); 
		});
		
		// a bit of hack to fake some UIX, cancelling a popup needs 
		// to remove the steps added
		bj.userClick('.oe-popup button.js-cancel-popup-steps', ev => {
			const wrap = bj.getParent( ev.target, '.oe-popup-wrap');
			wrap.remove();
			worklists.forEach( list => list.addStepsToPatients( { c:"c-last" }));	
		});
		
		/**
		* @Events for Patient 
		* Button: "Arrived"
		* Button "DNA"
		* Button "Complete" 
		*/
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			worklists.forEach( list => list.patientArrived( ev.target.dataset.patient ));
		});
		
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			worklists.forEach( list => list.patientDNA( ev.target.dataset.patient ));
		});
		
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			worklists.forEach( list => list.patientComplete( ev.target.dataset.patient ));
		});
		
		bj.userDown('.js-idg-clinic-icon-finish', ( ev ) => {
			// this doesn't work! but I need to demo the UIX concept with a popup
			clinic.pathwayPopup('quick-finish');
			
		});

		// Patient changes it status
		document.addEventListener('idg:PatientStatusChange', ( ev ) => updateFilterBtns());
		
		/**
		* Initialise App
		*	
		* Build the Worklists
		* iDG demo can handle multple Worklits (or "Clinics")
		* PHP builds the JS array of the different Worklists.	
		* loop through the Global and build the demo Worklists
		*/
		const fragment = new DocumentFragment();
		
		// Global!
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
		
		/**
		Init the Nav worklist panel and provide a
		callback for any view changes.
		*/
		const noLists = bj.dom('div', 'alert-box info row', 'Please select a list to view');
		
		const updateListView = ( idSet ) => {
			worklists.forEach( list => list.showList( idSet ));
			if( !idSet.size ){
				oeClinic.append( noLists );
			} else {
				noLists.remove();
			}
			updateFilterBtns();
		}; 
		
		clinic.navPanelListBtns( updateListView );
	};
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => init(), 400 ); // ... now initate! ;) 
	
	
})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 
