/**
Tooltips (on icons)
These may be loaded after intial DOM load (asynchronously)
Build DOM structure and watch for Events, as only ONE tooltip
is open at a time, reuse DOM, update and position
*/
(function () {

	'use strict';

	const selector = ".js-has-tooltip";
	const app = bluejay.addModule('tooltip'); 	// get unique namespace for module
	
	let showing = false;
	
	// create DOM
	let div = document.createElement('div');
	div.className = "oe-tooltip";
	div.style.display = "none";
	bluejay.appendTo('body',div);

	/*
	Interaction.
	1: Click or Touch - (scroll will hide)
	2: Hover on/off enhancement.
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
		let css = ""; // classes to add
		
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
		
		// is there enough space above icon for standard posiitoning?
		if( domRect.top >= h ){
			div.style.top =  domRect.top - h - offsetH + 'px'; 	// yep, position above 
		} else {
			div.style.top = domRect.bottom + offsetH + 'px';  	// nope, invert and position below
		}
	
		// watch out for the hotlist
		let extendedBrowser = bluejay.getSetting('css').extendedBrowserSize;
		let maxRightPos = window.innerWidth > extendedBrowser ? extendedBrowser : window.innerWidth;
		
		// Icon too near a side?
		if(center <= offsetW){
			offsetW = 10; // position right of icon
		} else if (center > (maxRightPos - offsetW)) {
			offsetW = 190; // position left of icon
		}
		
		div.style.left = (center - offsetW) + 'px';
		div.style.display = "block";
	};
	
	const hide = () => {
		div.innerHTML = "";
		div.style.cssText = "display:none"; // clear all styles
		showing = false;
	};
	
	// Register to listen for Events
	bluejay.listenForClick(selector,show);
	bluejay.listenForHover(selector,show);
	bluejay.listenForExit(selector,hide);
	
})(); 