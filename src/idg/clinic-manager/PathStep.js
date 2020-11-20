(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
	
		/**
		* PathStep - Functional Component (no need for Component Class)
		* @param {String} key - PathSteps are created in loop and require a key
		* @parma {Object} step - see Patient.js
		* @param {Function} onClick - Callback from parent
		*/
		const PathStep = ({ key, step, onClick }) => {
				
			const css = ['oe-pathstep-btn'];
			
			if( step.status === 'done') css.push('green');
			if( step.status === 'active') css.push('orange');
			
			css.push( step.type );
			
			// use 'invisible' to maintain layout:
			const cssTime = step.status == 'next' ? 'time invisible' : 'time';
			
			return (
				rEl('span',
					{ 
						key: step.key,
						className: css.join(' '), 
						onClick: ( ev ) => onClick( step, ev.target.getBoundingClientRect())
					},
					rEl('span', { className: 'step' }, step.shortcode ), 
					rEl('span', { className: cssTime }, bj.clock24( new Date( step.timestamp )))
				)
			);
					
		};
		
		// make component available	
		bj.namespace('react').PathStep = PathStep;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 