/**
* Event Listeners
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseenter',	uiApp.onHoverEvent,		true);
	document.addEventListener('mousedown',	uiApp.onClickEvent,		false); 
	document.addEventListener('mouseleave',	uiApp.onExitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll', uiApp.onWindowScroll,	true);
	window.onresize = uiApp.onWindowResize; 
	
})(bluejay);