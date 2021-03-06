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
					'<a href="/v3-SEM/patient-overview">',
						'<span class="patient-surname">{{lastname}}</span>, ',
						'<span class="patient-firstname">{{{firstname}}}</span>',
					'</a>',
					'<div class="patient-icons">',
					'{{#duplicate}}<i class="oe-i exclamation-orange small pad js-has-tooltip" data-tt-type="basic" data-tooltip-content="Double check details. More than one {{lastname}} in clinic"></i>{{/duplicate}}',
					'</div>',
				'</div>',
				'<div class="patient-details">',
					'<div class="nhs-number"><span>NHS</span>{{nhs}}</div>',
					'<div class="gender">{{gender}}</div>',
					'<div class="patient-age"><em>dob</em> {{dob}} <span class="yrs">{{age}}</span></div>',
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