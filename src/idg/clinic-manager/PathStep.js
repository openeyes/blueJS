(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
	
		/**
		* PathStep - stateless React JS Elements 
		* @param {String} key - PathSteps are created in loop and require a key
		* @parma {Object} step - see Patient.js
		* @param {Function} onClick - Callback from parent
		*/
		const PathStep = ({ key, step, onClick }) => {
			
			const state = step.state;
			
			const css = ['oe-pathstep-btn'];
			if( state === 'done') css.push('green');
			if( state === 'active') css.push('orange');
			css.push( step.type );
			
			// use 'invisible' to maintain layout:
			const cssTime = state == 'next' ? 'time invisible' : 'time';
			
			return (
				rEl('span',
					{ 
						key,
						className: css.join(' '), 
						onClick: () => onClick(),
					},
					rEl('span', { className: 'step' }, step.shortcode ), 
					rEl('span', { className: cssTime }, bj.clock24( new Date( step.timestamp )) )
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