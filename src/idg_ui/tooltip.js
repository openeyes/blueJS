(function( bj ){
	
	'use strict';
	
	bj.addModule('tooltip'); 
	
	/** 
	* Model
	* extended with views
	*/
	const model = Object.assign({
		selector: ".js-has-tooltip",
		showing:false,
		target:null,
		type: null, // or, bilateral
		clickThrough: false, // does tooltip click through to a popup showing full details? Note: important for touch!
		tip: null, // tooltip content
		eyeIcons: null, // only applies to bilateral popups
		
		/**
		* Reset the Model
		*/
		reset(){
			this.showing = false;
			this.type = null;
			this.target = null;
			this.views.notify();
		},
		
		/**
		* Update the Model
		* @param {EventTarget} target
		*/
		update( target ){
			this.showing = true;
			this.target = target;
			

			if( target.hasAttribute('data-tooltip-content')){
				/*
				Support the old data attribute for basic tooltips
				*/
				this.type = "basic";
				this.tip = target.dataset.tooltipContent;
				
			} else {
				/*
				New JSON approach for more advanced tooltips
				*/
				const json = JSON.parse( target.dataset.tip );
				this.type = json.type;
				this.clickThrough = json.clickPopup; // click through to a popup?
				
				switch( this.type ){
					case "bilateral": 
						this.tip = {
							r: json.tipR,
							l: json.tipL
						};
					break;
					case "esign":
						 this.png = json.png;
					break; 
					default: 
						this.tip = json.tip;
				}	
				
				if( this.type == 'bilateral' ){
					this.tip = {
						r: json.tipR,
						l: json.tipL
					};
					this.eyeIcons = json.eyeIcons;
				} else {
					// basic
					
				}	
			}
			
			this.views.notify();
		}
		
	}, bj.ModelViews());
	
	
	/**
	* Views 
	*
	* Only one tooltip DIV: Basic and Bilateral both use it
	* @returns API
	*/
	const tooltip = (() => {
		const div = document.createElement('div');
		
		// innerWidth forces a reflow, only update when necessary
		let winWidth = window.innerWidth;
		bj.listenForResize( () => winWidth = window.innerWidth );
	
		/**
		* Reset the tooltip DOM
		*/
		const reset = () => {
			div.innerHTML = "";
			div.className = "oe-tooltip"; // clear all CSS classes
			div.style.cssText = "display:none"; // clear ALL styles & hide
		};
		
		/**
		* Show the tip and position
		*/
		const show = ( display, width ) => {
			/*
			Check the tooltip height to see if content fits default positioning	
			*/
			let offsetW = width/2; 
			let offsetH = 8; // visual offset, which allows for the arrow
			
			// can't get the DOM height without some trickery...
			let h = bj.getHiddenElemSize(div).h;
							
			/*
			work out positioning based on icon
			this is a little more complex due to the hotlist being
			fixed open by CSS above a certain browser size, the
			tooltip could be cropped on the right side if it is.
			*/
			let domRect = model.target.getBoundingClientRect();
			let center = domRect.right - ( domRect.width/2 );
			let top = domRect.top - h - offsetH;
		
			// watch out for the hotlist, which may overlay the tooltip content
			let maxRightPos = winWidth > bj.settings("cssHotlistFixed") ? bj.settings("cssExtended") : winWidth;
			
			/*
			setup CSS classes to visually position the 
			arrow correctly based on tooltip positoning
			*/
			
			// too close to the left?
			if( center <= offsetW ){
				offsetW = 20; 			// position to the right of icon, needs to match CSS arrow position
				div.classList.add("offset-right");
			}
			
			// too close to the right?
			if ( center > ( maxRightPos - offsetW )){
				offsetW = ( width - 20 ); 			// position to the left of icon, needs to match CSS arrow position
				div.classList.add("offset-left");
			}
			
			// is there enough space above icon for standard posiitoning?
			if( domRect.top < h ){
				top = domRect.bottom + offsetH; // nope, invert and position below
				div.classList.add("inverted");
			} 
			
			if( model.type == "esign"){
				div.style.backgroundImage = `url(${model.png})`;
			}
			
			/*
			update DOM and show the tooltip
			*/
			div.style.top = top + 'px';
			div.style.left = (center - offsetW) + 'px';
			div.style.display = display;
			
			
			
		};
		
		/**
		* Reset tooltip if model resets
		*/
		model.views.add(() => {
			if( !model.showing ) reset();
		});
		
		/**
		* intialise and append to DOM
		*/
		reset();
		document.body.appendChild( div );
		
		// public	
		return { div, reset, show };
	})();
	
	
	/**
	* Basic tooltip
	*/
	const basic = () => {
		if( model.type === 'basic' ){
			/*
			* basic: HTML 'tip' may contain HTML tags
			*/
			tooltip.reset();
			tooltip.div.innerHTML = model.tip;
			tooltip.show( "block", 200 ); // CSS width: must match 'newblue'
		}
	};
	
	// observe model
	model.views.add( basic );
	
	/**
	* Bilateral tooltip
	* Use Mustache template
	*/
	const bilateral = (() => {
		const template ='<div class="right">{{&r}}</div><div class="left">{{&l}}</div>';
		
		const update = () => {
			if( model.type === 'bilateral'){
				/** 
				* Bilateral enhances the basic tooltip
				* with 2 content areas for Right and Left 	
				*/
				tooltip.reset();
				tooltip.div.classList.add('bilateral');
				tooltip.div.innerHTML = Mustache.render( template, model.tip );
				
				// hide R / L icons?
				if( !model.eyeIcons ) tooltip.div.classList.add('no-icons');
				
				tooltip.show( "flex", 400 ); // CSS width: must match 'newblue'
			}
		};
		
		// observe model
		model.views.add( update );
	
	})();
	
	/**
	* Esign signature
	*/
	const esign = () => {
		if( model.type === 'esign' ){
			tooltip.reset();
			tooltip.div.classList.add('esign');
			tooltip.show( "block", 210 ); // CSS width: must match 'newblue'
		}
	};
	
	model.views.add( esign );
	
	
	/**
	* Out (or click toggle tip)
	* @param {Event} ev
	*/
	const userOut = (ev) => {
		if( model.showing === false ) return; 
		model.reset();  // reset the Tooltip
		window.removeEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Over (or click toggle tip)
	* if the user scrolls, remove the tooltip (as it will be out of position)
	* @param {Event} ev
	*/
	const userOver = ( ev ) => {
		model.update( ev.target ); 
		window.addEventListener('scroll', userOut, { capture:true, once:true });
	};
	
	/**
	* Covers touch behaviour
	* @param {Event} ev
	*/
	const userClick = ( ev ) => {
		if( ev.target.isSameNode( model.target ) && model.showing ){
			// this will need updating to support clickThrough on touch.
			// tooltip should not get shown.
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