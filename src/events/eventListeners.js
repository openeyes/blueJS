/**
* Event Listeners
*/
(function (uiApp) {

	'use strict';
	
	/**
	To improve performance delegate Event handling to the document
	useCapture rather than waiting for the bubbling
	*/
	
	document.addEventListener('mouseover',	uiApp.onHoverEvent,		true);
	document.addEventListener('mousedown',	uiApp.onClickEvent,		true); 
	document.addEventListener('mouseout',	uiApp.onExitEvent,		true);
	 
	// these are handled a bit differently
	window.addEventListener('scroll',		uiApp.onWindowScroll,	true);
	window.onresize = uiApp.onWindowResize; 
	
})(bluejay);