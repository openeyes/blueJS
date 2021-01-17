(function( bj, clinic ){

	'use strict';	
	
	const app = ( tbody, json ) => {
	
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_filter: "all", // "hideCompleted", "Unassigned", "MM", etc
			patients: new Map(),
			
			get filter(){
				return this._filter;
			},
			set filter( val ){
				this._filter = val; 
				this.views.notify();
			}
			
		}, bj.ModelViews());

		/**
		* Filter Patients in Clinic
		* Updated on any change to the model
		*/
		const filterPatients = () => {
			const fragment = new DocumentFragment();
			model.patients.forEach( patient => fragment.appendChild( patient.render( model.filter )));
			
			// update <tbody>
			tbody.innerHTML = "";
			tbody.appendChild( fragment );
		};
		
		// update if any change to the Clinic state
		model.views.add( filterPatients );
		

		/**
		Use Event delegation for all User actions
		*/
		// Button: "Arrived"
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			model.patients.get( ev.target.dataset.patient ).onArrived();
		});
		
		// Button: "DNA"
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			model.patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		
		/**
		* Init Patients and set state from the JSON	
		*/
		json.forEach( patient => model.patients.set( patient.uid, clinic.Patient( patient )));	
		model.filter = "all";
	};

	// set up in namespace
	clinic.app = app;			

})( bluejay, bluejay.namespace('clinic')); 