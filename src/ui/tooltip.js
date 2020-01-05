/**
Tooltips (on icons)
These may be loaded after intial DOM load (asynchronously)
Build DOM structure and watch for Events, as only ONE tooltip
is open at a time, reuse DOM, update and position
*/
(function () {

	'use strict';

	const app = bluejay.addModule('tooltip'); 	// get unique namespace for module
	const selector = ".js-has-tooltip";
	const mainClass = "oe-tooltip";
	let showing = false;
		
	// create DOM (keep out of reflow)
	let div = document.createElement('div');
	div.className = mainClass;
	div.style.display = "none";
	bluejay.appendTo('body',div);

	/**
	* Show tooltip. Update from Event
	* @param {Event} event
	*/
	const show = (event) => {
		if(showing) return;
		showing = true;
				
		const icon = event.target; // always an icon	
		div.innerHTML = icon.dataset.tooltipContent; // could contain HTML
		
		/*
		tooltip could be anything check the tooltip height
		width is restricted in the CSS to 200px;	
		*/
		let offsetW = 100; // toptip is 200px
		let offsetH = 8; // visual offset, allows for the arrow
		let css = ""; // classes to position the arrows correct
		
		// can't get the height without some tricky...
		let h = bluejay.getHiddenElemSize(div).h;
						
		/*
		work out positioning based on icon
		this is a little more complex due to the hotlist being
		fixed open by CSS above a certain browser size, the
		tooltip could be cropped on the right side if it is.
		*/
		let domRect = icon.getBoundingClientRect();
		let center = domRect.right - (domRect.width/2);
		let top = domRect.top - h - offsetH + 'px';
	
		// watch out for the hotlist
		let extendedBrowser = bluejay.getSetting('css').extendedBrowserSize;
		let maxRightPos = window.innerWidth > extendedBrowser ? extendedBrowser : window.innerWidth;
		
		// Icon too near a side?
		if(center <= offsetW){
			offsetW = 20; 			// position right of icon, needs to match CSS arrow position
			css = "offset-right";
		} else if (center > (maxRightPos - offsetW)) {
			offsetW = 180; 			// position left of icon, needs to match CSS arrow position
			css = "offset-left";
		}
		
		// is there enough space above icon for standard posiitoning?
		if( domRect.top < h ){
			top = domRect.bottom + offsetH + 'px'; // nope, invert and position below
			css = "inverted";
		} 
		
		// update DOM
		div.className = mainClass + " " + css;
		div.style.top = top;
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	/**
	* Hide tooltip and reset
	* @param {Event}
	*/
	const hide = (event) => {
		if(showing === false) return;
		showing = false;
		
		div.innerHTML = "";
		div.className = mainClass;
		div.style.cssText = "display:none"; // clear all styles
	};

	
	// Register/Listen for Events
	bluejay.registerForClick(selector,show);
	bluejay.registerForHover(selector,show);
	bluejay.registerForExit(selector,hide);
	
	bluejay.listenForScroll(hide);
	
})(); 