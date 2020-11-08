(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Patient extends React.Component {
			render(){
				const patient = this.props;
				
				// Meta pattern
				const meta = {
					name: patient.name,
					age: patient.age,
					gender: patient.gender,
					nhs: patient.nhs,	
				};
				
				// Waiting time is set from Arrival, if there is one 
				let waitMins = 0;
				
				console.log( patient.pathway );
				
				if( patient.pathway[0] ){
					waitMins =  Math.floor(( Date.now() - patient.pathway[0][1] ) / 60000 );
				}
			
				
				return (
					rEl('tr', { "data-timestamp" : patient.booked },
						rEl('td', null, bj.clock24( new Date( patient.booked ))),
						rEl('td', null, patient.num ),
						rEl('td', null, patient.type ),
						rEl('td', null, 
							rEl( react.PatientQuickView, meta )
						),
						rEl('td', null, 
							rEl( react.PatientMeta, meta )
						),
						rEl('td', null,
							rEl( react.Pathway, {
								state: patient.state, 
								pathway: patient.pathway
							})
						), 
						rEl('td', null, "assign"),
						rEl('td', null,
							rEl( react.WaitDuration, { 
								state: patient.state,
								mins: waitMins 			 	// this counts from Arrival...
							})
						)
					)
				);
			}
		}
		
		// make component available	
		react.Patient = Patient;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 