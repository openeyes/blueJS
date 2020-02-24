(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('eventAuditTrial');	
	
	/*
	Only 1 of these per Event page
	*/
	const selector = '#js-event-audit-trail-btn';
	const icon = document.querySelector(selector);
	if(icon === null) return; 
	
	/*
	'popup' content should be pre-loaded in the DOM
	*/
	const popup = document.querySelector('#js-event-audit-trail');
	if(popup === null) uiApp.log('Audit Trail content not available in DOM?');
	
	let showing = false;
	
	/**
	* Callback for 'click'
	* @param {Event} ev
	*/
	const userClick = (ev) => showing ? hide(ev) : show(ev);

	/**
	* Callback for 'hover'
	* @param {Event} ev
	*/
	const show = (ev) => {
		uiApp.show(popup);
		icon.classList.add('active');
		showing = true;
	};
	
	/**
	* Callback for 'ext'
	* @param {Event} ev
	*/
	const hide = (ev) => {
		uiApp.hide(popup);
		icon.classList.remove('active');
		showing = false;
	};
	
	/*
	Events	
	*/
	uiApp.registerForClick(selector,userClick);
	uiApp.registerForHover(selector,show);
	uiApp.registerForExit(selector,hide);


})(bluejay); 