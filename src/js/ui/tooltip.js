/**
UI Tooltips 
*/
(function () {

	'use strict';
	
	/**
		Find all tooltips (js-has-tooltip)
		touch with hover enhancement
		build dom frame (and record state)
		position and update css to reflex this
	*/
	
	// do we have any tooltips?
	let tooltips = bluejay.nodeArray(document.querySelectorAll('.js-has-tooltip'));
	if(tooltips.length === 0) return; // none!
	
	bluejay.log('tooltips - init:' + tooltips.length);
	
	/*
	create and add the div to the DOM
	simply update the content when required
	hide offscreen when removed
	*/
	const div = document.createElement('div');
	div.className = "oe-tooltip";
	
	bluejay.appendToBody(div);
	
	


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
