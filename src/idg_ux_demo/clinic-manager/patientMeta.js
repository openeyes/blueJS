(function( bj, clinic ){

	'use strict';	

	/**
	* Patient Meta DOM
	* @param {Object} props 
	* @return {DocumentFragment} 
	*/
	const patientMeta = ( props ) => {
		/*
		DOM
		div.oe-patient-meta -|- div.patient-name -|- a -|- span.patient-surname
		                     |                          |- span.patient-firstname	
		                     |
		                     |- div.patient-details -|- div.nhs-number
		                                             |- div.patient-gender
		                                             |- div.patient-age 
		*/
		const template = [
			'<div class="oe-patient-meta">',
				'<div class="patient-name">',
					'<span class="patient-surname">{{lastname}}</span>, ',
					'<span class="patient-firstname">{{firstname}}</span>',
				'</div>',
				'<div class="patient-details">',
					'<div class="nhs-number"><span>NHS</span>{{nhs}}</div>',
					'<div class="patient-gender"><span>Gen</span>{{gender}}</div>',
					'<div class="patient-age"><span>Age</span>{{age}}</div>',
				'</div>',
			'</div>'
		].join('');
		
		const td = document.createElement('td');
		td.innerHTML = Mustache.render( template, props );
		
		return td;
	};
	
	// make component available to Clinic SPA	
	clinic.patientMeta = patientMeta;			
  

})( bluejay, bluejay.namespace('clinic')); 