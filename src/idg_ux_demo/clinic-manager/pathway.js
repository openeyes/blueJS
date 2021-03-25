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
		* Helpers
		*/
		const findFirstTodoIndex = () => {
			const index = pathSteps.findIndex( ps => {
				const status = ps.getStatus();
				return ( status == 'todo');
			});
			
			return index;
		}
		
		const firstActiveIndex = () => pathSteps.findIndex( ps => ps.getStatus() == 'active');
		
		// there might be 1+ active steps
		const lastActiveIndex = () => {
			let index = -1;
			
			pathSteps.forEach(( ps, i ) => {
				if( ps.getStatus() == 'active' ) index = i;
			});
			
			return index;
		}
		
		const renderPathway = () => {
			pathSteps.forEach( ps => div.append( ps.render()));
		}
		
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
					div.prepend( newStep.render());
					pathSteps.splice(0, 0, newStep );
				break;
				case 'i-Wait':
					/* 
					if a pathway is build before a patient arrive
					when they arrive a "i-Wait" is added as well.
					Ensure that the "wait" step is added before "todo" steps.
					*/
					const todoIndex = findFirstTodoIndex();
					
					if( todoIndex === -1 ){
						// No other steps with "todo" yet added to the pathway
						div.append( newStep.render());
						pathSteps.push( newStep );
					} else {
						// Position in pathway and add to array
						div.insertBefore( newStep.render(), pathSteps[todoIndex].render());
						pathSteps.splice( todoIndex, 0, newStep );
					}
			
				break;
				case 'i-Stop': 
					// Automatic stop must alway be last.
					autoStop = newStep;
				break;
				default:
					div.append( newStep.render());
					pathSteps.push( newStep );
			}
			
			// does pathway have an auto-stop? 
			// make sure it's alway at the end
			if( autoStop ) div.append( autoStop.render());
		}
		
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
						
					lastStep.remove();
					pathSteps.splice( -1, 1 );
				}
			}
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
			const todoIndex = findFirstTodoIndex();
			const activeIndex = lastActiveIndex();
	
			if( activeIndex > todoIndex ){
				// swap positions and re-render
				pathSteps[ activeIndex ] = pathSteps.splice( todoIndex, 1, pathSteps[ activeIndex ])[0]; // note: [0]!
				renderPathway();
			}
		}
		
		/**
		* PathStep has completed.
		* If no other active steps add a wait.
		*/
		const addWaiting = () => {
			const activeIndex = firstActiveIndex();
			if( activeIndex == -1 ){
				// add waitstep.
				const newStep = gui.pathStep({
					shortcode: 'i-Wait',
					info: 0,
					status: 'buff',
					type: 'wait',
				}, null );
				
				pathSteps.splice( findFirstTodoIndex(), 0, newStep );
				renderPathway();
				return true;
				
			} else {
				// check complete order position order
				// there is another active step.
				
				
				return false;
			}
		}
		
		/**
		* API
		*/
		return {
			setStatus,
			addStep,
			removeStep,
			stopWaiting,
			addWaiting
		}
			
	};
	
	// make component available to Clinic SPA	
	clinic.pathway = pathway;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 