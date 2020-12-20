(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Patient extends React.Component {	
			/**
			* Patient - DOM is <tr>
			* @param {*} props 
			*/
			constructor( props ){
				super( props );
			
				this.state = {
					patientMeta: {
						firstname: props.firstname,
						lastname: props.lastname,
						age: props.age,
						gender: props.gender,
						nhs: props.nhs,	
					}
				};

				/*
				prototypal inheritence, correctly bind 'this' scope 
				*/
				this.handleStepClick = this.handleStepClick.bind( this );
				this.pathwaySteps = this.pathwaySteps.bind( this );
				this.assigned = this.assigned.bind( this );
				this.update = this.update.bind( this );
				this.complete = this.complete.bind( this );
				this.waitMins = this.waitMins.bind( this );
			}
			
			/**
			* User clicks on a PathStep
			* Step doesn't need to do anything, any change needs to happen
			* to the Clinic state, it will be updated/removed through a render
			* @param {Object} step - step info
			* @param {Object} rect - node boundingClientRect, to position the popup
			*/
			handleStepClick( step, rect ){
				step.patientArrRef = this.props.arrRef;
				step.rect = rect;
				this.props.onPathStepClick( step ); // callback from Clinic
			}	
			
			/**
			* Build pathway steps 
			* @returns {React Element}
			*/
			pathwaySteps(){
				const pathway = this.props.pathway;
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
				return rEl('div', { className: `pathway ${this.props.status}`}, pathSteps );
			}
			
			/**
			* Show who's assigned to patient
			* @returns {React Element}
			*/
			assigned(){
				const assigned = this.props.assigned;
				if( assigned  ){
					return rEl('div', null, react.fullShortCode( assigned ));
				} else {
					return rEl('small', { className: 'fade' }, "Not assigned" );
				}
			}
			
			/**
			* Plus icon to open directly the adder popup
			* @returns {React Element}
			*/
			update(){
				if( this.props.status === 'complete' ) return null;
				
				return rEl('i', { 
					className: 'oe-i plus-circle small pad', 
					onClick: () => this.props.onUpdate( this.props.arrRef )
				}, null );
			}
			
			
			/**
			* Arrived DNA or Wait Duration Graphic
			* @returns {React Element}
			*/
			waitMins(){
				
				if( this.props.status === 'todo' ){
					return (
						rEl('div', { className: 'flex' }, 
							rEl('button', { 
								className: 'cols-7 blue hint',  
								onClick: () => this.props.onArrived( this.props.arrRef )
							}, 'Arrived'), 
							rEl('button', { 
								className: 'cols-4', 
								onClick: () => this.props.onDNA( this.props.arrRef ) 
							}, 'DNA')
						)
					);
				}
				
				let arriveTime = 0;
				let totalMins = 0;
				
				this.props.pathway.forEach( step => {
					if( step.shortcode == "Arr" ){
						arriveTime = step.timestamp;
					}
					if( step.shortcode === "Fin" ){
						totalMins = Math.floor(( step.timestamp - arriveTime ) / 60000 );
					}
				});
				
				return (
					rEl( react.WaitDuration, { 
						status: this.props.status,
						arriveTime: arriveTime, // timestamps
						pathwayTotalMins: totalMins // minutes!
					})
				);
			}
			
			complete(){

				let td = null;
				
				if( this.props.status === 'complete' ){
					td = rEl('i', { className: 'fade' }, 'Done' );
				}
				
				if( this.props.status === 'active' ){
					td = rEl('i', { 
						className: 'oe-i save medium-icon pad js-has-tooltip', 
						'data-tt-type': "basic", 
						'data-tooltip-content': 'Patient pathway finished', 
						onClick: () => this.props.onPathwayCompleted( this.props.arrRef ),
					}, null );
				}
				
				return td;
			}
			
			/**
			* Render 
			*/
			render(){
				/*
				Patient Rows can be filtered by their assignment OR status 
				if filter is 'hideComplete' check by status, else check assigned
				*/
				
				if(	this.props.clinicFilterState == "hideComplete" && 
					this.props.status == 'complete' ) return null;
				
				if( this.props.clinicFilterState !== "showAll" &&
					this.props.clinicFilterState !== "hideComplete" ){
					
					if( this.props.assigned !== this.props.clinicFilterState ) return null;
				}
				
				/*
				OK, show it
				*/
				return (
					rEl('tr', { "data-timestamp" : this.props.booked, className: this.props.status },
						rEl('td', null, bj.clock24( new Date( this.props.booked ))),
						rEl('td', null, this.props.num ),
						rEl('td', null, 
							rEl('div', { className: 'speciality' }, this.props.speciality ), 
							rEl('small', { className: 'type' }, this.props.specialityState ) 
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
						rEl('td', null, 
							this.assigned()
						),
						rEl('td', null, 
							this.update()
						),
						rEl('td', null,
							this.waitMins()
						),
						rEl('td', null, 
							this.complete()
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