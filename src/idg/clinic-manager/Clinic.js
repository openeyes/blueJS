(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Clinic extends React.Component {
			
			constructor( props ){
				super( props );
			
				// React JS is optimised for shallow comparisons
				// keep state flat:
				this.state = {
					tableHead: ['Appt.', 'Hospital No.', 'Speciality', '', 'Name', 'Pathway', 'Assign', 'Mins'],
					patients: this.props.patientsJSON,
					activeStepKey: null,
					popupStep: null,
				};
				
				this.pathStepPopup = this.pathStepPopup.bind( this );
				this.handleShowStepPopup = this.handleShowStepPopup.bind( this );
				this.handleClosePopup = this.handleClosePopup.bind( this );
				this.handleChangeStepStatus = this.handleChangeStepStatus.bind( this );
			}
			
			
			/**
			* handle PathStepStep actions
			* @param {Number} patientRef - Array Ref
			* @param {Number} stepRef - Array Ref
			* @param {String} newStatus - "remove" or "active"
			*/
			handleChangeStepStatus( patientRef, stepRef, newStatus ){
				this.handleClosePopup();
				
				this.setState( state => {
					const patient = state.patients[ patientRef ];
					const pathway = patient.pathway;
					
					if( newStatus === "done" ){
						pathway[stepRef].status = "done";
						pathway[stepRef].timestamp = Date.now(); // when done update to finish time
					}
					
					if( newStatus === "active" ){
						pathway[stepRef].status = "active";
					}
					
					if( newStatus === "remove"){
						pathway.splice( stepRef, 1 );
					}
					
					/* 
					Every time a specific patient is updated increment the 
					the patient.changeCount. Then use as a change flag in 
					the Patient (PureComponent does a shallow comparison on props)
					*/
					patient.changeCount++;
					
					return state;
				});

			}
			
			handleClosePopup(){
				this.setState({
					activeStepKey: null,
					popupStep: null
				});
			}
			
			handleShowStepPopup( step ){
				if( step.key == this.state.activeStepKey ){
					// user is clicking on the same step
					this.handleClosePopup();
				} else {
					this.setState({
						activeStepKey: step.key,
						popupStep: step
					});
				}
			}
			
			pathStepPopup(){
				// if it's null, popup is hidden
				if( this.state.popupStep === null ) return null;
				
				return rEl( react.PathStepPopup, {
					 step: this.state.popupStep,
					 onClosePopup: this.handleClosePopup,
					 onChangeStepStatus: this.handleChangeStepStatus,
				});
				
			}
			
			
			tablePatientRows(){
				
				const tableRows = this.state.patients.map(( patient, i ) => {
					return rEl( react.Patient, {
						key: patient.key,
						patient: patient,
						onShowStepPopup: this.handleShowStepPopup,
						/*
						use patient changeCount to trigger a render 
						if needed, in the PureComponent.	
						*/	
						changeCount: patient.changeCount, 
					});
				});
				
				return rEl('tbody', null, tableRows );
			}
			
			
			render(){
				return (
					 rEl('div', { className: 'app' }, 
					 	rEl('table', { className: 'oe-clinic-list' },
					 		rEl( react.TableHead, { th: this.state.tableHead }),
						 	this.tablePatientRows()
						 ), 
						 this.pathStepPopup()
					)
				);
			}
		}
		
		// make component available
		react.Clinic = Clinic;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 