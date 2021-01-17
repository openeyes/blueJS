(function( bj, clinic ){

	'use strict';	
	
	/**
	* Patient Meta DOM
	* @param {Object} props 
	* @return {Element} 
	*/
	const patientQuickView = ( props ) => {
		
		const i = document.createElement('i');
		i.className = "oe-i eye-circle medium pad js-patient-quick-overview";
		i.setAttribute('data-mode', 'side');
		i.setAttribute('data-php', 'patient/quick/overview.php');
		i.setAttribute('data-patient', JSON.stringify({
			surname: props.lastname,
			first: props.firstname,
			id: false, 
			nhs: props.nhs, 
			gender: props.gender, 
			age: props.age,
		}));
		
		const td = document.createElement('td');
		td.appendChild( i );
		
		return td;
	};
	
	// make component available to Clinic SPA	
	clinic.patientQuickView = patientQuickView;		

})( bluejay, bluejay.namespace('clinic')); 