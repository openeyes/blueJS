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
					arriveTime: 0,
					pathwayTotalMins: 0,
					patientMeta: {
						firstname: patient.firstname,
						lastname: patient.lastname,
						age: patient.age,
						gender: patient.gender,
						nhs: patient.nhs,	
					}
				};
				
				/* 
				If there is a pathway, waitDuration needs to know the 
				patient wait time. This is calculate from time of Arrival. 
				If pathway is complete then work out pathwayTotalMins
				*/
				if( patient.pathway.length ){
					patient.pathway.forEach( step => {
						if( step.shortcode == "Arr" ){
							this.state.arriveTime = step.timestamp;
						}
						if( step.shortcode === "Fin" ){
							this.state.pathwayTotalMins = Math.floor(( step.timestamp - this.state.arriveTime ) / 60000 );
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
				const assigned = this.props.patient.assigned;
				if( assigned ){
					return rEl('td', null, react.fullShortCode( assigned ));
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
				const filter = this.props.filter;
				
				console.log('Render - Patient', patient.key );
				
				/*
				Table Rows can be filtered by their assignment. 
				Check the Clinic filter state
				*/
				if( filter !== "all" ){
					// if assignment is false that means "unassigned";
					const assignment = this.props.patient.assigned || 'unassigned';
					
					if( assignment !== filter ){
						return null; // remove <tr>	
					}
				}
				
				
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
								arriveTime: this.state.arriveTime,
								pathwayTotalMins: this.state.pathwayTotalMins
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