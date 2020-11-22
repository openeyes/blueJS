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
		
				/* 
				React JS is optimised for shallow comparisons
				where possible avoid deep nesting. Unable to avoid 
				this for patients but state undates are targeted to 
				specific patient.
				*/
				this.state = {
					tableHead: ['Appt.', 'Hospital No.', 'Speciality', '', 'Name', 'Pathway', 'Assigned', 'Mins', ''],
					patients: this.props.patientsJSON,
					popupStepKey: null, 	// use this to close popup if already open
					popupStep: null, 		// step info passed to PathStep popup (not doing much with this at the moment)
					showAdder: false,
					filter: 'showAll', 		// filter state of Clinic
				};
				
				/*
				handlers and helpers
				*/
				
				// generic handler patterns
				this.buildPathStep = this.buildPathStep.bind( this );
				this.updatePatientState = this.updatePatientState.bind( this );
				
				// direct actions on patient
				this.handlePatientArrived = this.handlePatientArrived.bind( this );
				this.handlePatientDNA = this.handlePatientDNA.bind( this );
				this.handlePathwayCompleted = this.handlePathwayCompleted.bind( this );
				this.handleChangeStepStatus = this.handleChangeStepStatus.bind( this );
				
				// Pathstep popup
				this.handleShowStepPopup = this.handleShowStepPopup.bind( this );
				this.handleCloseStepPopup = this.handleCloseStepPopup.bind( this );
				
				// Patients 'adder' (in Filters row)
				this.handleAdderBtn = this.handleAdderBtn.bind( this );
				this.handleAdderRequest = this.handleAdderRequest.bind( this );
				
				// Assignment filters
				this.handleFilterChange = this.handleFilterChange.bind( this );
				
				/*
				builders
				*/
				this.tablePatientRows = this.tablePatientRows.bind( this );
				this.filters = this.filters.bind( this );
				this.adderPopup = this.adderPopup.bind( this );
				this.pathStepPopup = this.pathStepPopup.bind( this );
			}
			
			/**
			* Helper: PathStep Object pattern
			* @returns {Object}
			*/
			buildPathStep( arrRef, shortcode, status, type ){
				return {
					arrRef, 				// store array position to update state later
					key: react.getKey(), 	// this provides a unique React key
					shortcode,
					timestamp: Date.now(), 
					status,
					type,
				};
			}
			
			/**
			* Helper: Update Patient state. 
			* Deep clones state to maintain immutable states
			* @param {Number} patientRef - array position
			* @param {*} update - update is either simple or complex, either a string or an Object
			*/

			updatePatientState( patientRef, update ){
				const action = typeof update === "string" ? update : update.action;
				const patientsCopy = react.deepCopy( this.state.patients ); 
				const thisPatient = patientsCopy[ patientRef ];
				const thisPathway = thisPatient.pathway;
				
				if( action == 'assign' ){
					thisPatient.assigned = update.assign;
				}
				
				if( action == 'arrived'){
					thisPatient.status = 'active';
					// if there are already steps need to adjust their step array position ref
					thisPathway.forEach( step => step.arrRef++ );
					patientsCopy[ patientRef ].pathway = [ this.buildPathStep( 0, 'Arr', 'done', 'arrive' )].concat( thisPathway );
				}
				
				if( action == 'DNA'){
					thisPatient.status = 'complete';
					thisPathway.push( this.buildPathStep( 0, 'DNA', 'done', 'DNA' )); 
				}
				
				if( action == 'addStep' ){
					thisPathway.push( this.buildPathStep( thisPathway.length, update.stepCode, 'next', update.stepType ));
				}
				
				if( action == 'removeStep'){
					thisPathway.splice( update.stepRef, 1 );
				}
				
				if( action == 'changeStepStatus' ){
					thisPathway[ update.stepRef ].status = update.newStatus;
					thisPathway[ update.stepRef ].timestamp = Date.now(); 
				}
				
				if( action == 'finished' ){
					thisPatient.status = 'complete';
					thisPathway.push( this.buildPathStep( thisPathway.length, 'Fin', 'done', 'finish' ));
				}
				
				// target specific patient in state and update to avoid mutating state directly
				this.setState( state => {
					state.patients[ patientRef ] = thisPatient;
					return state; 
				});	
			}
			
			/**
			* Direct patient action: <button> "Arrived"
			* @param {Number} patientRef
			*/
			handlePatientArrived( patientRef ){
				this.updatePatientState( patientRef, 'arrived');
			}
			
			/**
			* Direct patient action: <button> "DNA"
			* @param {Number} patientRef
			*/
			handlePatientDNA( patientRef ){
				this.updatePatientState( patientRef, 'DNA');
			}
			
			/**
			* Direct patient action: <i> green tick icon
			* @param {Number} patientRef
			*/
			handlePathwayCompleted( patientRef ){
				this.updatePatientState( patientRef, 'finished');
			}
			
			/**
			* User clicks on PathStep and in the popup updates PathStep status
			* @param {Number} patientRef - Array Ref
			* @param {Number} stepRef - Array Ref
			* @param {String} newStatus - "done", "remove" or "active"
			*/
			handleChangeStepStatus( patientRef, stepRef, newStatus ){
				// close the step popup
				this.handleCloseStepPopup();
				
				if( newStatus == "done" || newStatus == "active" ){
					this.updatePatientState( patientRef, {
						action: 'changeStepStatus',
						stepRef,
						newStatus
					});
				}
				
				if( newStatus == "remove"){
					this.updatePatientState( patientRef, {
						action: 'removeStep',
						stepRef,
					});
				}
			}
			
			/** 
			* PathStep Popup - callback from Patient.
			* @params {Object} step - PathStep info
			*/
			handleShowStepPopup( step ){
				if( step.key == this.state.popupStepKey ){
					// user is clicking on the same step
					this.handleCloseStepPopup();
				} else {
					this.setState({
						popupStepKey: step.key,
						popupStep: step
					});
				}
			}
			
			/** 
			* PathStep Popup - close icon button in popup (or clicked on step to close it).
			*/
			handleCloseStepPopup(){
				this.setState({
					popupStepKey: null,
					popupStep: null
				});
			}
			
			/**
			* Click on 'Adder' button in Filters. Toggles state (show/hide)
			*/
			handleAdderBtn(){
				// simple shallow update.
				this.setState( state => ({ showAdder: !state.showAdder }));
			}
			
			/**
			* Adder can assign and add steps to selected patients
			* every time user clicks on either an assignment or a step the
			* select patients get updated
			* @params {Object} add
			*/
			handleAdderRequest( add ){
				const type = add.type;
				const shortcode = add.shortcode;
				const stepType = add.stepType; // process or person?
				
				// adder provides a list of patient ref numbers
				add.selectedPatients.forEach( arrRef => {
					
					if( type === 'assign'){
						this.updatePatientState( arrRef, {
							action: 'assign',
							assign: shortcode == 'nobody' ? false : shortcode
						});
					} 
					
					if( type === 'step' ){
						this.updatePatientState( arrRef, {
							action: 'addStep',
							stepCode: shortcode, 
							stepType,
						});
					}
				});
			}
			
			/**
			* Filter button clicked. Update Clinic patients shown
			* @params {String} newFilter
			*/
			handleFilterChange( newFilter ){
				// convert the "Unassigned" code to Boolean false:
				newFilter = newFilter == 'nobody' ? false : newFilter;	
				this.setState({ filter: newFilter });
			}
			
			/*
			builders	
			*/

			/**
			* PathStep popup
			* @returns React Element
			*/
			pathStepPopup(){
				// null? popup is hidden
				if( this.state.popupStep === null ) return null;
				
				return rEl( react.PathStepPopup, {
					 step: this.state.popupStep,
					 onClosePopup: this.handleCloseStepPopup,
					 onChangeStepStatus: this.handleChangeStepStatus,
				});
				
			}
			
			/**
			* Add all the patients to the main <table>
			* Before adding the React Element add all the handles 
			* to keep the props shallow.
			* @returns React Element
			*/
			tablePatientRows(){
				const tableRows = this.state.patients.map(( patient, i ) => {
					// keep the passed props shallow.
					patient.onPathStepClick = this.handleShowStepPopup;
					patient.onPathwayCompleted = this.handlePathwayCompleted;
					patient.onArrived = this.handlePatientArrived;
					patient.onDNA = this.handlePatientDNA;
					patient.clinicFilterState = this.state.filter;
					
					return rEl( react.Patient, patient );
				});
				
				return rEl('tbody', null, tableRows );
			}
			
			/**
			* Adder popup. Doesn't show 'completed' patients
			* @returns React Element || null
			*/
			adderPopup(){
				if( this.state.showAdder == false ) return null; // not needed
				
				const todo = []; // generate a list of patients NOT completed
				this.state.patients.forEach( patient => {
					if( patient.status !== 'complete' ){
						todo.push({
							booked: patient.booked,
							lastname: patient.lastname,
							arrRef: patient.arrRef,
							status: patient.status,
						});
					}
				});
			
				return rEl( react.AdderPopup, { 
					list: todo, 
					onAdderRequest: this.handleAdderRequest 
				});
			}
			
			/**
			* Filter Buttons
			* Note: They are outside the parent DOM BUT children of React Virtual DOM
			* @returns React Element
			*/
			filters(){
				return rEl( react.Filters, { 
					allAssigned: this.state.patients.map( patient => patient.assigned ),
					clinicFilter: this.state.filter,
					showAdder: this.state.showAdder,
					onAdderBtn: this.handleAdderBtn,
					onFilterChange: this.handleFilterChange, 
				});
			}
			
			/**
			* Render
			*/
			render(){
				return (
					 rEl('div', { className: 'app' }, 
					 	rEl('table', { className: 'oe-clinic-list' },
					 		rEl( react.TableHead, { th: this.state.tableHead }),
							this.tablePatientRows()
						), 
						this.pathStepPopup(), 
						this.adderPopup(),
						this.filters()
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