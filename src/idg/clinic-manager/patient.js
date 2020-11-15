(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Patient extends React.PureComponent {	
			/**
			* Patient - DOM is <tr>
			* @param {*} props 
			* props	-|- changeCount - Number (this is incremented to trigger a render)
			*		 |- patient (patient data, inc pathway)
			*		 |- onShowStepPopup (handler in Clinic) 
			*/
			constructor( props ){
				super( props );
		
				const patient = props.patient;
				
				this.state = {
					onShowStepPopup: props.onShowStepPopup,
					waitMins: 0,
					patientMeta: {
						firstname: patient.firstname,
						lastname: patient.lastname,
						age: patient.age,
						gender: patient.gender,
						nhs: patient.nhs,	
					}
				};
				
				/* 
				If there is a pathway, calculate the waitMins
				either from Arrive or Finish time (if pathway is completed)
				*/
				const calcMins = ( minEnd, minStart ) => Math.floor(( minEnd - minStart ) / 60000 );
				
				if( patient.pathway.length ){
					let arrTimeStamp; // store to calculate if Finished
					patient.pathway.forEach( step => {
						// Arrived.
						if( step.shortcode == "Arr" ){
							this.state.waitMins = calcMins( Date.now(), step.timestamp );
							arrTimeStamp = step.timestamp;
						}
						// Finished
						if(step.shortcode === "Fin" ){
							this.state.waitMins = calcMins( step.timestamp, arrTimeStamp );
						}
					});
				}
				
				/*
				prototypal inheritence, correctly bind 'this' scope 
				*/
				this.handleStepClick = this.handleStepClick.bind( this );
				this.pathwaySteps = this.pathwaySteps.bind( this );
				this.assigned = this.assigned.bind( this );
			}
			

			/**
			* User clicks on a PathStep
			* Step doesn't need to do anything, any change needs to happen
			* to the Clinic state, it will be updated/removed through a render
			* @param {Object} step - step info
			* @param {Object} rect - node boundingClientRect, to position the popup
			*/
			handleStepClick( step, rect ){
				step.patientArrRef = this.props.patient.arrRef;
				step.rect = rect;
				this.state.onShowStepPopup( step ); // callback from Clinic
			}	
			
			/**
			* Build pathway steps 
			* @returns {React Element}
			*/
			pathwaySteps(){
				const pathway = this.props.patient.pathway;
				let pathSteps = null; 
				
				// Build a PathStep pathway?
				if( pathway.length ){
					pathSteps = pathway.map( step  => {
						return react.PathStep({ 
							key: step.key, 
							step: step, 
							onClick: this.handleStepClick
						});
					});		
				}
				
				// if patient pathway is 'complete' CSS will restyle the steps
				return rEl('div', { className: `pathway ${this.props.patient.status}`}, pathSteps );
			}
			
			/**
			* Show who's assigned to patient
			* @returns {React Element}
			*/
			assigned(){
				const whoShortCode = this.props.patient.assigned;
				if( whoShortCode ){
					return rEl('td', null, react.fullShortCode( whoShortCode ));
				} else {
					return (
						rEl('td', null, 
							rEl('small', { className: 'fade' }, 
								'Not assigned'
							)
						)
					);
				}
			}
			
			/**
			* Render 
			*/
			render(){
				const patient = this.props.patient;
				console.log('Render - Patient', patient.key );
				
				return (
					rEl('tr', { "data-timestamp" : patient.booked },
						rEl('td', null, bj.clock24( new Date( patient.booked ))),
						rEl('td', null, patient.num ),
						rEl('td', null, 
							rEl('div', { className: 'speciality' }, patient.speciality ), 
							rEl('small', { className: 'type' }, patient.specialityState ) 
						),
						rEl('td', null, 
							rEl( react.PatientQuickView, this.state.patientMeta )
						),
						rEl('td', null, 
							rEl( react.PatientMeta, this.state.patientMeta )
						),
						rEl('td', null,
							this.pathwaySteps()
						), 
						
						this.assigned(),
						
						rEl('td', null,
							rEl( react.WaitDuration, { 
								status: patient.status,
								mins: this.state.waitMins 	
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