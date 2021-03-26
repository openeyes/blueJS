(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient Pathway
	* @param {Element} parentNode - <td> 
	*/
	const pathway = ( parentNode ) => {
		
		// div for steps and append to the parentnode
		const div = bj.div('pathway');
		parentNode.append( div );
		
		/**
		* Virtual pathway
		* Using the array to re-order the pathway
		*/ 
		const pathSteps = [];
		
		/**
		* Autostop is a unique step, must always be last in the pathway
		*/
		let autoStop = null;
		
		/**
		* Helpers.
		*/
		
		// First?
		const findFirstIndex = ( a, b = false ) => pathSteps.findIndex( ps => ps.getStatus() == a || ps.getStatus() == b );
		
		// Last?
		const findLastIndex = ( status, index = -1 ) => {
			pathSteps.forEach(( ps, i ) => {
				if( ps.getStatus() == status ) index = i;
			});
			return index;
		};
		
		// Swap positions
		const swapSteps = ( a, b ) => {
			pathSteps[ a ] = pathSteps.splice( b, 1, pathSteps[ a ])[0];
		};
		
		/**
		* Render pathway
		* if auto-finish (autoStop) push to last
		*/
		const renderPathway = () => {
			pathSteps.forEach( ps => div.append( ps.render()));
			if( autoStop ) div.append( autoStop.render());
		};
		
		/**
		* Set pathway status on div
		* @param {String} status - not used, but maybe useful for CSS hook.
		*/
		const setStatus = ( status ) => div.className = `pathway ${status}`;
		
		/**
		* Add step to the pathway. 
		* Based on the step code adjust position in the pathway
		* @param {PathStep} newStep
		*/	
		const addStep = ( newStep ) => {
			switch( newStep.getCode()){
				case 'i-Arr':
					pathSteps.splice(0, 0, newStep );
				break;
				case 'i-Wait':
					/* 
					if a pathway is build before a patient arrives
					when they arrive a "i-Wait" is automatically added as well.
					Ensure that the "wait" step is added before "todo" steps.
					*/
					const todoIndex = findFirstIndex('todo', 'config');
					
					if( todoIndex === -1 ){
						pathSteps.push( newStep ); // No other steps with "todo" yet added to the pathway
					} else {
						pathSteps.splice( todoIndex, 0, newStep ); // Position in pathway and add to array
					}
				break;
				case 'i-Stop': 
					autoStop = newStep; // Automatic stop must alway be last.
				break;
				default:
					pathSteps.push( newStep );
			}
			
			renderPathway();
		};
		
		/**
		* Remove the last "todo", or "config" 
		* @param {String} code - 'c-last' (c-all not using)
		*/
		const removeStep = ( code ) => {
			if( !pathSteps.length ) return;
 			
			if( code == 'c-last' ){
				const last = pathSteps[ pathSteps.length - 1 ];
				const status = last.getStatus();
				
				// check ok to remove
				if( status == "todo" ||  
					status == "config"){
						
					last.remove();
					pathSteps.splice( -1, 1 );
				}
			}
		};
		
		/**
		* User has removed a step directly update the pathway array
		* Patient gets a callback from PathStep on any change.
		* Find the PathStep and remove it from the Virtual pathway
		* @param {String} key - unique key
		*/
		const deleteRemovedStep = ( key ) => {
			pathSteps.forEach(( ps, index ) => {
				if( ps.key == key ){
					pathSteps.splice( index, 1 );
				}
			});
		};
		
		/**
		* User has activated a step (callback again in patient)
		* Remove the waiting step
		* Check activate step position and shift left if needed
		* Render pathway
		*/
		const stopWaiting = () => {
			// find the Waiting step
			let waitingIndex = false;
			pathSteps.forEach(( ps, index ) => {
				const code = ps.getCode();
				if( code == 'i-Wait' || code == "Waiting"){
					ps.remove();
					waitingIndex = index;
				}
			});
			
			// and if found remove it from array
			if( waitingIndex ) pathSteps.splice( waitingIndex, 1 );
			
			// activate step needs moving to the left of all "todo" steps
			const todoIndex = findFirstIndex('todo', 'config');
			const activeIndex = findLastIndex('active');
	
			if( activeIndex > todoIndex ){
				// swap positions and re-render
				swapSteps( activeIndex, todoIndex );
				renderPathway();
			}
		};
		
		/**
		* User has completed a PathStep.
		* Patient requests to add Waiting. Pathway checks to see 
		* if this the right thing to do or not.
		* @returns {String} Pathway state 
		*/
		const addWaiting = () => {
			let pathwayStatus = false;
			const activeIndex = findFirstIndex('active');
			
			if( activeIndex == -1 ){
				// No other active steps in pathway
				
				const waitStep = gui.pathStep({
					shortcode: 'i-Wait',
					info: 0,
					status: 'buff',
					type: 'wait',
				}, null );
				
				// Any other todo / config steps?
				const todoIndex = findFirstIndex('todo', 'config');
				if( todoIndex == -1 ){
					// No, end of pathway, auto-finish or stuck?
					if( autoStop ){
						pathwayStatus = "auto-finish";
						autoStop.remove();
						autoStop = null;
					} else {
						pathSteps.push( waitStep );
						pathwayStatus = "stuck";
					}
				} else {
					// Yes, other todo/config steps
					pathSteps.splice( todoIndex, 0, waitStep );
					pathwayStatus = "waiting";
				}	
				
			} else {
				// There is another active step.
				// Re-arrange any completed stesp
				const lastCompleted = findLastIndex('done');
				if( lastCompleted > activeIndex ){
					// swap positions and re-render
					swapSteps( activeIndex, lastCompleted );
				}
			}
			// update DOM
			renderPathway();
			
			return pathwayStatus;
		};
		
		/**
		* API
		*/
		return {
			setStatus,
			addStep,
			removeStep,
			deleteRemovedStep,
			stopWaiting,
			addWaiting
		};
			
	};
	
	// make component available to Clinic SPA	
	clinic.pathway = pathway;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 