(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		/*
		<i class="oe-i eye-circle medium pad js-patient-quick-overview" data-patient="{"surname":"DARWIN","first":"Charles (Mr)","id":false,"nhs":"991 156 4705","gender":"male","age":"102y"}" data-mode="side" data-php="patient/quick/overview.php"></i>
		*/
		
		class PatientQuickView extends React.Component {
			render(){
				 
				const patient = {
					surname: this.props.name[0],
					first: this.props.name[1],
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
				}, null);
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