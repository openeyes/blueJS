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
		* Work out patient status from the pathway steps
		* @returns {String} 
		*/
		const getStatus = () => {
			// work through the Rules
			const lastCode = pathSteps[ pathSteps.length - 1 ].getCode();
			
			if( lastCode == 'i-Fin' ){
				return 'done';
			}
			
			if( lastCode == "i-Wait" || lastCode == "Waiting" ){
				return "stuck";
			}
		
			if( pathSteps.findIndex( ps => ps.getCode() == "Waiting") > 0){
				return "long-wait";
			}
			
			if( findFirstIndex('active') > 0){
				return "active";
			} else {
				return 'waiting';
			}	
		};
		
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
		* Shift step position 
		* this is only for "todo" steps 
		* @param {Number} direction - 'c-last' (c-all not using)
		*/
		const shiftStep = ( direction ) => {
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
		* User/or auto completed
		* Clean up the pathway	
		*/
		const completed = () => {
			// pathStep array is modified by splice so go through it backwards!
			const len = pathSteps.length-1;
			for ( let i=len; i >= 0; i-- ){
				const ps = pathSteps[ i ];
				const code = ps.getCode();
				const status = ps.getStatus();
				
				if( code == "i-Wait" ||
					code == "Waiting" ||
					status == "todo" ||
					status == "config" ){
					ps.remove();
					pathSteps.splice( i, 1 );	
				}
			}
		};
		
		
		/**
		* User has completed a PathStep.
		* Patient requests to add Waiting. Pathway checks to see 
		* if this the right thing to do or not.
		* @returns {Boolean} - false means pathway
		*/
		const addWaiting = () => {
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
						autoStop.remove();
						autoStop = null;
						
						return false; // pathway needs auto-completing.
						
					} else {
						pathSteps.push( waitStep );
					}
				} else {
					// Yes, other todo/config steps
					pathSteps.splice( todoIndex, 0, waitStep );
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
			return true;
		};
		
		/**
		* API
		*/
		return {
			setStatus,
			getStatus,
			addStep,
			removeStep,
			deleteRemovedStep,
			stopWaiting,
			addWaiting, 
			completed
		};
			
	};
	
	// make component available to Clinic SPA	
	clinic.pathway = pathway;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 