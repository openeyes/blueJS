(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		
		class WaitDuration extends React.Component {
			
			/**
			* WaitDuration SVG wait time graphic circles
			* @props {Number} mins - waiting in minutes from arrival
			* @props {String} status - 'complete', 'active' and 'todo'
			*/
			constructor( props ){
				super( props );
				
				this.state = {
					mins: props.mins,
					countID: null
				};
				
				// prototypal inheritence, set 'this' scope: 
				this.countMins = this.countMins.bind( this );
				
				// give a rough min count to show the UX...
				if( props.mins && props.status == 'active'  ){			
					this.state.countID = setInterval( this.countMins, 60000 ); // count every minute! 
				}
			}
		
			countMins(){
				this.setState( state => {
					state.mins++;
					return state;
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
					
					if( mins > 14 ) cssColor = 'yellow';
					if( mins > 29 ) cssColor = 'orange';
					if( mins > 59 ) cssColor = 'red';
				}
				
				// if state is complete hide the duration graphic
				if( this.props.status == 'complete'){
					clearInterval( this.state.countID );
					cssColor = 'hidden';
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