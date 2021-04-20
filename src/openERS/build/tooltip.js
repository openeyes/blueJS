(function( bj ){
	
	'use strict';
	
	bj.addModule('tooltip'); 
	
	/** 
	* Model
	* extended with view notifications
	*/
	const model = Object.assign({
		selector: ".js-tooltip",
		target: null,
		type: 1, // 1 = "basic", (2 = "bilateral"; in the future may need to use bilateral tips)
		tip: null, // tooltip content
		
		/**
		* Reset the Model
		*/
		reset(){
			this.target = null;
			// Oops! this is a bit naughty, but hard couple is easier ;) 
			tooltip.reset(); 
		},
		
		/**
		* Update the Model
		* @param {EventTarget} target
		*/
		newTip( target ){
			if( this.target != null) this.reset();
			
			// new target
			this.target = target;
			// get JSON tip
			const json = JSON.parse( target.dataset.tip );
			this.type = json.type; // only 1 at the moment
			this.tip = json.tip;
			this.views.notify();
		}
		
	}, bj.ModelViews());
	
	/**
	* Tooltip HTML content
	* handle the innerHTML here, this allows for bilateral content
	* if required at a later date
	*/
	const tipHTML = () => {
		if( model.type === 1 ){
			tooltip.show( model.tip ); 
		}
	};
	
	// observe model
	model.views.add( tipHTML );
	
	/**
	* Tooltip mini sub-module.
	* Only one tooltip <div>
	* @returns {*} API
	*/
	const tooltip = (() => {
		// innerWidth forces a reflow, only update when necessary
		let winWidth = window.innerWidth;
		bj.listenForResize(() => winWidth = window.innerWidth );
		
		// hold <div> reference
		let div;
		
		/**
		* Show the tip and position
		*/
		const show = ( tipHTML ) => {
			// reset with new <div>
			div = bj.div('tooltip');
			div.innerHTML = tipHTML;
			// needs to hidden in the DOM to get dimensions
			bj.hide( div );
			document.body.append( div );
			
			
			// can't know the DOM height & width without some trickery...
			const domSize = bj.getHiddenElemSize( div, 'block' );
			const h = domSize.h;
			const w = domSize.w;
			
			/**
			* Check the tooltip height to see if content fits default positioning
			* work out positioning from target element	
			*/
			let offsetW = w/2; 
			let offsetH = 8; // arbitary visual offset, which allows for the little arrow
			
			let domRect = model.target.getBoundingClientRect();
			let center = domRect.right - ( domRect.width/2 );
			let top = domRect.top - h - offsetH;
		
			/*
			setup CSS classes to visually position the 
			arrow correctly based on tooltip positoning
			*/
			
			// too close to the left?
			if( center <= offsetW ){
				offsetW = 20; // match CSS arrow position (by eye)
				div.classList.add("off-r");
			}
			
			// too close to the right?
			if ( center > ( winWidth - offsetW )){
				offsetW = ( w - 20 ); // match CSS arrow position (by eye)
				div.classList.add("off-l");
			}
			
			// is there enough space above icon for standard posiitoning?
			if( domRect.top < h ){
				top = domRect.bottom + offsetH; // nope, invert and position below
				div.classList.add("invert");
			} 
			
			/*
			set position and show the tooltip
			*/
			div.style.top = top + 'px';
			div.style.left = ( center - offsetW ) + 'px';
			bj.show( div );
			
		};
		
		/**
		* @callback from Model
		*/
		const reset = () => {
			div.remove();
			div = null;
		};
		
		// public	
		return { show, reset };
	})();
	
	
	/**
	* UserOut (or users clicks to toggle tip)
	*/
	const userOut = () => {
		if( model.target === null ) return; 
		model.reset(); 
		window.removeEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Over (or click toggle tip)
	* if the user scrolls, remove the tooltip (as it will be out of position)
	* @param {Event} ev
	*/
	const userOver = ( ev ) => {
		model.newTip( ev.target ); 
		window.addEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Mult-function for "click"
	* Either closes or opens (for touch behaviour only)
	* @param {Event} ev
	*/
	const userClick = ( ev ) => {
		if( ev.target.isSameNode( model.target )){
			userOut();
		} else {
			userOver( ev );
		}
	};
		
	/**
	Events
	*/
	bj.userDown( model.selector, userClick );
	bj.userEnter( model.selector, userOver );
	bj.userLeave( model.selector, userOut );
	
	
})( bluejay ); 