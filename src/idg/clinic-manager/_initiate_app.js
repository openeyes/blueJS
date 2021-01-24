(function( bj, clinic ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	/*
	Check we are on IDG Clinic Manager page... 
	*/
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => initClinicApp(), 500 );
	
	/**
	* Init the Clinic Manager SPA
	* Broadcast to all listeners that React is now available to use for building elements
	*/
	const initClinicApp = () => {
		bj.log('[Clinic Manager] - intialising');
		
		/*
		To make the IDG UX prototype easier to test an initial state JSON is provided by PHP.
		The demo times are set in RELATIVE minutes, which are updated to full timestamps
		*/
		const patientsJSON = JSON.parse( phpClinicDemoJSON );
		patientsJSON.forEach(( patient, i ) => {
			
			// Unique ID for each patient
			patient.uid = bj.getToken(); 
		
			/*
			As times are relative to 'now', make sure appointments 
			always appeared scheduled on whole 5 minutes: 
			*/
			const appointment = new Date( Date.now() + ( patient.booked * 60000 )); 
			const offsetFive = appointment.getMinutes() % 5; 
			appointment.setMinutes( appointment.getMinutes() - offsetFive );
			patient.booked = appointment.getTime();
			
			// convert to booked time to human time
			patient.time = bj.clock24( new Date( patient.booked ));
			
			/*
			Step Pathway is multi-dimensional array.
			Convert each step into an Object and add other useful info here. 
			*/		
			patient.pathway.forEach(( step, i, thisArr ) => {
				const obj = {
					shortcode: step[0],
					timestamp: Date.now() + ( step[1] * 60000 ),
					status: step[2],
					type: step[3],
				};
								
				// update the nested step array to an Object
				thisArr[i] = obj;
			});
		});
		
		/*
		Only <tr> in <tbody> need managing, may as well build the rest of the DOM immediately	
		*/
		const table = bj.dom('table', 'oe-clinic-list');
		table.innerHTML = Mustache.render([
			'<thead><tr>{{#th}}<th>{{.}}</th>{{/th}}</tr></thead>',
			'<tbody></tbody>'
		].join(''), {
			"th": ['Appt.', 'Hospital No.', 'Speciality', '', 'Name', '', 'Pathway', 'Assigned', 'Mins', '']
		});
		
		document.getElementById('js-clinic-manager').appendChild( table );
		
		/* 
		OK, ready to run this app, lets go!
		*/
		loading.remove();
		clinic.app( table.querySelector('tbody'), patientsJSON );
	};
	
})( bluejay, bluejay.namespace('clinic')); 
