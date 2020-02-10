/**
* Exam Element Search (pre OE 3.0)
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('examElementSearch');	
	
	/*
	IDG basic demo. DOM is included
	*/
	
	if(document.querySelector('#js-search-in-event-popup') === null) return;

	const userClick = (ev) => {
		const	hdBtn = ev.target,
				popup = document.querySelector('#js-search-in-event-popup'),
				mainEvent = document.querySelector('.main-event'),
				closeBtn = popup.querySelector('.close-icon-btn');
		
		hdBtn.classList.add('selected');
		popup.style.display = "block";
		// the pop will overlay the Event.. add this class to push the Exam content down
		mainEvent.classList.add('examination-search-active');
		
		closeBtn.addEventListener('mousedown',(ev) => {
			ev.stopPropagation();
			mainEvent.classList.remove('examination-search-active');
			popup.style.display = "none";
			hdBtn.classList.remove('selected');
			
		},{once:true});		
	};
	
	/*
	Events
	*/
	uiApp.registerForClick(	'#js-search-in-event',	userClick );

})(bluejay); 