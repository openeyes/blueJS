(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Patient extends React.Component {
			
			constructor( props ){
				super( props );
				
				this.state = {
					status: this.props.status,
					waitMins: 0
				};
				
				// prototypal inheritence, set 'this' scope 
				this.handleStepClick = this.handleStepClick.bind( this );
				this.pathwaySteps = this.pathwaySteps.bind( this );
				this.setWaitMins = this.setWaitMins.bind( this );
			}
			
			/**
			* Wait minutes for WaitDuration
			* @param {Number} timestamp 
			*/
			setWaitMins( timestamp ){
				this.state.waitMins = Math.floor(( Date.now() - timestamp ) / 60000 );
			}
			
			handleStepClick( e ){
				console.log('handleStepClick');
				console.log( e );
				console.log( this );
			}
			
			
			/**
			* Build pathway steps
			* @param {Array} pathArr - multi-dimensional array 
			* @returns {rEl}
			*/
			pathwaySteps( pathArr ){
				
				let pathSteps = null; 
			
				// make pathway array more human 
				const pathway = pathArr.map( arr => {
					const obj = {
						shortcode: arr[0],
						timestamp: arr[1],
						state: arr[2],
						type: arr[3],
					};
					
					// Wait Time minutes is based on pathway time
					if( obj.shortcode === "Arr") this.setWaitMins( obj.timestamp );
					if( obj.shortcode === "Fin") this.setWaitMins( obj.timestamp );
					
					return obj;
					
				});
				
				// if there are steps then build the step pathway
				if( pathway.length ){
					pathSteps = pathway.map(( step, i ) => {
						return react.PathStep({ 
							key: i, 
							step: step, 
							onClick: () => this.handleStepClick()
						});
					});		
				}
				
				return rEl('div', { className: `pathway ${this.state.status}`}, pathSteps );
			}
			
			/**
			* Render 
			*/
			render(){
				const patient = this.props;
				
				// Meta pattern
				const meta = {
					name: patient.name,
					age: patient.age,
					gender: patient.gender,
					nhs: patient.nhs,	
				};
			
				return (
					rEl('tr', { "data-timestamp" : patient.booked },
						rEl('td', null, bj.clock24( new Date( patient.booked ))),
						rEl('td', null, patient.num ),
						rEl('td', null, 
							rEl('div', { className: 'speciality' }, patient.type[0] ), 
							rEl('small', { className: 'type' }, patient.type[1] ) 
						),
						rEl('td', null, 
							rEl( react.PatientQuickView, meta )
						),
						rEl('td', null, 
							rEl( react.PatientMeta, meta )
						),
						rEl('td', null,
							this.pathwaySteps( patient.pathway )
						), 
						rEl('td', null, "assign"),
						rEl('td', null,
							rEl( react.WaitDuration, { 
								status: this.state.status,
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