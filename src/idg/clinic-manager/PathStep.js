(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		class PathStep extends React.Component {
			render(){
				return (
					rEl('span', 
						{ className: 'oe-pathstep-btn' },
						rEl('span', { className: 'step' }, this.props.info[0]), 
						rEl('span', { className: 'time' }, bj.clock24( new Date( this.props.info[1] )))
					)
				);
			}
		}
		
		// make component available	
		bj.namespace('react').PathStep = PathStep;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 