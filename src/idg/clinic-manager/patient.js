(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Patient extends React.Component {
			render(){
				return (
					rEl('tr', null,
						rEl('td', null, this.props.time),
						rEl('td', null, this.props.num),
						rEl('td', null, this.props.gender),
						rEl('td', null, this.props.name),
						rEl('td', null,
							rEl( react.WaitDuration, { mins: this.props.wait }))
						
					)
				);
			}
		}
		
		/*
		Make component available to SPA	
		*/
		react.Patient = Patient;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 