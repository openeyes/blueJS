(function( bj, clinic ){

	'use strict';	
	
	const app = ( tbody, json ) => {
		
		const patients = new Map();
		const filters = new Set();
	
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
		* Filter Patients in Clinic
		* Updated on any change to the model
		*/
		const filterPatients = () => {
			const fragment = new DocumentFragment();
			patients.forEach( patient => {
				const tr = patient.render( model.filter );
				if( tr != null )fragment.appendChild( tr );
			});
			
			// update <tbody>
			tbody.innerHTML = "";
			tbody.appendChild( fragment );
		};
		
		const updateFilters = () => {
			const allPatientAssignments = [];
			patients.forEach( patient => allPatientAssignments.push( patient.getAssignment()));
			filters.forEach( filter => filter.update( allPatientAssignments, model.filter ));
		};
		
		model.views.add( filterPatients );
		model.views.add( updateFilters );

		/**
		Use Event delegation for all User actions
		*/
		// Button: "Arrived"
		bj.userClick('.js-idg-clinic-btn-arrived', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onArrived();
		});
		
		// Button: "DNA"
		bj.userClick('.js-idg-clinic-btn-DNA', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onDNA();
		});
		
		// Icon: "tick" (complete)
		bj.userDown('.js-idg-clinic-icon-complete', ( ev ) => {
			patients.get( ev.target.dataset.patient ).onComplete();
		});
		
		// Filter button
		bj.userDown('.js-idg-clinic-btn-filter', ( ev ) => {
			model.filter = ev.target.dataset.filter;
		});
		
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
				['Hide completed','completed'],
				['MM', 'MM'],
				['Not assigned', 'unassigned']
			].forEach( btn => {
				filters.add( clinic.filterBtn({
					name: btn[0],
					filter: btn[1],
				}, ul ));
			});
			
			// add in + all adder button to header
			const li = document.createElement('li');
			li.className = 'update-clinic-btn';
			li.innerHTML = '<button class="adder open"></button>'; // 'adder close'
			ul.appendChild( li );
			
			// clinic always starts on "all"
			model.filter = "all";
		
			// the clock is running! 
			clinic.clock();
	
		})();
	};

	// add to namespace
	clinic.app = app;			

})( bluejay, bluejay.namespace('clinic')); 