(function( bj ){
	
	'use strict';
	
	bj.addModule('quicktag'); 
	
	const demoTags = [ 'Apple', 'Avocado', 'Banana', 'Cucumber', 'Coconut', 'Datix', 'Donut', 'Elephant', 'Frisbee', 'Research', 'Teaching', 'Referred', 'Results_pending',  ];
	
	const model = {
		qtags: demoTags.map( t => t.toLowerCase()), // I'll leave ordering to the backend
	};
	
	/*
	<div class="oe-qtags">
		<span class="qtag">#tag1</span>
		<span class="qtag selected">#tag2</span>
		<span class="qtag">#tag3</span>
	</div>	
	*/
	
	
	/**
	Views
	*/
	const viewTags = (() => {
		
		const template = '{{#qtags}}<span class="qtag">#{{.}}</span> {{/qtags}}';
		let div = null;
		
		const show = ( input ) => {
			div = document.createElement('div');
			div.className = "oe-qtags";
			div.innerHTML = Mustache.render( template, model );
			div.style.display = "none";
			document.body.appendChild( div ); // CSS is display 'none';
			
			// can't get the DOM height without some trickery...
			let h = bj.getHiddenElemSize( div ).h;
		
			
			let domRect = input.getBoundingClientRect();
			let top = domRect.top - h;
			
			div.style.top = top + 'px';
			div.style.left = domRect.left + 'px';
			div.style.display = "block";
			
			
		}
		
		const select = () => {
			
		}
		
		
		return { show, select }
		
			
	})();
	
	
	/**
	Events
	*/
	const inputHandler = (() => {
		
		let tagging = false;
		let input = null;
		let charAt = 0;
		
		const reset = () => {
			tagging = false;
			charAt = 0;
			// clean up 
			document.removeEventListener("keyup", cancelTagging, false );
			input.removeEventListener("blur", viewTags.remove, false );
		}
		
		const watch = ( ev ) => {
			if( tagging ){
				// check for tag matches
				viewTags.select( input.value.substring( charAt ));	
			} else {
				input = ev.target; 
				if( input.tagName !== "SELECT" && ev.data === "#" ){
					tagging = true;
					charAt = ev.target.selectionStart;
					viewTags.show( input );
					// watch for spacebar and Enter
					document.addEventListener("keyup", cancelTagging, false );
					input.addEventListener("blur", viewTags.remove, false );
				}
			}
		};
		
		return { watch, reset }
		
	})();
	
	
	/**
	* KeyUp Events (spacebar will cancel, Enter will add a match)
	* These need to be on Key because of Enter
	* @param {Event} ev
	*/
	const cancelTagging = ( ev ) => {
		/*
		ignore all keyup events that are part of composition
		https://developer.mozilla.org/en-US/docs/Web/API/Document/keyup_event
		*/
		if( ev.isComposing || ev.keyCode === 229 ) return;
		
		// space bar (cancel)
		if( event.key == ' ' ){
			inputHandler.reset();
		}
		
		if( event.key == 'Enter' ){
			console.log( 'add selected tag (if there is a match)' );
			inputHandler.reset();
		} 
	} 
	
	/**
	Events
	*/
	document.addEventListener('input', inputHandler.watch, { capture:true });
	
	
})( bluejay ); 