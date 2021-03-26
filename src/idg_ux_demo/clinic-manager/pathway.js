(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient Pathway
	* @param {Element} parentNode 
	*/
	const pathway = ( parentNode ) => {
		
		// div for steps and append to the parentnode
		const div = bj.div('pathway');
		parentNode.append( div );
		
		// virtual pathsteps 
		const pathSteps = [];
		
		// auto-stop 
		let autoStop = null;
		
		/**
		* Find Index positions
		*/
		const findFirstIndex = ( a, b = false ) => pathSteps.findIndex( ps => ps.getStatus() == a || ps.getStatus() == b );
		
		const findLastIndex = ( status, index = -1 ) => {
			pathSteps.forEach(( ps, i ) => {
				if( ps.getStatus() == status ) index = i;
			});
			return index;
		};
		
		/**
		* Swap positions
		*/
		const swapSteps = ( a, b ) => {
			pathSteps[ a ] = pathSteps.splice( b, 1, pathSteps[ a ])[0];
		};
		
		/**
		* Render pathway
		*/
		const renderPathway = () => {
			pathSteps.forEach( ps => div.append( ps.render()));
			// does pathway have an auto-stop? 
			// make sure it's alway at the end
			if( autoStop ) div.append( autoStop.render());
			
		};
		
		/**
		* Set pathway status on div
		* @param {String} status - maybe useful
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
					if a pathway is build before a patient arrive
					when they arrive a "i-Wait" is added as well.
					Ensure that the "wait" step is added before "todo" steps.
					*/
					const todoIndex = findFirstIndex('todo', 'config');
					
					if( todoIndex === -1 ){
						// No other steps with "todo" yet added to the pathway
						pathSteps.push( newStep );
						
					} else {
						// Position in pathway and add to array
						pathSteps.splice( todoIndex, 0, newStep );
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
		* @param {String} key 
		*/
		const deleteRemovedStep = ( key ) => {
			pathSteps.forEach(( ps, index ) => {
				if( ps.key == key ){
					pathSteps.splice( index, 1 );
				}
			});
			console.log('after', pathSteps);
		};
		
		
		
		/**
		* Remove the waiting step
		* Patient has registered a PathStep being made "active"
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
		* PathStep has completed.
		* If no other active steps add a wait.
		* @returns state to Patent 
		*/
		const addWaiting = () => {
			const activeIndex = findFirstIndex('active');
			let pathwayStatus = false;
			if( activeIndex == -1 ){
				// add waitstep.
				const waitStep = gui.pathStep({
					shortcode: 'i-Wait',
					info: 0,
					status: 'buff',
					type: 'wait',
				}, null );
				
				const todoIndex = findFirstIndex('todo', 'config');
				
				if( todoIndex == -1 ){
					
					if( autoStop ){
						pathwayStatus = "auto-finish";
						autoStop.remove();
						autoStop = null;
					} else {
						pathSteps.push( waitStep );
						pathwayStatus = "stuck";
					}
					
				} else {
					pathSteps.splice( todoIndex, 0, waitStep );
					pathwayStatus = "waiting";
				}	
				
			} else {
				// There is another active step.
				// make sure it's after the last completed
				const lastCompleted = findLastIndex('done');
				if( lastCompleted > activeIndex ){
					// swap positions and re-render
					swapSteps( activeIndex, lastCompleted );
				}
			}
			
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