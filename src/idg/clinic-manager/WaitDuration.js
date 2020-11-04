(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		/**
		* SVG circles that graphically show waiting time
		* Duration is also shown in minutes	
		*/
		class WaitDuration extends React.Component {
			
			constructor( props ){
				super( props ); // always call the base constructor with props 
			}
			
			/*
			Circles to represent time waiting
			*/
			svgCircles( r ){
				const circles = ['green','yellow','orange','red'].map(( color, i ) => {
					const cx = (i * (r * 2)) - r;
					return rEl('circle', { 
						key: color, // React JS requires a 'key', IF list is re-order then this will be a problem 
						className: `c${i}`, 
						cx,
						cy:r, 
						r 
					});
				});
				
				return circles;
			}
			
			/*
			Render
			*/
			render(){
				const r = 6;
				const d = r * 2;
				const w = d * 4;
				const waitMins = this.props.mins;
				
				return (
					rEl('div', { className: 'wait-duration'},
						rEl('svg', { className: 'duration-graphic', viewBox:`0 0 ${w} ${d}`, height: d, width: w }, 
							this.svgCircles( r )
						),
						rEl('div', { className: 'mins'},
							rEl('span', null, waitMins),
							rEl('small', null, 'mins'))
					)
				);
			}
		}
		
		/*
		Make component available to SPA	
		*/
		bj.namespace('react').WaitDuration = WaitDuration;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 