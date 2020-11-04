(function( bj ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	/*
	Check page... 
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
		// reactJS is available
		bj.customEvent('reactJSloaded');
		
		// shortcut
		const rEl = React.createElement;
		
		// buidl the manager component
		class ClinicManager extends React.Component {
			render(){
				/*
				Static table elements. All happens in the tbody	
				*/
				const cols = [1,1,1,4,4].map(( c, i ) => rEl('col', { className: `cols-${c}`, key: `c${i}` }));
				const headers = ['time','hospital','gender','name', 'wait'].map(( th, i ) => rEl('th', { key: th }, th ));	
				const patientTRs = this.props.patientsJSON.map(( patient => rEl( react.Patient, patient )));
				
				
				return (
					 rEl('table', { className: 'oe-clinic-list' }, 
					 	rEl('colgroup', null, cols ),
					 	rEl('thead', null, 
					 		rEl('tr', null, headers )),
					 	rEl('tbody', null, patientTRs )
					 )
				);
			}
		}
			

		const patientsJSON = [
		  { key:'uid1', time: '09:00', num: '1234567', gender: 'Male', name: 'LUTHER KING, Martin', wait:12 },
		  { key:'uid2', time: '09:15', num: '1234567', gender: 'Femail', name: 'NIGHTINGALE, Florence', wait: 23 }
		];
	
			
		ReactDOM.render(
		  rEl( ClinicManager, { patientsJSON } ),
		  document.getElementById('js-clinic-manager')
		);
	};
	
	/*
	Load React JS, then initalise
	*/
    Promise.all([
	     bj.loadJS('https://unpkg.com/react@17/umd/react.development.js', true),
	     bj.loadJS('https://unpkg.com/react-dom@17/umd/react-dom.development.js', true),
    ]).then( () => init() );
	  

})( bluejay ); 