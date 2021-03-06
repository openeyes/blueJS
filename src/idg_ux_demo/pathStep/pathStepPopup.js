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
		* Load content, loading this from the server
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'todo', 'active', 'etc'...
		* @params {Boolean} full - full view (or the quickview)
		*/
		const loadContent = ( shortcode, status, type, full ) => {
			/*
			Async.
			Use the pathStepKey for the token check
			*/
			const urlShortCode = shortcode.replaceAll(' ','-'); // watch out for "Dr X Y";
			
			const phpCode = `${urlShortCode}.${status}.${type}`.toLowerCase();
			bj.xhr(`/idg-php/load/pathstep/_ps.php?full=${full}&code=${phpCode}`, pathStepKey )
				.then( xreq => {
					if( pathStepKey != xreq.token ) return;
					// clear and replace content
					bj.empty( popup );
					const div = bj.div('slide-open');
					div.innerHTML = xreq.html;
					// add either a close icon or an expand icon
					popup.append( div, closeBtn( full ));
					// CSS has a default height of 50px.. expand heightto show content
					// CSS will handle animation
					// 22px = 10px padding + 1px border!
					popup.style.height = (div.scrollHeight + 22) + 'px'; 
					
				})
				.catch( e => console.log('PHP failed to load', e ));
		};
			
		/**
		* Render
		* @params {String} shortcode - PathStep shortcode e.g. "Arr", etc
		* @params {String} status - 'active', 'todo', 'done'
		* @params {String} type - 'process', 'person'
		* @params {Element} span - DOM Element for PathStep
		* @params {String} idgCode - short code for specific idgContent
		* @params {Boolean} full - full view (or the quickview)
 		*/
		const render = ({ shortcode, status, type, span, idgCode }, full ) => {
			clearTimeout( removeTimerID );
			
			const useCode = idgCode ? idgCode : shortcode;
			
			// clear all children and reset the CSS
			bj.empty( popup );
			popup.classList.remove('arrow-t', 'arrow-b');
			popup.removeAttribute('style'); // remove the height until it's loaded in (reverts back to CSS)
			
			// there will be a small loading period: 
			const h3 = bj.dom('h3', 'title');
			h3.innerHTML = `<i class="spinner as-icon"></i>`;
			popup.append( h3 );
			
			// iDG loads PHP to demo content.
			// either a basic demo based on the shortcode
			// or using an iDG code to demo specific content
			loadContent(useCode, status, type, full );
			
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
			
			if( rect.bottom < (winH * 0.6)){
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
			
			/**
			* Users scrolls main window, this will disconnect the popup from the step
			* this is a bit hack but it demo's the UIX behaviour!
			*/
			document.body.querySelector('main').addEventListener('scroll', removeReset, { capture:true,  once:true });
			
			
			
		};
		
		/**
		* Remove and reset 
		* this is also called by Clinic if a filter change happens
		*/
		const removeReset = () => {
			pathStep = null;
			lockedOpen = false;
			// There is a flicker if you 'scrub' along a pathway over many steps, delay removal to stop this
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
				render( ps, true );
			}
		};
		
		/**
		* User Over - Quickview
		* @params {PathStep} ps
		*/
		const quick = ( ps ) => {
			if( lockedOpen ) return; 
			pathStepKey = ps.key; 
			render( ps, false );
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
			
			// fake UIX process buttons in popup can request these
			switch( userRequest ){
				case 'remove':
					pathStep.userRemove();
					removeReset();
				break;
				case 'next':
					pathStep.nextState();
				break;
				case 'done':
					pathStep.jumpState( userRequest );
				break;
				case 'prev':
					pathStep.prevState();
				break;
				case "left":
				case "right":
					// pathway position shift. This has to be managed by
					// the pathway that contains the pathStep.
					bj.customEvent('idg:pathStepShift', { pathStep, shift: userRequest == "right" ? 1 : -1 });
					bj.customEvent('idg:AppUpdateFilters');
				break;
				case "DNA":
					pathStep.setCode('DNA');
					pathStep.jumpState('done');
				break; 
				default: bj.log(`PathStepPopup: Unknown request state: ${userRequest}`);
			}
		});
		
		/**
		Hacky demo to show step customisation
		These steps names can be editted!
		*/
		
		bj.userDown('.oe-pathstep-popup .js-customise-view i.js-edit', ( ev ) => {
			bj.show( popup.querySelector('.js-customise-edit'));
			bj.hide( popup.querySelector('.js-customise-view'));
		});
		
		const hideCustomEdit = () => {
			bj.hide( popup.querySelector('.js-customise-edit'));
			bj.show( popup.querySelector('.js-customise-view'));
		};
		
		const changeStepCode = ( code ) => {
			pathStep.setCode( code );
			pathStep.removeIdgPopupCode();
			popup.querySelector('.js-customise-view h3').textContent = code; 
			hideCustomEdit();
			bj.customEvent('idg:AppUpdateFilters');
		};
	
		// free text input
		bj.userDown('.oe-pathstep-popup .js-customise-edit i.js-save', ( ev ) => changeStepCode( ev.target.previousSibling.value ));
		
		// cancel is the same for both
		bj.userDown('.oe-pathstep-popup .js-customise-edit i.js-cancel', () => hideCustomEdit());
		
		/**
		------- Comments!
		Hacky demo to show comments being edited
		*/
		// show a character count for comment if there are any!
		popup.addEventListener('input', ev => {
			if( ev.target.matches('input.js-step-comments')){
				const input = ev.target;
				// update the view text:
				popup.querySelector('.js-comments-view em.comment').textContent = input.value; 
				// show capacity for input based on maxlength as percentage
				const len = input.value.length;
				const max = Number( input.getAttribute('maxlength'));
				const bar = popup.querySelector('.js-comments-edit .percent-bar');
				bar.style.width = (( len / max ) * 100 ) + '%';
			}
		});
		
		bj.userDown('.oe-pathstep-popup .step-comments i.js-save', ( ev ) => {
			bj.hide( popup.querySelector('.js-comments-edit'));
			bj.show( popup.querySelector('.js-comments-view'));
			// on iDG the comments are empty first time, then afterwards we are updating it.
			ev.target.classList.replace("save-plus", "save");
		});
		
		bj.userDown('.oe-pathstep-popup .step-comments i.js-edit', () => {
			bj.show( popup.querySelector('.js-comments-edit'));
			bj.hide( popup.querySelector('.js-comments-view'));
		});
		
		
		
		
	    
	    // API 
	    return { full, quick, hide, remove:removeReset };
	};
	
	// singleton. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStepPopup = pathStepPopup();
		
})( bluejay, bluejay.namespace('gui'), bluejay.namespace('clinic')); 