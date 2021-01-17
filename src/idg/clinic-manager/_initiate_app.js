(function( bj ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	/*
	Check we are on IDG Clinic Manager page... 
	*/
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	/*
	Fake a loading delay, gives the impression it's doing something important
	and shows how to do the loader.
	*/
	const loading = bj.div('oe-popup-wrap');
	loading.innerHTML = '<div class="spinner"></div><div class="spinner-message">Loading...</div>';
	document.body.appendChild(loading);
	setTimeout(() => initClinicApp(), 500 );
	
	/*
	Name space for React App
	React JS componenets are built into this space	
	*/
	const clinic = bj.namespace('clinic');
	
	// central-ise these:
	clinic.assignList = ['MM', 'AB', 'AG', 'RB', 'CW'].sort();
	clinic.clinicPersonList = ['Nurse'];
	clinic.clinicProcessList = ['Dilate', 'VisAcu', 'Orth', 'Ref', '~Img', '~Fields' ].sort();
	
	clinic.fullShortCode = ( shortcode ) => {
		let full = shortcode; // "Nurse" doesn't need expanding on
		switch( shortcode ){
			case 'Arr': full = "Arrived"; break;
			case 'Fin': full = "Finish"; break;
			case "DNA" : full = "Did Not Attend"; break;
			
			case "nobody" : full = "Not assigned"; break;
			case "MM" : full = "Mr Michael Morgan"; break;
			case "AB" : full = "Dr Amit Baum"; break;
			case "AG" : full = "Dr Angela Glasby"; break;
			case "RB" : full = "Dr Robin Baum"; break;
			case "CW" : full = "Dr Coral Woodhouse"; break; 
			
			case "Img" : full = "Imaging"; break;
			case "VisAcu" : full = "Visual Acuity"; break;
			case "Orth" : full = "Orthoptics"; break;
			case "Fields" : full = "Visual Fields"; break;
			case "Ref" : full = "Refraction"; break;
			
		}
		return full; 
	}; 
	
	/**
	* Initalise Clinic Manager SPA
	* Broadcast to all listeners that React is now available to use for building elements
	*/
	const initClinicApp = () => {
		bj.log('[Clinic Manager] - intialising');
		
		/*
		To make the IDG UX prototype easier to test an initial state JSON is provided by PHP.
		The demo all times are set in RELATIVE minutes, update all JSON times to full timestamps
		*/
		const patientsJSON = JSON.parse( phpClinicDemoJSON );
		patientsJSON.forEach(( patientRow, i ) => {
			/*
			Add extra Patient React info here
			*/
			patientRow.uid = bj.getToken(); 
			
			/*
			As times are relative to 'now', make sure appointments 
			always appeared scheduled on whole 5 minutes 
			*/
			const appointment = new Date( Date.now() + ( patientRow.booked * 60000 )); 
			const offsetFive = appointment.getMinutes() % 5; 
			appointment.setMinutes( appointment.getMinutes() - offsetFive );
			patientRow.booked = appointment.getTime();
			
			/*
			Step Pathway is multi-dimensional array.
			Convert each step into an Object and add other useful info here. 
			*/		
			patientRow.pathway.forEach(( step, i, thisArr ) => {
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
		OK, ready to run this app!
		*/
		loading.remove();
		
		/*
		Only tableRows in <tbody> need managing, 
		may as well build the rest of the DOM immediately	
		*/
		const table = document.createElement('table');
		table.className = "oe-clinic-list";
		table.innerHTML = Mustache.render([
			'<thead><tr>{{#th}}<th>{{.}}</th>{{/th}}</tr></thead>',
			'<tbody></tbody>'
		].join(''), {
			"th": ['Appt.', 'Hospital No.', 'Speciality', '', 'Name', 'Pathway', 'Assigned', '', 'Mins', '']
		});
		document.getElementById('js-clinic-manager').appendChild( table );
		
		/*
		Init the Clinic App	
		*/
		clinic.app( document.querySelector('table.oe-clinic-list tbody'), patientsJSON );
	};
	
})( bluejay ); 