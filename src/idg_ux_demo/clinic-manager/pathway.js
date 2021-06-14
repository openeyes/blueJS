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
		let isDischarged = false;
		
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
		*/
		const renderPathway = () => {
			pathSteps.forEach( ps => div.append( ps.render()));
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
			
			if( lastCode == 'i-fin' ){
				return 'done';
			}
			
			if( isDischarged ){
				return 'discharged';
			}
			
			if( lastCode == "i-wait" || lastCode == "i-delayed" ){
				return "stuck";
			}
		
			if( pathSteps.findIndex( ps => ps.getCode() == "i-delayed") > 0 ){
				return "long-wait";
			}
			
			const breakIndex = pathSteps.findIndex( ps => ps.getCode() == "i-break");
			
			if( breakIndex > 0 ){
				const breakStep = pathSteps[ breakIndex ];
				if( breakStep.getType() == "break" ) return "break"; 
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
				case 'i-arr':
					pathSteps.splice(0, 0, newStep );
				break;
				case 'i-break':
				case 'i-wait':
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
				// check ok to remove
				if( last.isRemovable() && pathSteps.length > 1){
					last.remove();
					pathSteps.splice( -1, 1 );
				}
			}
		};
		
		/**
		* Shift step position - only "todo" steps have these buttons
		* This comes from the PathStepPopup
		* @param {*} PathStep
		* @param {Number} direction - either 1 or -1 (right / left)
		*/
		const shiftStepPos = ( ps, direction ) => {
			// find step in the pathway
			const stepIndex = pathSteps.findIndex( el => el == ps );
			// now, can I shift it?
			if( stepIndex ){
				const swapIndex = stepIndex + direction;
				const swap = pathSteps[ swapIndex ];
				if( swap && swap.isRemovable()){
					swapSteps( stepIndex, swapIndex );
					renderPathway();
					// this will cause the popup to reposition.
					ps.renderPopup();
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
				if( code == 'i-wait' || code == "i-delayed"){
					ps.remove();
					waitingIndex = index;
				}
			});
			
			// and if found remove it from array
			if( waitingIndex ) pathSteps.splice( waitingIndex, 1 );
			
			// activate step needs moving to the left of all "todo" steps
			const todoIndex = findFirstIndex('todo', 'config');
			const activeIndex = findLastIndex('active');
			
			if( todoIndex > 0 && activeIndex > todoIndex  ){
				// active could be anywhere so remove it and
				// insert it before the first todo step
				const newActiveStep = pathSteps.splice( activeIndex, 1 )[0]; // Array! 
				pathSteps.splice( todoIndex, 0, newActiveStep );
				renderPathway();
			}
		};
		
		
		/**
		* Discharge (Patient has left BUT the pathway may still be active!)
		* @returns Boolean;
		*/
		const discharged = () => {
			isDischarged = true;
		};
		
		/**
		* Can User complete pathway (i.e. show the tick button)
		* this depends on the pathway
		* @returns Boolean;
		*/
		const canComplete = () => {
			if( isDischarged ){
				// Any todo / config steps?
				return ( findFirstIndex('todo', 'config') == -1 ); 
			} 	
			return false;
		};
		
		/**
		* Remove the finish step
		*/
		const removeCompleted = () => {
			discharged();
			const last = pathSteps[ pathSteps.length - 1];
			if( last.getCode() == 'i-fin' ){
				last.remove();
				pathSteps.splice( -1, 1 );
			}
			renderPathway();
		}
		
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
				
				if( code == "i-wait" ||
					code == "Delayed" ||
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
		* if this the right thing to do or not
		*/
		const addWaiting = () => {
			if( isDischarged ) return; 
			
			const activeIndex = findFirstIndex('active');
			
			if( activeIndex == -1 ){
				// No other active steps in pathway
				
				const waitStep = gui.pathStep({
					shortcode: 'i-wait',
					info: 0,
					status: 'buff',
					type: 'wait',
				}, null );
				
				// Any other todo / config steps?
				const todoIndex = findFirstIndex('todo', 'config');
				if( todoIndex == -1 ){
					pathSteps.push( waitStep );
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
		};
		
		/**
		* Waiting for filter needs to know this!
		*/
		const waitingFor = () => {
			const findWaiting = pathSteps.findIndex( ps => {
				const code = ps.getCode();
				return ( code == 'i-wait' || code == "i-delayed" );
			});
			
			if( findWaiting == -1 || findWaiting == pathSteps.length-1 ){
				return false;
			} else {
				return pathSteps[ findWaiting + 1 ].getCode();
			}
		};
		
		/**
		* API
		*/
		return {
			setStatus,
			getStatus,
			addStep,
			removeStep,
			shiftStepPos,
			deleteRemovedStep,
			stopWaiting,
			addWaiting,
			waitingFor,
			discharged,
			canComplete, 
			removeCompleted,
			completed,
		};
			
	};
	
	// make component available to Clinic SPA	
	clinic.pathway = pathway;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 