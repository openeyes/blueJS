
(function( bj ){
	
	'use strict';
	
	bj.addModule('quicktag'); 
	
	/**
	Model
	*/
	const model = {
		// for string matching remove case.
		qtags: [ 'Adverse_Event', 'Serious_Adverse_Event', 'Note', 'My_research', 'my_teaching', 'Research', 'Teaching', 'Referred', 'Results', 'Results_pending' ].map( t => t.toLowerCase()), 
		
	};
	
	/**
	View - Quick Tag 'swarm'
	*/
	const quickTags = (() => {
		// Mustache
		const template = '{{#qtags}}<span class="qtag">#{{.}}</span> {{/qtags}}';
		
		let ready = false;
		let tag = "";
		const elem = {
			input: null,
			tags: null,
			flag: null, 
		};
		
		/**
		* Complete reset 
		*/
		const reset = () => {
			if( !ready ) return; 
			
			bj.remove( elem.tags );
			bj.remove( elem.flag );
			bj.unwrap( elem.input );
			
			elem.tags = null;
			elem.flag = null;
			elem.input = null;
			
			ready = false;
 		};
		
		/**
		* Show tag swam, hide flag
		*/
		const showTags = () => {
			elem.tags.style.display = "block";
			elem.flag.style.display = "none";
			
			// re-show with all tags (hidden)
			qtags( model.qtags );
		};
		
		/**
		* Hide tag swam, show flag
		*/
		const hideTags = () => {
			elem.tags.style.display = "none";
			elem.flag.style.display = "block";
		};
		
		/**
		* selectedTag, make this available to the controller
		* @returns {String || null}
		*/
		const selectedTag = () => tag;
		
		/**
		* Use Mustache to build tags swarm
		* @param {Array} tagArr - tag list is filtered as the user types.
		*/
		const qtags = ( tagArr ) => {
			if( tagArr.length ){
				/*
				update tags and show the selected tag
				as user types the tag swarm is filtered
				so always make the first tag as selected
				*/
				tag = tagArr[0];
				elem.tags.innerHTML = Mustache.render( template, { qtags: tagArr });
				elem.tags.querySelector('.qtag:first-child').classList.add('selected'); 
			} else {
				tag = "";
				elem.tags.innerHTML = '<div class="no-matching-tags">No matching Patient Tags</div>';
			}
		};
		
		/**
		* Controller callback on input watch
		* @param {String} userStr - starting from "#"...  
		*/
		const userTyping = ( userStr ) => {
			userStr = userStr.toLowerCase(); // clean user input
			const strMatch = userStr.match(/[a-z-_]*/)[0]; // note: [0]
			const strlen = strMatch.length;
			// filter all tags 
			const filteredTags = model.qtags.filter( tag => {
				return ( tag.substring(0, strlen) == strMatch ); 
			});
			// update 'swarm'
			qtags( filteredTags );
		};
		
		/**
		* Intialise on the input
		* Setup and provide a UI Flag on the input to let the user 
		* know that they can qtag this input
		* @param {Element} input - input or textarea to tag;
		*/
		const init = ( input ) => {
			
			if( ready ) return; 
			ready = true;	
			/*
			Using the "wrap" we can now position the div
			relativelto the wrapper. The reason behind this
			approach (rather than used "fixed") is because of 
			comments in hotlist. Using fixed causes the "mouseleave"
			to fire, closing the hotlist panel.  
			*/
			const wrap = bj.wrap( input, "js-qtag-wrapper" );
			
			// "wrap" will cause focus to be lost from the input
			input.focus();
			
			// add qtags div (hidden for now)
			let tags = document.createElement('div');
			tags.className = "oe-qtags";
			tags.style.display = "none"; 
			
			// UI flag to user
			let flag = document.createElement('div');
			flag.className = "oe-qtags-flag";
			flag.textContent = "#";
			
			// check input isn't too close to top of the page
			// note: tag swarm updates as user types and textarea expands down
			if( input.getBoundingClientRect().top < 150 ){
				tags.style.top = '100%';
				flag.style.top = '100%';
			} else {
				tags.style.bottom = '100%'; 
				flag.style.bottom = '100%';
			}
			
			// update DOM
			wrap.appendChild( flag );
			wrap.appendChild( tags ); 
			
			// store Elements
			elem.input = input;
			elem.tags = tags;
			elem.flag = flag;
			
			// setup with all tags (hidden)
			qtags( model.qtags );
		};
		
		// reveal
		return { 
			init,
			showTags,
			hideTags,
			userTyping, 
			selectedTag,
			reset, 
		};
			
	})();
	
	
	/**
	* user: keydown
	* SPACEBAR | ENTER | TAB
	* Need to use keydown because "Enter" in <input> doesn't work
	* These keys events need controlling to: 
	* - allow fast user input and match similar UI mechanisms
	* - stop their generic UI use (spacebar nudging the page down, tab changes input focus) 
	* - note: spacebar is entering a tag (not cancelling) because the tags are set in the Admin
	* @param {Event} ev
	*/
	const handleKeyDown = ( ev ) => {
		/*
		MDN: ignore all keydown events that are part of composition
		*/
		if( ev.isComposing || ev.keyCode === 229 ) return;
		
		/*
		ENTER || TAB 
		Using Enter and Tab to quickly enter the selected tab
		However, these keys have other GUI behaviours
		Also: Enter is used in patient comments to saves the hotlist comments
		*/
		if( ev.key == 'Enter' || ev.key == 'Tab' ){
			ev.preventDefault();
			ev.stopPropagation();
			inputController.insertTag( quickTags.selectedTag() );		
		} 
		
		/*
		SPACEBAR 
		cancel the current quick tagging
		this allows users to type: '#3 injections'
		*/
		if( ev.key == ' ' ){
			inputController.stopTagging();
		}
		
	};
	
	
	/**
	* Controller for inputs
	*/
	const inputController = (() => {
		
		let tagging = false;
		let input = null;
		let insertIndex = 0;
		let inputText = "";
		let holdingFocus = false;
		
		/**
		* full reset of controller and quicktags
		*/
		const reset = () => {
			// cancel events first
			document.removeEventListener('input', watchInput, { capture:true });
			document.removeEventListener('focusout', focusOut, { capture: true });
			
			// now reset everything...
			input = null;
			tagging = false;
			insertIndex = 0;
			quickTags.reset();
		};
		
		/**
		* Ready to quick tag
		* and: Callback on the qTag close btn
		*/
		const stopTagging = () => {
			tagging = false;
			insertIndex = 0;
			quickTags.hideTags();
			
			bj.log('[qTags] - Keys: Enter, Tab and Spacebar - normal');
			document.removeEventListener("keydown", handleKeyDown, true );
		};
		
		/**
		* Start quick tagging
		* @param {Number} tagIndex - character position (selectionStart)
		*/
		const startTagging = ( tagIndex ) => {
			// setup for tagging
			tagging = true;
			insertIndex = tagIndex;
			inputText = input.value;
			// this will show all default tags
			quickTags.showTags();
			
			bj.log('[qTags] - Keys: Enter, Tab & Spacebar - suspended (keydown)');
			document.addEventListener("keydown", handleKeyDown, true ); // Important. Must intercept all other key events first
		};
		
		/**
		* Callback from 'keydown' or .qtag 'mousedown'
		* @param {String} tag - without '#'
		*/
		const insertTag = ( tag ) => {	
			let str = tag + ' ';
			if( insertIndex === inputText.length ){
				// add to the end
				input.value = inputText + str;
			} else {
				// insert in the middle
				input.value = inputText.substring( 0, insertIndex ) + str + inputText.substring( insertIndex + 1 );
			}
			stopTagging();
		};   
		
		/**
		* refocus input after a small delay
		* user clicking on qtags flag or tag causes input blur
		* need to hold focus and cancel focusout event
		*/
		const delayInputFocus = () => {
			holdingFocus = true;
			setTimeout(() => {
				input.focus();
				holdingFocus = false;
			}, 20 );
			
		};
		
		/**
		* Callback: User clicks '#' UI flag button
		* setup input and startTagging
		* note: this trigger "focusout" Event
		*/ 
		const userClicksFlag = () => {
			input.value = input.value + ' #';
			startTagging( input.value.length );
			delayInputFocus();
		};
		
		/**
		* Callback: User clicks on a tag
		* insert Tag into input
		* note: this trigger "focusout" Event
		*/ 
		const userClicksTag = ( tagStr ) => {	
			inputController.insertTag( tagStr );
			delayInputFocus();
		};
		
		/**
		* Focus out.
		* Needed due to the comments in the hotlist
		* Users can toggle the icon to edit and save the comments
		* Need to capture the lose of focus to reset.
		*/
		const focusOut = () => {
			if(	holdingFocus ) return;
			reset();
		};
		
		/**	
		* Callback 'input' event
		* watching ALL input events, using Event Delegation
		* note: user could TAB to get to this input
		* @param {Event} ev - input (textarea, input or select)
		*/
		const watchInput = ( ev ) => {
			if( tagging ){
				/*
				Tagging active - watching user typing
				*/
				quickTags.userTyping( input.value.substring( insertIndex )); 
				
			} else if( ev.data === "#" ){
				/*
				key '#' triggers the tagging 
				store the cursor position
				*/
				startTagging( ev.target.selectionStart ); 
			}
		};
		
		/**
		* Init: Callback on 'focusin' event
		* @param {Element} target - any input
		*/
		const init = ( target ) => {
			/*
			When qTags are inititate, input loses focus and then 
			re-gains it, beware this loop.
			*/
			if( target.isSameNode( input )) return;
			
			// Reset only if we already have an active input setup			
			if( input !== null ) reset();
			
			// is new target allow to use tags?
			if( target.classList.contains("js-allow-qtags") ){
				input = target;
				// add UI flag to input
				quickTags.init( input ); 
				document.addEventListener('input', watchInput, { capture:true });
				document.addEventListener('focusout', focusOut, { capture: true });	
			}		
		};
		
		// reveal
		return { 
			init,
			stopTagging, 
			insertTag, 
			userClicksFlag,
			userClicksTag,
			reset,
			focusOut,
		};
		
	})();

	/**
	Events
	*/
	
	// custom event delegation
	document.addEventListener('focusin', ( ev ) => inputController.init( ev.target ), { capture: true });
	
	// common event delegation
	bj.userDown('.oe-qtags', inputController.stopTagging );
	bj.userDown('.oe-qtags-flag', inputController.userClicksFlag );
	
	// .qtag in .oe-qtags can be click to insert the tag:
	bj.userDown('.oe-qtags .qtag', ( ev ) => {
		const tagStr = ev.target.textContent;
		inputController.userClicksTag( tagStr.substring(1));
	});
	
})( bluejay ); 