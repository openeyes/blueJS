(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class AdderPopup extends React.Component {
			
			constructor( props ){
				super( props );	
				
				this.state = {
					list: this.props.list,
				};
				
				this.listPatients = this.listPatients.bind( this );			
			}
			
			
			listPatients(){
				console.log( this.state.list );
				// build a btn list of patient
				const patientList = this.state.list.map( patient => {
					const name = bj.clock24( new Date( patient.booked )) + ' - '+ patient.lastname
					return rEl('li', { key: react.getKey() }, name );
				});
			
				return (
					rEl('div', { className: 'patients' }, 
						rEl('h3', null, 'Arrived'),
						rEl('ul', { className: 'btn-list' }, patientList )
					)
				);	
			}
			
			listAssign(){
				const assign = [ 'Unassigned', 'MM', 'AB', 'AG', 'RB', 'CW' ];	
				const assignList = assign.map( who => {
					return rEl('li', { key: react.getKey() }, react.fullShortCode( who ));
				});
				
				return (
					rEl('ul', { className: 'btn-list' }, assignList )	
				);
				
			}
			
			listProcesses(){
				
				const people = [ 'Nurse', 'MM', 'AB', 'AG', 'RB', 'CW' ];
				const steps = [ 'Arr', 'Fin', 'DNA', 'Dilate', 'VA' ];
			}
			
			/**
			* Render
			*/
			render(){ 
				return rEl('div', { className: 'oe-clinic-adder'},
					// create 2 overflow columns: 
					this.listPatients(),
					rEl('div', { className: 'update-actions' }, 
						this.listAssign()
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