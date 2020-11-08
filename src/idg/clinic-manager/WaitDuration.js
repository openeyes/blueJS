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
				super( props );
				this.state = {
					mins: this.props.mins,
				};
				
				// prototypal inheritence, set scope: 
				this.countMins = this.countMins.bind( this );
				
				// give a rough min count to show the UX...
				setInterval( this.countMins, 60000 );
			}
		
		
			countMins(){
				const increaseMins = this.state.mins + 1;
				this.setState({
					mins: increaseMins
				});
			}
		
			/*
			Circles to represent time waiting
			*/
			svgCircles( r ){
				const circles = ['green','yellow','orange','red'].map(( color, i ) => {
					const cx = ((i + 1) * (r * 2)) - r;
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
				const mins = this.state.mins;
				
				// graphic state depends on wait
				let count = '';
				let minsLabel = '';
				let cssColor = '';
				
				if( mins > 0 ){
					count = mins; 
					minsLabel = mins > 1 ? 'mins' : 'min'; 
					cssColor = 'green';
					
					if( mins > 15 ) cssColor = 'yellow';
					if( mins > 30 ) cssColor = 'orange';
					if( mins > 60 ) cssColor = 'red';
					
				}
				
				return (
					rEl('div', { className: 'wait-duration'},
						rEl('svg', { className: 'duration-graphic ' + cssColor , viewBox:`0 0 ${w} ${d}`, height: d, width: w }, 
							this.svgCircles( r )
						),
						rEl('div', { className: 'mins'},
							rEl('span', null, count ),
							rEl('small', null, minsLabel )
						)
					)
				);
			}
		}
		
		// make component available	
		bj.namespace('react').WaitDuration = WaitDuration;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 