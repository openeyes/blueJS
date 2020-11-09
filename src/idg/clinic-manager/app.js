(function( bj ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	/*
	Check we are on the right page... 
	*/
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	/*
	Name space for React Components	
	*/
	const react = bj.namespace('react');
	
	/**
	* Initalise Clinic Manager SPA
	* Broadcast to all listeners that React is now available
	*/
	const init = () => {
		bj.log('[Clinic Manager] - intialising');
		
		// reactJS is available
		bj.customEvent('reactJSloaded');
		
		// shortcut
		const rEl = React.createElement;
		
		/*
		To make the UX prototype easy to change the JSON is provided by PHP
		*/
		const patientsJSON = JSON.parse( phpClinicDemoJSON );
		
		/*
		For the purposes of the demo all times are set in RELATIVE minutes
		Update all these JSON times to full timestamps
		*/
		const now = Date.now();
	
		patientsJSON.forEach( row => {
			const booked = row.booked;
			const pathwayArr = row.pathway;
			
			// make sure appointments always scheduled on 5 minutes
			const appointment = new Date( now + ( booked * 60000 )); 
			const offsetFive = appointment.getMinutes() % 5; 
			appointment.setMinutes( appointment.getMinutes() - offsetFive );
			row.booked = appointment.getTime();
			
			pathwayArr.forEach( step => {
				step[1] = now + ( step[1] * 60000 ) ;
			});
		});
		
		// React Clinic Manager
		class ClinicManager extends React.Component {
			render(){
				const colHeaders = ['Appt.','Hospital No.','Speciality','','Name','Pathway','Assign','Mins'].map( th => rEl('th', { key: th }, th ));	
				const tableRows = this.props.patientsJSON.map( patient => rEl( react.Patient, patient ));
				
				return (
					 rEl('div', { className: 'app' }, 
					 	rEl('table', { className: 'oe-clinic-list' }, 
						 	rEl('thead', null, 
						 		rEl('tr', null, colHeaders )),
						 	rEl('tbody', null, tableRows )
						 ), 
						 rEl('div', { className: 'oe-pathstep-popup'}, 'hello')
					 )
				);
			}
		}
			
		ReactDOM.render(
		  rEl( ClinicManager, { patientsJSON } ),
		  document.getElementById('js-clinic-manager')
		);
	};
	
	/*
	Load React JS, then initalise
	Make sure you load the React package before loading ReactDOM.
	react.production.min.js || react.development.js
	*/
    bj.loadJS('https://unpkg.com/react@17/umd/react.development.js', true)
    	.then( () => {
	    	 bj.loadJS('https://unpkg.com/react-dom@17/umd/react-dom.development.js', true)
	    	 	.then( () => init() ); 
    	});
	  

})( bluejay ); 