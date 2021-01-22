(function( bj, gui, clinic ){

	'use strict';	
	
	bj.addModule('gui.pathStep');	
	
	/**
	* PathStep Popup
	*/
	const pathStepPopup = () => {
		
		const popup = bj.div('oe-pathstep-popup');
		let removeTimerID = null; 
		let lockedOpen = false; 
		let pathStep = null;

		/**
		* close/expand icon
		* @param {Boolean} full (view) 
		* @returns {Element}
		*/
		const closeBtn = ( full ) => {
			const div = bj.div('close-icon-btn');
			if( full ){
				div.innerHTML = '<i class="oe-i remove-circle medium-icon"></i>';
			} else {
				div.innerHTML = '<i class="oe-i expand small-icon"></i>';
			}
			return div;
		};
		
		/**
		* Title, updates the <h3> title, always present
		* @param {String} shortcode 
		* @returns {Element}
		*/
		const setTitle = ( shortcode ) => {
			const h3 = bj.dom('h3', 'title');
			h3.textContent = clinic.fullShortCode( shortcode );
			return h3; 
		};
		
		/**
		* Step-status
		* @param {String} status 
		* @returns {Element}
		*/
		const setStatus = ( status ) => {
			const div = bj.div('step-status');
			div.className = `step-status ${status}`;
			div.textContent = status;
			return div;
		};
		
		/**
		* Button actions - generic for testing through the pathStep states
		* @param {String} status 
		* @returns {Element}
		*/
		const userActions = ( status ) => {
			const div = bj.div('step-actions');
			const btn = ( text, color, action ) => `<button class="${color} hint js-idg-ps-popup-btn" data-action="${action}">${text}</button>`;
			
			let domString = [];
			
			switch( status ){
				case 'next': domString = [ btn('Activate', 'green', 'active'), btn('Remove', 'red', 'remove')];
				break;
				case 'active': domString = [ btn('Complete', 'green', 'complete'), btn('Cancel', 'red', 'remove')];
				break;
			}
			
			div.innerHTML = domString.join('');
			return div; 
		};
			
		/**
		* Render
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'active', 'todo', 'done'
		* @params {String} type - 'process', 'person'
		* @params {Element} span - DOM Element for PathStep
		* @params {Boolean} full - full view (or the quickview)
 		*/
		const render = ( shortcode, status, type, span, full ) => {
			clearTimeout( removeTimerID );
			
			// clear all children and reset the CSS
			bj.empty( popup );
			
			popup.classList.remove('arrow-t', 'arrow-b');
			
			// build Nodes
			popup.append( closeBtn( full ));
			popup.append( setTitle( shortcode ));
			
			if( full ) popup.append( userActions( status ));
			popup.append( setStatus( status ));

			/*
			Position popup next to PathStep (span)
			*/
			const rect = span.getBoundingClientRect();
			
			// anchor popup to the right side of the step
			popup.style.left = ( rect.right - 360 ) + 'px'; 
			
			// work out vertical orientation, below half way down, flip.
			const winH = bj.getWinH();
			const verticalGap = 2; 
			
			if( rect.bottom < (winH * 0.7)){
				popup.style.top = rect.bottom + verticalGap + 'px';
				popup.style.bottom = 'auto';
				popup.classList.add('arrow-t');
			} else {
				popup.style.top = 'auto';
				popup.style.bottom = ( winH - rect.top ) + verticalGap + 'px';
				popup.classList.add('arrow-b');
			}
			
			// update DOM
			document.body.append( popup );
		};
		
		/**
		* Remove and reset 
		* this is also called by Clinic if a filter change happens
		*/
		const removeReset = () => {
			pathStep = null;
			lockedOpen = false;
			window.removeEventListener('scroll', removeReset, { capture:true, once:true });
			// delay the removal to stop the flicker
			removeTimerID = setTimeout(() => popup.remove(), 50 );
		};
		
		/*
		Event delegation
		*/
		bj.userDown('.oe-pathstep-popup .close-icon-btn .oe-i', removeReset );
		bj.userDown('.oe-pathstep-popup .js-idg-ps-popup-btn', ( ev ) => {
			const userRequest = ev.target.dataset.action;
			console.log('btn', userRequest);
			switch( userRequest ){
				case 'remove':
					pathStep.remove();
					removeReset();
				break;
			}

		});
	
		/**
		* User Clicks (click on same step to close)
		* @params {PathStep} ps - 
		*/
		const full = ( ps ) => {
			if( ps === pathStep ){
				removeReset();
			} else {
				pathStep = ps;
				lockedOpen = true;
				render(
					ps.shortcode,  
					ps.status, 
					ps.type, 
					ps.span, 
					true 
				);
				window.addEventListener('scroll', removeReset, { capture:true, once:true });
			}
		};
		
		/**
		* User Over - Quickview
		* @params {PathStep} - deconstruct Object
		*/
		const quick = ({ shortcode, status, type, span }) => {
			if( lockedOpen ) return; 
			render( shortcode, status, type, span, false );
		};
		
		/**
		* User Out
		* @params {PathStep} - deconstruct Object
		*/
		const hide = () => {
			if( lockedOpen ) return; 
			removeReset();
		};
	    
	    // API 
	    return { full, quick, hide, remove:removeReset };
	};
	
	// singleton. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStepPopup = pathStepPopup();
		
})( bluejay, bluejay.namespace('gui'), bluejay.namespace('clinic')); 