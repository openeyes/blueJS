(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');
		
		class WaitDuration extends React.Component {
			
			/**
			* WaitDuration SVG wait time graphic circles
			*/
			constructor( props ){
				super( props );
				
				this.state = {
					arrive: props.arriveTime,
					waitMins: 0
				};
			
				this.updateWaitMins = this.updateWaitMins.bind( this );
				this.state.waitMins = this.updateWaitMins();
			}
			
			/**
			* DOM lifecycle 
			* component output has been rendered to the DOM
			* recommended to set up a timer here
			*/
			componentDidMount(){
				if( this.props.status == 'active' ){
					// update Render with correct waitMins
					this.state.waitMins = this.updateWaitMins();
					// then check every 15 secs.
					this.interval = setInterval(() => {
						this.setState({ waitMins: this.updateWaitMins() });
					}, 15000 );
				}
			}
			
			/**
			* DOM lifecycle 
			* clean up the setInterval
			*/
			componentWillUnmount() {
				clearInterval( this.interval );
			}
			
			
			/**
			* Calculate wait minutes. Can only do this whilst mounted.
			* @returns {Number} minutes
			*/
			updateWaitMins(){
				return Math.floor(( Date.now() - this.state.arrive ) / 60000 );
			}
			
			/*
			
			/**
			* SVG Circles to represent time waiting
			* @param {String} color (based on wait mins)
			* @returns {React Element}
			*/
			svgCircles( color = "" ){
				const r = 6;
				const d = r * 2;
				const w = d * 4;
				
				const circles = [ 'green', 'yellow', 'orange', 'red' ].map(( color, i ) => {
					const cx = ((i + 1) * (r * 2)) - r;
					return rEl('circle', { key: react.getKey(), className: `c${i}`, cx, cy:r, r });
				});
				
				return (
					rEl('svg', 
						{ 
							className: `duration-graphic ${color}`, 
							viewBox:`0 0 ${w} ${d}`, 
							height: d, 
							width: w 
						}, 
						circles
					)
				);
			}
			
			/**
			* Show the wait minutes
			* @param {Number} mins
			* @returns {React Element}
			*/
			waitTime( mins ){
				return (
					rEl('div', { className: 'mins'},
						rEl('span', null, mins ),
						rEl('small', null, mins > 1 ? 'mins' : 'min' )
					)	
				);
			}
			
			/**
			* Render depends on status
			* Patient status could be: "complete", "active", "todo"
			*/
			render(){
				
				if( this.props.status == 'complete' ){
					return (
						rEl('div', { className: 'wait-duration'},
							this.waitTime( this.props.pathwayTotalMins )
						)
					);
				}
				
				if( this.props.status == "todo" ){
					return (
						rEl('div', { className: 'wait-duration'},
							this.svgCircles()
						)
					);
				}
				
				// it's "active" and we need to count the wait mins
				const mins = this.state.waitMins; 	
				let cssColor = 'green';				
				if( mins > 14 ) cssColor = 'yellow';
				if( mins > 29 ) cssColor = 'orange';
				if( mins > 59 ) cssColor = 'red';
			
				return (
					rEl('div', { className: 'wait-duration'},
						this.svgCircles( cssColor ),
						this.waitTime( mins )
					)
				);
			}
		}
		
		// make component available	
		react.WaitDuration = WaitDuration;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 