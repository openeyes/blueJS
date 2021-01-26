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
		let pathStepKey = null; // see loadContent

		/**
		* close/expand icon (provide a user hint that it can be expanded )
		* @param {Boolean} full (view) 
		* @returns {Element}
		*/
		const closeBtn = ( full ) => {
			const div = bj.div('close-icon-btn');
			div.innerHTML = full ? 
				'<i class="oe-i remove-circle medium-icon"></i>' :
				'<i class="oe-i expand small-icon"></i>';
			return div;
		};
		
		/**
		* Title, updates the <h3> title, always present
		* @param {String} shortcode 
		* @returns {Element}
		*/
		const setTitle = ( shortcode ) => {
			const h3 = bj.dom('h3', 'title');
			h3.textContent = bj.namespace('pathstep').fullShortCode( shortcode );
			return h3; 
		};
		
		/**
		* Step-status
		* @param {String} status 
		* @returns {Element}
		*/
		const setStatus = ( status, type ) => {
			const div = bj.div(`step-status ${status}`);
			switch( status ){
				case 'todo': div.textContent = "Waiting to be done"; break; 
				case 'active': div.textContent = "Currently active"; break; 
				case 'config': div.textContent = "Requires configuration"; break; 
				case 'done': div.textContent = "Completed"; break; 
				default: div.textContent = status;
			}
			
			// special types
			if( type == "arrive") div.textContent = 'Arrived';
			if( type == "finish") div.textContent = 'Patient has left';
			
			return div;
		};
		
		/**
		* Load content, loading this from the server
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'todo', 'active', 'etc'...
		* @params {Boolean} full - full view (or the quickview)
		* @returns {Element}
		*/
		const loadContent = ( shortcode, status, full ) => {
			const div = bj.div('step-content');
			/*
			Async.
			Use the pathStepKey for the token check
			*/
			const phpCode = `${shortcode}-${status}`.toLowerCase();
			bj.xhr(`/idg-php/load/pathstep/popup-content.php?full=${full}&code=${phpCode}`, pathStepKey )
				.then( xreq => {
					if( pathStepKey != xreq.token ) return;
					div.innerHTML = xreq.html;
				})
				.catch( e => console.log('PHP failed to load', e ));
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
				case 'config': domString = [ btn('Configure', 'blue', 'next'), btn('Remove', 'red', 'remove')];
				break;
				case 'todo': domString = [ btn('Activate', 'blue', 'next'), btn('Remove', 'red', 'remove')];
				break;
				case 'active': domString = [ btn('Complete', 'green', 'next'), btn('Cancel', 'red', 'remove')];
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
			
			// build node tree:
			popup.append( closeBtn( full ));
			popup.append( setTitle( shortcode ));
			popup.append( loadContent( shortcode, status, full ));
			
			// actions can only be used if the popup is locked open (full) state
			if( full ) popup.append( userActions( status ));
			
			popup.append( setStatus( status, type ));
			
			/*
			Position popup to PathStep (span)
			Anchor popup to the right side of the step
			Work out vertical orientation, if below half way down, flip it.
			*/
			const winH = bj.getWinH();
			const cssWidth = 380; // match CSS width
			const rect = span.getBoundingClientRect();
			const slightGap = 2; // so it doesn't get too tight
			
			popup.style.left = ( rect.right - cssWidth ) + 'px'; 
			
			if( rect.bottom < (winH * 0.7)){
				popup.style.top = rect.bottom + slightGap + 'px';
				popup.style.bottom = 'auto';
				popup.classList.add('arrow-t');
			} else {
				popup.style.top = 'auto';
				popup.style.bottom = ( winH - rect.top ) + slightGap + 'px';
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
			
			// There is a flicker if you 'scrub' along a pathway, delay removal to stop this
			removeTimerID = setTimeout(() => popup.remove(), 50 );
		};

		/**
		* User Clicks (click on same step to close)
		* @params {PathStep} ps 
		* @params {Boolean} userChangedStatus:
		* Use clicks on a button, in this popup, pathstep needs to update state and re-render!
		*/
		const full = ( ps, userChangedStatus = false ) => {
			if( ps === pathStep && userChangedStatus == false ){
				removeReset();
			} else {
				pathStep = ps;
				pathStepKey = ps.key; 
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
		* @params {PathStep} ps
		*/
		const quick = ({ key, shortcode, status, type, span }) => {
			if( lockedOpen ) return; 
			pathStepKey = key; 
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
		
		/*
		Event delegation
		*/
		// close icon btn in popup
		bj.userDown('.oe-pathstep-popup .close-icon-btn .oe-i', removeReset );
		
		// btn actions within popup. these are generic on IDG for demos
		bj.userDown('.oe-pathstep-popup .js-idg-ps-popup-btn', ( ev ) => {
			const userRequest = ev.target.dataset.action;
			if( userRequest == 'remove'){
				pathStep.remove();
				removeReset();
			}
			if( userRequest == 'next'){
				pathStep.nextState();
			}
		});
	    
	    // API 
	    return { full, quick, hide, remove:removeReset };
	};
	
	// singleton. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStepPopup = pathStepPopup();
		
})( bluejay, bluejay.namespace('gui'), bluejay.namespace('clinic')); 