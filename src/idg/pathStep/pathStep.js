(function( bj, gui ){

	'use strict';	
	
	bj.addModule('gui.pathStep');	
	
	const pathStep = ( step, pathway, prepend = false ) => {
		/*
		DOM
		span.oe-pathstep-btn -|- span.step
		                      |- span.time 	
		*/
		const css = ['oe-pathstep-btn'];
		if( step.status === 'done') css.push('green');
		if( step.status === 'active') css.push('orange');
		
		// type - person or process? 
		if(  step.type === 'person' ) css.push('person');
		
		// use 'invisible' to maintain layout:
		const cssTime = step.status == 'next' ? 'time invisible' : 'time';	
		const time = bj.clock24( new Date( step.timestamp ));
	
		const span = document.createElement('span');
		span.className = css.join(' ');
		span.innerHTML = `<span class="step">${step.shortcode}</span><span class="${cssTime}">${time}</span>`;
	
		if( prepend ){
			pathway.prepend( span );
		} else {
			pathway.appendChild( span );
		}
		
	};
	
	// make available to Bluejay
	gui.pathStep = pathStep;
		
})( bluejay, bluejay.namespace('gui')); 