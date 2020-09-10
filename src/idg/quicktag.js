
(function( bj ){
	
	'use strict';
	
	bj.addModule('quicktag'); 
	
	/**
	Model
	*/
	const model = {
		qtags: [ 'Apple', 'Avocado', 'Banana', 'Cucumber', 'Coconut', 'Datix', 'Donut', 'Elephant', 'Frisbee', 'Note', 'Research', 'Teaching', 'Referred', 'Results', 'Results_pending' ].map( t => t.toLowerCase()), // for string matching remove case.
		
		// input can be either an <input> or <textarea>
		// but must be 'tagged' for use with: "use-qtags"
		inputSelector: "js-allow-qtags",
	};
	
	/**
	View
	Quick Tag 'swarm'
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
		* Remove qTags
		*/
		const remove = () => {
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
			elem.input = input;
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
			elem.tags = document.createElement('div');
			elem.tags.className = "oe-qtags";
			elem.tags.style.display = "none"; 
			
			qtags( model.qtags );  // ready, with all tags
			
			// check input isn't too close to top of the page
			// note: tag swarm updates as user types and textarea expands down
			if( input.getBoundingClientRect().top < 150 ){
				elem.tags.style.top = '100%';
			} else {
				elem.tags.style.bottom = '100%'; 
			}
			
			// UI flag to user
			elem.flag = document.createElement('div');
			elem.flag.className = "oe-qtags-flag";
			elem.flag.textContent = "#";
			
			// update DOM
			wrap.appendChild( elem.flag );
			wrap.appendChild( elem.tags ); 
			
		};
		
		// reveal
		return { 
			init,
			showTags,
			userTyping, 
			selectedTag,
			remove, 
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
		SPACEBAR || ENTER || TAB
		*/
		if( ev.key == ' ' || ev.key == 'Enter' || ev.key == 'Tab' ){
			ev.preventDefault();
			ev.stopPropagation();
			inputController.insertTag( quickTags.selectedTag());
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
		
		/**
		* Ready to quick tag
		* and: Callback on the qTag close btn
		*/
		const cancelTagging = () => {
			tagging = false;
			insertIndex = 0;
			quickTags.remove();
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
			quickTags.showTags();
			document.addEventListener("keydown", handleKeyDown, true ); // Important. Must intercept all other key events first
		};
		
		/**
		* refocus on input.
		* qTags creates a wrapper to use for positioning 
		* and use may click the flag both cause the input to lose focus.
		*/
		const refocusInput = () => {
			setTimeout(() => input.focus(), 20);
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
			
			cancelTagging();
			refocusInput();
		};   
		
		/**
		* Callback: User clicks # UI flag button
		*/ 
		const userClicksFlag = ( ev ) => {
			input.value = input.value + ' #';
			startTagging( input.value.length );
			refocusInput();
		};
		
		/**	
		* Callback 'input' event
		* watching ALL input events, using Event Delegation
		* note: user could TAB to get to this input
		* @param {Event} ev - input (textarea, input or select)
		*/
		const watch = ( ev ) => {
			//  has the user switched inputs?
			if( ev.target !== input && tagging ){
				input = null;
				cancelTagging();
			}
			
			// check this input is allowed to use tags...
			if( !ev.target.classList.contains( model.inputSelector) ) return; // not allowed.
		
			/*
			Accepted input!
			Either user is tagging or we are watching for "#" key to activate qTags
			*/
			input = ev.target;
			// highlight to the used that this input has tagging available
			quickTags.init( input ); 
			
			if( tagging ){
				
				quickTags.userTyping( input.value.substring( insertIndex )); // watching user typing
			
			} else if( ev.data === "#" ){
				
				startTagging( ev.target.selectionStart ); // trigger 'tagging'
			}
		};
		
		// reveal
		return { 
			watch, 
			cancelTagging, 
			insertTag, 
			userClicksFlag,
		};
		
	})();
	
	/**
	Events
	*/
	
	// custom event delegation for input
	document.addEventListener('input', inputController.watch, { capture:true });
	
	// Common Event Delegation
	bj.userDown('.oe-qtags', inputController.cancelTagging );
	bj.userDown('.oe-qtags-flag', inputController.userClicksFlag );
	
	// clicking on .qtag in .oe-qtags wrapper only:
	bj.userDown('.oe-qtags .qtag', ( ev ) => {
		const tagStr = ev.target.textContent;
		inputController.insertTag( tagStr.substring(1));
	});
	
	
	
})( bluejay ); 