(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class Pathway extends React.Component {
			render(){
				// pathsteps? These will be an Object...
				let pathSteps = Object.values( this.props.pathway );	
				if( pathSteps.length ){
					pathSteps = pathSteps.map(( step, i ) => {
						return rEl( react.PathStep, { key: step[0] + i, info: step });
					});
				}
				
				return (
					rEl('div', { className: 'pathway'}, pathSteps )
				);
			}
		}
		
		// make component available	
		react.Pathway = Pathway;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 