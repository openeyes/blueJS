(function( bj ){

	'use strict';	
	
	/**
	* React Component - but a bit hacked to quickly get the demo working.
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class AdderPopup extends React.Component {
			
			constructor( props ){
				super( props );	
				
				this.state = {
					list: this.props.list,
					onAdderRequest: this.props.onAdderRequest,
				};
				
				this.listPatients = this.listPatients.bind( this );	
				this.handleUpdates = this.handleUpdates.bind( this );		
			}
			
			shouldComponentUpdate(){
				/**
				React hack, docs advise against this, but to save time
				I'm using raw JS in this component, working with the DOM
				directly(!) but updating the state in the React App.
				Once mounted (in real DOM!) this stops any re-Rendering.
				*/
				return false;
			}
			
			/** 
			* Every click on an assignment or a step is pushed to Clinic
			* @param {Event} ev - using raw JS here to handle this
			*/
			handleUpdates( ev ){
				const el = ev.target;
				
				// JSON is added to the DOM by React to side step building a component
				const type = el.dataset.add;
				const shortcode = el.dataset.shortcode;
				const stepType = el.dataset.step;

				/*
				React JS hack.
				Really I should be running all this through a bunch of React Elements
				and these should be monitoring their clicked state in the Virtual DOM
				However, if I use a a bit of vanilla to check the DOM (not the virtual DOM) it 
				saves a bunch of messing about in React JS (yeah, i know) but this is only a demo! 
				*/
				const checkPatients = bj.nodeArray( document.querySelectorAll('.oe-clinic-adder .patients input'));
				const selectedPatients = new Set();
				checkPatients.forEach( patient => {
					if( patient.checked ){
						selectedPatients.add( parseInt( patient.dataset.ref, 10));
					}
				});
				
				// pass up to Clinic to update state
				this.state.onAdderRequest({ selectedPatients, type, shortcode, stepType });
			}
			
			/**
			* list Patients in Clinic or coming later
			* @returns {ReactElement}
			*/
			listPatients(){
				// 2 groups
				const arrived = [];
				const later = [];
				
				// split the list into arrived and later groups
				this.state.list.forEach( patient => {
					const li = rEl('li', { key: react.getKey() }, 
						rEl('label', { className: 'highlight' }, 
							rEl('input', { type: 'checkbox', 'data-ref': patient.arrRef }), 
							rEl('span', null,
								bj.clock24( new Date( patient.booked )) + ' - '+ patient.lastname
							)
						)
					);
					
					if( patient.status === 'active' ){
						arrived.push( li );
					} else {
						later.push( li );
					}
				});
				
				// common <ul> DOM for both lists
				const ul = ( title, listItems ) => {
					return rEl('div', { className: 'row' }, 
						rEl('h4', null, title),
						rEl('ul', { className: 'row-list' }, listItems )
					);
				};
		
				return (
					rEl('div', { className: 'patients' }, 
						rEl('h3', null, 'Select Patients'),
						ul( 'Arrived', arrived), 
						ul( 'Later', later)
					)	
				);	
			}
			
			
			/**
			* list assignments
			* @returns {ReactElement}
			*/	
			listAssign(){
				
				const assignOptions = ['nobody'].concat( react.assignList );
				
				const assignBtns = assignOptions.map( assign => {
					return rEl('li', { 
						key: react.getKey(), 
						onClick: this.handleUpdates, 
						'data-shortcode': assign, 
						'data-add': 'assign' 
					}, react.fullShortCode( assign ) );
				});
				
				return (
					rEl('div', { className: 'row' },  
						rEl('h4', null, 'Assign to'),
						rEl('ul', { className: 'btn-list' }, assignBtns )
					)	
				);
			}
			
			/**
			* list steps that can be added
			* @returns {ReactElement}
			*/	
			listSteps(){
				
				const pathStep = ( step, type ) => {
					return rEl('span', { 
							className: `oe-pathstep-btn ${type}`, 
							key: react.getKey(), 
							onClick: this.handleUpdates,
							'data-shortcode': step, 
							'data-add': 'step',
							'data-step': type, 
						}, 
						rEl( 'span', { className: 'step' }, step ),
						rEl( 'span', { className: 'time invisible' }, '00:00' )		
					);
				};
				
				const combinePeople = react.assignList.concat( react.clinicPersonList );
				
				const peopleSteps = combinePeople.map( step => pathStep( step, 'person'));
				const processSteps = react.clinicProcessList.map( step => pathStep( step, 'process'));
				
				return (
					rEl('div', { className: 'row' },  
						rEl('h4', null, 'Add to pathway'),
						rEl('div', { className: 'steps' }, processSteps ),
						rEl('div', { className: 'steps' }, peopleSteps )
					)	
				);
			}
			
			
			/**
			* Render
			*/
			render(){ 
				return rEl('div', { className: 'oe-clinic-adder'},
					// create 2 columns
					this.listPatients(),
					
					rEl('div', { className: 'update-actions' }, 
						rEl('h3', null, 'Update'),
						this.listAssign(), 
						this.listSteps()
					)
				);		
			}
		}
		
		// make component available	
		react.AdderPopup = AdderPopup;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 