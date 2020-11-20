(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		class PatientMeta extends React.PureComponent {
			render(){
				return (
					rEl('div', { className: 'oe-patient-meta' }, 
						rEl('div', { className: 'patient-name' }, 
							rEl('a', { href: '/v3-SEM/patient-overview' }, 
								rEl('span', { className: 'patient-surname'}, 
									this.props.lastname 
								),
								rEl("span", { className: "patient-firstname"},
								 	', ' + this.props.firstname 
								)
							)
						), 
						rEl("div", { className: "patient-details" }, 
							rEl("div", { className: "nhs-number", dangerouslySetInnerHTML: { __html : '<span>NHS</span>' + this.props.nhs }}),
							rEl("div", { className: "patient-gender", dangerouslySetInnerHTML: { __html : '<em>Gen</em>' + this.props.gender }}),
							rEl("div", { className: "patient-age", dangerouslySetInnerHTML: { __html : '<em>Age</em>' + this.props.age }})
						)
					)
				);
			}
		}
		
		// make component available	
		bj.namespace('react').PatientMeta = PatientMeta;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 