(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('messagePreview');	
	
	/*
	Message hub... view all the message
	*/
	if( document.querySelector('.home-messages') === null ) return;
	
	
	const userClick = (ev) => {
		let icon = ev.target;
		let message = uiApp.getParent(icon,'tr').querySelector('.message');
		if(icon.classList.contains('expand')){
			message.classList.add('expand');
			icon.classList.replace('expand','collapse');
		} else {
			message.classList.remove('expand');
			icon.classList.replace('collapse','expand');
		}		
	};

	/*
	Events
	*/
	uiApp.registerForClick(	'.js-expand-message',	userClick );

})(bluejay); 