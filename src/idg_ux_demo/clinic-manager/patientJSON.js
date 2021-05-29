(function( bj, clinic ){

	'use strict';	
	
	/**
	* @helper
	* As times are relative to 'now', this helper will round to 5min intervals. 
	* @returns {Timestamp} 
	*/
	const everyFiveMins = ( booked ) => {
		let appointment = new Date( Date.now() + ( booked * 60000 )); 
		let offset = appointment.getMinutes() % 5; 
		appointment.setMinutes( appointment.getMinutes() - offset );
		
		// rounded to 5mins
		return appointment.getTime();
	};	
	
	/**
	* Process the patient JSON from the PHP
	* @param {JSON} json
	* @param {Boolean} usesPriority - risks use triangles, priorities uses circles.
	* @returns {Map} of patients
	*/
	clinic.patientJSON = ( json, usesPriority=false, fiveMinBookings=false ) => {
		/*
		To make the IDG UX prototype easier to test an initial state JSON is provided by PHP.
		The demo times are set in RELATIVE minutes, which are updated to full timestamps
		*/
		const patientsJSON = JSON.parse( json );
		
		patientsJSON.forEach(( patient ) => {
			
			// Unique ID for each patient
			patient.uid = bj.getToken(); 
			
			// round up booked time to 5mins?
			const booked = fiveMinBookings ? 
				everyFiveMins( patient.booked ) :
				Date.now() + ( patient.booked * 60000 );
			
			// convert to booked time to human time
			patient.time = bj.clock24( new Date( booked ));
			
			// save the timestamp
			patient.bookedTimestamp = booked;
			
			/*
			Step Pathway is multi-dimensional array.
			Convert each step into an Object and add other useful info here. 
			timestamp and mins are NOT used by PathStep either of these is
			used for the "info"
			*/		
			patient.pathway.forEach(( step, i, thisArr ) => {
				const obj = {
					shortcode: step[0],
					timestamp: Date.now() + ( step[1] * 60000 ), 
					mins: step[1],
					status: step[2],
					type: step[3],
				};
				
				if( step[4] ) obj.idgPopupCode = step[4]; // demo iDG popup content
								
				// update the nested step array to an Object
				thisArr[i] = obj;
			});
		});
		
		/**
		After processing the JSON
		Set up patients
		*/
		const patients = new Map();
		
		patientsJSON.forEach( patient => {
			patients.set( patient.uid, clinic.patient( patient, usesPriority ));
		});
		
		return patients;
	};


})( bluejay, bluejay.namespace('clinic')); 