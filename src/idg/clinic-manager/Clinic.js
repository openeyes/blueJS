(function( bj ){

	'use strict';	
	
	/**
	* React Parent Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class Clinic extends React.Component {
			
			constructor( props ){
				super( props );
		
				// helper to build a btnObj in state
				const btnObj = ( btn, filter, isStep, selected ) => ({ btn, filter, isStep, selected, key: react.getKey() });
		
				// React JS is optimised for shallow comparisons, avoid nesting
				this.state = {
					tableHead: ['Appt.', 'Hospital No.', 'Speciality', '', 'Name', 'Pathway', 'Assigned', 'Mins'],
					patients: this.props.patientsJSON,
					activeStepKey: null,
					popupStep: null,
					filter: 'all',
					filterBtns: [
						btnObj('Show all','all', false, true ),
						btnObj('MM', 'MM', true, false ),
						btnObj('AB', 'AB', true, false ),
						btnObj('AG', 'AG', true, false ),
						btnObj('RB', 'RB', true, false ),
						btnObj('CW', 'CW', true, false ),
						btnObj('Unassigned', 'unassigned', false, false ),
					]
					
				};
				
				this.adderPopup = this.adderPopup.bind( this );
				this.pathStepPopup = this.pathStepPopup.bind( this );
				this.tablePatientRows = this.tablePatientRows.bind( this );
				
				this.handleFilterChange = this.handleFilterChange.bind( this );
				this.handleShowStepPopup = this.handleShowStepPopup.bind( this );
				this.handleClosePopup = this.handleClosePopup.bind( this );
				this.handleChangeStepStatus = this.handleChangeStepStatus.bind( this );
			}
			
			
			handleFilterChange( newFilter ){
				const filterBtnsCopy = react.deepCopy( this.state.filterBtns );
				
				filterBtnsCopy.forEach( btn => {
					btn.selected = ( btn.filter === newFilter );
				});
				
				this.setState({
					filter: newFilter,
					filterBtns: filterBtnsCopy
				});
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
					/* 
					Deep copy patients to avoid mutating this.state 
					*/
					const patientsCopy = react.deepCopy( state.patients );
					
					// find this patient
					const thisPatient = patientsCopy[ patientRef ];
					const thisPathway = thisPatient.pathway;
					
					// update Pathway for this patient
					if( newStatus == "done" ){
						thisPathway[stepRef].status = "done";
						thisPathway[stepRef].timestamp = Date.now(); 
					}
					
					if( newStatus == "active" ){
						thisPathway[stepRef].status = "active";
						thisPathway[stepRef].timestamp = Date.now(); 
					}
					
					if( newStatus == "remove"){
						thisPathway.splice( stepRef, 1 );
					}
					
					/* 
					Only update SPECIFIC patient that has change. 
					Patient is a PureComponent so will only render if props change.
					*/
					state.patients[ patientRef ] = thisPatient;
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
						filter: this.state.filter,
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
			
			
			adderPopup(){
				// generate a list all patient arrived and todo. 
				// 09:00 - LASTNAME
				const patientList = [];
				
				this.state.patients.forEach( patient => {
					if( patient.status !== 'complete' ){
						patientList.push({
							booked: patient.booked,
							lastname: patient.lastname,
							arrRef: patient.arrRef
						});
					}
				});
				
				const showAdder = true;
				if( showAdder ){
					return rEl( react.AdderPopup, { list: patientList });
				}
			}
			
			render(){
				return (
					 rEl('div', { className: 'app' }, 
					 	rEl('table', { className: 'oe-clinic-list' },
					 		rEl( react.TableHead, { th: this.state.tableHead }),
							this.tablePatientRows()
						), 
						
						this.pathStepPopup(), 
						this.adderPopup(),
						
						rEl( react.Filters, { 
							onFilterChange: this.handleFilterChange,
							btns: this.state.filterBtns 
						})
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