
(function( bj ){
	
	'use strict';
	
	bj.addModule('quicktag'); 
	
	/**
	Model
	*/
	const model = {
		qtags: [ 'Apple', 'Avocado', 'Banana', 'Cucumber', 'Coconut', 'Datix', 'Donut', 'Elephant', 'Frisbee', 'Research', 'Teaching', 'Referred', 'Results', 'Results_pending' ].map( t => t.toLowerCase()), // for string matching remove case.
		
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
		
		let activeInput = null;
		let div = null;
		let tag = "";
		
		/**
		* selectedTag, make available to the controller
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
				div.innerHTML = Mustache.render( template, { qtags: tagArr });
				div.querySelector('.qtag:first-child').classList.add('selected'); 
			} else {
				tag = "";
				div.innerHTML = '<div class="no-matching-tags">No matching Patient Tags</div>';
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
		* Show the qTags swarm
		* @param {Element} input - input or textarea to tag;
		*/
		const show = ( input ) => {
			activeInput = input;
			/*
			Using the "wrap" we can now position the div
			relatively to the wrapper. The reason behind this
			approach (rather than used "fixed") is because of 
			comments in hotlist. Using fixed causes the "mouseleave"
			to fire, closing the hotlist panel.  
			*/
			const wrap = bj.wrap( input, "js-qtag-wrapper" );
			
			// "wrap" will cause focus to be lost from the input
			input.focus();
			
			// add qtags selection
			div = document.createElement('div');
			div.className = "oe-qtags";
			
			// check input isn't too close to top of the page
			const rect = input.getBoundingClientRect();
			if( rect.top < 150 ){
				div.style.top = '100%';
			} else {
				div.style.bottom = '100%'; // tag swarm updates as user types, also textarea expands down
			}
			
			// init with all available tags.
			qtags( model.qtags ); 
			
			// update DOM
			wrap.appendChild( div ); 
		};
		
		/**
		* Remove qTags
		*/
		const remove = () => {
			bj.remove( div );
			bj.unwrap( activeInput );
			div = null;
			activeInput = null;
 		};
		
		// reveal
		return { 
			show, 
			userTyping, 
			remove, 
			selectedTag, 
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
			inputController.useSelectedTag();
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
		* Reset - full reset
		*/
		const reset = () => {
			ready();
			input = null;
		};
		
		/**
		* Ready to quick tag
		*/
		const ready = () => {
			tagging = false;
			insertIndex = 0;
			quickTags.remove();
			document.removeEventListener("keydown", handleKeyDown, true );
		};
		
		/**
		* Start quick tagging
		* @param {Number} tagIndex - character position (selectionStart)
		*/
		const start = ( tagIndex ) => {
			// setup for tagging
			tagging = true;
			insertIndex = tagIndex;
			inputText = input.value;
			quickTags.show( input );
			document.addEventListener("keydown", handleKeyDown, true ); // Important. Must intercept all other key events first
		};
		
		/**
		* qTags creates a wrapper to use for positioning. 
		* building this causes the input to lose focus.
		*/
		const refocusInput = () => {
			setTimeout(() => input.focus(), 20);
		};
		
		/**
		* Insert selected tag from Quick Tags
		* @param {String} tag - currently selected tag, or empty string
		*/
		const insertTagStr = ( tag ) => {
			let str = tag + ' ';
			// check for position of insertion
			if( insertIndex === inputText.length ){
				input.value = inputText + str;
			} else {
				input.value = inputText.substring( 0, insertIndex ) + str + inputText.substring( insertIndex + 1 );
			}	
		};
		
		const useSelectedTag = () => {	
			insertTagStr( quickTags.selectedTag() );
			ready();
			refocusInput();
		}; 
		
		const userClicksTag = ( ev ) => {
			const tagStr = ev.target.textContent;
			insertTagStr( tagStr.substring(1) );
			ready();
			refocusInput();
		};  
		
		const watch = ( ev ) => {
			//  has the user switched inputs?
			if( ev.target !== input && tagging ) reset();
			
			// is input allowed to use tags?
			if( !ev.target.classList.contains( model.inputSelector )) return; // no.
			
			/*
			Either input is tagging or we are watching for "#"
			*/
			if( tagging ){
				quickTags.userTyping( input.value.substring( insertIndex )); // watch user typing	
			} else {
				input = ev.target;
				if( ev.data === "#" ){
					start( ev.target.selectionStart );
				}
			}
		};
		
		// reveal
		return { 
			watch, 
			ready, 
			useSelectedTag, 
			userClicksTag, 
		};
		
	})();
	
	/**
	Events
	*/
	
	// my custom event for input
	document.addEventListener('input', inputController.watch, { capture:true });
	
	// Event Delegation
	bj.userDown('.oe-qtags', inputController.ready );
	bj.userDown('.oe-qtags .qtag', inputController.userClicksTag );
	
	
})( bluejay ); 