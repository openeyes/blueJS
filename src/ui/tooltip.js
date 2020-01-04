/**
Tooltips (on icons)
These may be loaded after intial DOM load (asynchronously)
Build DOM structure and watch for Events, as only ONE tooltip
is open at a time, reuse DOM, update and position
*/
(function () {

	'use strict';

	const selector = ".js-has-tooltip";
	const dataAttribute = "tooltipContent"; 			// data-tooltip-content
	const app = bluejay.addModule('tooltip'); 			// get unique namespace for module
	
	let showing = false;
	
	// create DOM
	const div = document.createElement('div');
	div.className = "oe-tooltip";
	div.style.top = '20px';
	div.style.left = '20px';
	
	bluejay.appendTo('body',div);
	
	// on user click or hover
	const show = (event) => {
		if(showing) return;
		console.log(event);
		//div.innerHTML = tip; // could contain HTML
	};
	
	const hide = () => {
		console.log('hide tooltip');
	};
	
	// Register to listen for Events
	bluejay.listenForHover(selector,show);
	bluejay.listenForClick(selector,show);
	bluejay.listenForExit(selector,hide);
	

})(); 


/*
idg.tooltips = function(){
	$('.js-has-tooltip').hover(
		function(){
			var text = $(this).data('tooltip-content');
			var leftPos, toolCSS; 
		
			// get icon DOM position
			let iconPos = $(this)[ 0 ].getBoundingClientRect();
			let iconCenter = iconPos.width / 2;
			
			// check for the available space for tooltip:
			if ( ( $( window ).width() - iconPos.left) < 100 ){
				leftPos = (iconPos.left - 188) + iconPos.width // tooltip is 200px (left offset on the icon)
				toolCSS = "oe-tooltip offset-left";
			} else {
				leftPos = (iconPos.left - 100) + iconCenter - 0.5 	// tooltip is 200px (center on the icon)
				toolCSS = "oe-tooltip";
			}
			
			// add, calculate height then show (remove 'hidden')
			var tip = $( "<div></div>", {
								"class": toolCSS,
								"style":"left:"+leftPos+"px; top:0;"
								});
			// add the tip (HTML as <br> could be in the string)
			tip.html(text);
			
			$('body').append(tip);
			// calc height:
			var h = $(".oe-tooltip").height();
			// update position and show
			var top = iconPos.y - h - 25;
			
			$(".oe-tooltip").css({"top":top+"px"});
			
		},
		function(){
			$(".oe-tooltip").remove();
		}
	);	
}
*/
