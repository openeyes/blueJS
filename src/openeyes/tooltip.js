(function (uiApp) {
	
	'use strict';
	
	uiApp.addModule('tooltip'); // flag 
	
	const selector = ".js-has-tooltip";
	let div = null;
	let showing = false;
	let winWidth = window.innerWidth; // forces reflow, only update onResize
		
	/**
	Build the Tooltip DOM, once built just update when required. 
	*/
	const buildDOM = () => {
		div = document.createElement('div');
		uiApp.appendTo('body',div);
		resetToolTip();
		return div;
	};
	
	/**
	Reset Tooltip content and hide it 
	*/
	const resetToolTip = () => {
		div.innerHTML = "";
		div.className = "oe-tooltip"; // clear all CSS classes
		div.style.cssText = "display:none"; // clear all styles
	};
	
	/**
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => showing ? out() : show(ev);
	
	/**
	* Callback for 'exit'
	*/
	const out = () => {
		if(!showing) return; showing = false;
		resetToolTip();
	};
	
	/**
	* Callback for 'hover'
	* @param {Event} ev
	*/
	const show = (ev) => {
		if(showing) return; showing = true;
		
		// always an icon <i>				
		const icon = ev.target; 
		
		// build the DOM if not done already
		div = div || buildDOM();
		
		/*
		content is stored in: data-tootip-content
		which could contain HTML tags
		*/
		div.innerHTML = icon.dataset.tooltipContent; 
		
		/*
		Check the tooltip height
		width is restricted in the CSS to 200px;	
		*/
		const tipWidth = 200; 
		let offsetW = tipWidth/2; 
		let offsetH = 8; // visual offset, which allows for the arrow
		
		// can't get the height without some trickery...
		let h = uiApp.getHiddenElemSize(div).h;
						
		/*
		work out positioning based on icon
		this is a little more complex due to the hotlist being
		fixed open by CSS above a certain browser size, the
		tooltip could be cropped on the right side if it is.
		*/
		let domRect = icon.getBoundingClientRect();
		let center = domRect.right - (domRect.width/2);
		let top = domRect.top - h - offsetH;
	
		// watch out for the hotlist, which may overlay the tooltip content
		let extendedBrowser = uiApp.settings.cssExtendBrowserSize;
		let maxRightPos = winWidth > extendedBrowser ? extendedBrowser : winWidth;
		
		/*
		setup CSS classes to visually position the 
		arrow correctly based on it's positon
		*/
		
		// too close to the left?
		if(center <= offsetW){
			offsetW = 20; 			// position to the right of icon, needs to match CSS arrow position
			div.classList.add("offset-right");
		}
		
		// too close to the right?
		if (center > (maxRightPos - offsetW)) {
			offsetW = 180; 			// position to the left of icon, needs to match CSS arrow position
			div.classList.add("offset-left");
		}
		
		// is there enough space above icon for standard posiitoning?
		if( domRect.top < h ){
			top = domRect.bottom + offsetH; // nope, invert and position below
			div.classList.add("inverted");
		} 
		
		// update DOM and show the tooltip
		div.style.top = top + 'px';
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
		
		// hide if user scrolls
		window.addEventListener('scroll', out, {capture:true, once:true});
	};
	
	
	// Register/Listen for Events
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,show);
	uiApp.registerForExit(selector,out);
	
	// innerWidth forces a reflow, only update when necessary
	uiApp.listenForResize(() => winWidth = window.innerWidth);
	
	
})(bluejay); 