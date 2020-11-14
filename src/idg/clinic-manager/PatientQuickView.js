(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		class PatientQuickView extends React.PureComponent {
			render(){ 
				const patient = {
					surname: this.props.lastname,
					first: this.props.firstname,
					id: false, 
					nhs: this.props.nhs, 
					gender: this.props.gender, 
					age: this.props.age,
				};
				
				return rEl('i', {
					className: 'oe-i eye-circle medium pad js-patient-quick-overview',
					"data-patient": JSON.stringify( patient ),
					"data-mode": 'side',
					"data-php": "patient/quick/overview.php",
				}, null );
			}
		}
		
		// make component available	
		bj.namespace('react').PatientQuickView = PatientQuickView;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 