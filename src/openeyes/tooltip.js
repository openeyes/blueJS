(function (uiApp) {
	
	'use strict';
	
	uiApp.addModule('tooltip'); // flag 
	
	const selector = ".js-has-tooltip";
	let div = null;
	let showing = false;
	let winWidth = window.innerWidth; // forces reflow, only update onResize
	let clickTarget = null;
	
	/*
	OE tooltips: 
	1) Basic
	2) Bilateral (eyelat icons are optional)
	Tooltip widths are set by CSS	
	*/
	const css = {
		basicWidth: 200,
		bilateralWidth: 400, 
	};
		
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
		div.style.cssText = "display:none"; // clear all styles & hide
	};
	
	/**
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => {
		if(ev.target.isSameNode(clickTarget)){
			if(showing){
				out();
			} else {
				show(ev);
			}
		} else {
			// user clicks on another icon
			out();
			show(ev);
		}
		
		/*
		without this you will have to double click 
		to open another tooltip on touch
		*/
		clickTarget = ev.target;
	};
	
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
		
		
		// actually can be any DOM element
		// but generally is an icon <i>				
		const icon = ev.target; 
		
		// build the DOM if not done already
		div = div || buildDOM();
		
		// set up for basic, as most common
		let tipWidth = css.basicWidth; 
		let divDisplayMode = 'block';
		
		// check tooltip type
		if(icon.dataset.ttType === "bilateral"){
			/*
			Bilateral enhances the basic tooltip
			with 2 content areas for Right and Left 	
			*/
			div.classList.add('bilateral');
			/*
			No eye lat icons?
			*/
			if(icon.dataset.ttEyeicons === 'no'){
				div.classList.add('no-icons');
			}
			
			div.innerHTML = '<div class="right"></div><div class="left"></div>';
			div.querySelector('.right').innerHTML = icon.dataset.ttRight;
			div.querySelector('.left').innerHTML = icon.dataset.ttLeft; 
			
			divDisplayMode = 'flex';
			tipWidth = css.bilateralWidth; 
			
		} else {
			/*
			basic: content is stored in: data-tootip-content
			which may contain basic HTML tags, such as <br>
			*/
			div.innerHTML = icon.dataset.tooltipContent; 
		}
		
		/*
		Check the tooltip height to see if content fits.	
		*/
		let offsetW = tipWidth/2; 
		let offsetH = 8; // visual offset, which allows for the arrow
		
		// can't get the DOM height without some trickery...
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
			offsetW = (tipWidth - 20); 			// position to the left of icon, needs to match CSS arrow position
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
		div.style.display = divDisplayMode;
		
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