(function( bj, clinic ){

	'use strict';
	
	/**
	* build Group
	* @param {Element} group - parentNode;
	* @param {*} list
	* return {Element}
	*/
	const buildDOM = ( group, list ) => {
		const riskIcon = list.usesPriority ? 'circle' : 'triangle';
		
		/**
		Each Worklist requires a "group". The Group has a "header". 
		The header shows the name of the Worklist (+ date, this will be added automatically by OE)
		It also allows removing from the view (if not in single mode)
		*/
		const header = bj.dom('header', false, `<h3>${list.title} : ${list.date}</h3>`); 

		const table = bj.dom('table', 'oec-patients');
		table.innerHTML = Mustache.render([
			'<thead><tr>{{#th}}<th>{{{.}}}</th>{{/th}}</tr></thead>',
			'<tbody></tbody>'
		].join(''), {
			"th": [ 
				'Time', 
				'Clinic', 
				'Patient', 
				'<!-- meta icon -->', 
				'Pathway',
				'<label class="patient-checkbox"><input class="js-check-patient" value="all" type="checkbox"><div class="checkbox-btn"></div></label>', 
				`<i class="oe-i ${riskIcon}-grey no-click small"></i>`,
				'<i class="oe-i comments no-click small"></i>',
				'Wait hours', 
				'<!-- complete icon -->'
			]
		});
		
		group.append( header, table );
	};
	
	
	/**
	* Initalise Worklist
	* @param {*} list 
	* list.title { String }
	* list.json {JSON} - all patient data
	* list.fiveMinBookings {Boolean}, 
	* @param {String} id - unique ID 'bj1'
	* @param {Fragment} fragment - inital DOM build	
	*/
	const init = ( list, id, fragment ) => {
		
		/**
		* Process the patient JSON
		* @returns {Map} - key: uid, value: new Patient
		*/
		const patients = clinic.patientJSON( list.json, list.usesPriority );
		let usingList = true; // users can select what lists they want to use from the Nav panel
		
		// build the static DOM
		const group = bj.dom('section', 'oec-group');
		group.id = `idg-list-${id}`;
		group.setAttribute('data-id', id );
		group.setAttribute('data-title', `${list.title}`);
		
		buildDOM( group, list );
		fragment.append( group );
		
		// Only <tr> in the <tbody> need re-rendering
		const tbody = group.querySelector('tbody');
		
		// add list clock
		clinic.clock( tbody );
		
		/**
		* @Event
		* + icon in <thead>, select/deselect all patients
		* all this does is toggle all patient + icons
		*/
		group.addEventListener('change', ev => {
			const input = ev.target;
			if( input.matches('.js-check-patient') && 
				input.value == "all" ){
				patients.forEach( patient  => patient.setTicked( input.checked ));
			}
		},{ useCapture:true });
		
		
		/**
		* @Event - Patient actiions outside of pathway
		*/
		
		// for scheduled patients
		const patientArrived = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onArrived();
			}
		};
		
		// for scheduled patients
		const patientDNA = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onDNA();
			}
		};
		
		// manually finish the pathway
		const patientComplete = ( patientID ) => {
			if( patients.has( patientID )){
				patients.get( patientID ).onComplete();
			}
		};
			
		/**
		* Add steps to patients
		* Insert step option is pressed. Update selected patients
		* @param {Object} dataObj
		*/
		const addStepsToPatients = ( dataObj ) => {
			const { c:code, s:status, t:type, i:idg } = dataObj;
			
			patients.forEach( patient => {
				if( patient.isTicked()){
					if( code == 'c-last'){
						patient.removePathStep( code ); // Remove last step button
					} else {
						patient.addPathStep({
							shortcode: code, // pass in code
							status,
							type, 
							timestamp: Date.now(),
							idgPopupCode: idg ? idg : false,
						});
					}	
				}
			});
		};
		
		/**
		* Untick all patients AND tick (+) in <thead>
		*/
		const untickPatients = () => {
			patients.forEach( patient => patient.setTicked( false ));
			// and deselect the <thead> + icon
			group.querySelector('thead .js-check-patient').checked = false;
		};
		
		/**
		* Loop through patients and get their status
		* Filter btns will figure out their count
		* @returns {*}
		*/
		const getPatientFilterState = () => {
			const status = [];
			const redflagged = [];
			// only count IF user is using this list
			if( usingList ){
				patients.forEach( patient => {
					status.push( patient.getStatus());
					redflagged.push( patient.getRedFlagged());
				});
			}
			return { status, redflagged };
		};
		
		/**
		* Render Patients in list based on Filter
		* @param {String} filter - the selected filter
		*/
		const render = ( filter ) => {
			// build new <tbody>
			const fragment = new DocumentFragment();
			
			// Patients decide if they match the filter
			// if so, show in the DOM and update the filterPatients set
			patients.forEach( patient => {
				const tr = patient.render( filter );
				if( tr != null ){
					fragment.append( tr );
				}
			});
			
			// update <tbody>
			bj.empty( tbody );
			tbody.append( fragment );
			
			// if there aren't any patient rows
			if( tbody.rows.length === 0 ){
				const tr = bj.dom('tr','no-results', `<td><!-- padding --></td><td colspan='9' style="padding:20px 0" class="fade">No patients found</div></td>`);
				tbody.append( tr );
			}
		};
		
		/**
		* User can hide show lists from the worklist panel btn list
		* @param {Set} - view list to show
		*/
		const showList = ( ids ) => {
			if( ids.has( id )){
				bj.show( group );
				usingList = true;
			} else {
				bj.hide( group );
				usingList = false;
			}
		};

		return {
			render,
			addStepsToPatients,
			getPatientFilterState,
			untickPatients,
			patientArrived,
			patientDNA,
			patientComplete, 
			showList,
		};
	};

	// add to namespace
	clinic.addList = init;			

})( bluejay, bluejay.namespace('clinic')); 