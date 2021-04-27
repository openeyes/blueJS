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
		As times are relative to 'now', make sure later appointments 
		always appeared scheduled on whole 5 minutes: 
		*/
		const fiveMinAppointments = ( booked ) => {
			const appointment = new Date( Date.now() + ( booked * 60000 )); 
			const offsetFive = appointment.getMinutes() % 5; 
			appointment.setMinutes( appointment.getMinutes() - offsetFive );
			return appointment.getTime();
		};
		
		
		/*
		To make the IDG UX prototype easier to test an initial state JSON is provided by PHP.
		The demo times are set in RELATIVE minutes, which are updated to full timestamps
		*/
		const patientsJSON = JSON.parse( phpClinicDemoJSON );
		patientsJSON.forEach(( patient, i ) => {
			
			// Unique ID for each patient
			patient.uid = bj.getToken(); 
			
			const booked = Date.now() + ( patient.booked * 60000 );
			patient.bookedTimestamp = booked;
			
			// convert to booked time to human time
			patient.time = bj.clock24( new Date( booked ));
			
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
		Each Worklist requires a "group". The Group has a "header". 
		The header shows the name of the Worklist (+ date, this added automatically by OE)
		It also allows collapsing and removing from the view. 
		Adding new worklists to view will be controlled from the OE main header
		*/
		const group = bj.dom('section', 'clinic-group');
		const header = bj.dom('header',false,'Worklist • Day PM • Clinic 1 : Date');
		// use PHP to get the date: 
		const today = document.documentElement.getAttribute('data-today');
		header.innerHTML = `<h3 class="worklist">Accident &amp; Emergency : ${today}</h3><div class="remove-hide"><!-- viewing a single clinic so these are disabled --></div>`;
		
		/*
		Only <tr> in the <tbody> need managing, may as well build the rest of the DOM here	
		*/
		const table = bj.dom('table', 'oe-clinic-list');
		table.innerHTML = Mustache.render([
			'<thead><tr>{{#th}}<th>{{{.}}}</th>{{/th}}</tr></thead>',
			'<tbody></tbody>'
		].join(''), {
			"th": [
				'Arr.',
				'Clinic',
				'Patient', 
				'',
				'Pathway',
				'<label class="patient-checkbox"><input class="js-check-patient" value="all" type="checkbox"><div class="checkbox-btn"></div></label>', 
				'<i class="oe-i triangle-grey no-click small"></i>',
				'<i class="oe-i comments no-click small"></i>',
				'Wait hours', 
				''
			]
		});
		
		/** 
		Build the Node tree
		*/
		group.append( header, table );
		
		// update the DOM
		document.getElementById('js-clinic-manager').append( group );
		
		/* 
		OK, ready to run this app, lets go!
		*/
		loading.remove();
		// state app
		clinic.app( table.querySelector('tbody'), patientsJSON );
	};
	
})( bluejay, bluejay.namespace('clinic')); 
