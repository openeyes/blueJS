/**
* Textarea Resize on type
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('notificationBanner');	
	
	if(document.querySelector('#oe-admin-notifcation') === null) return;
	
	const selector = '#oe-admin-notifcation .oe-i';

	/*
	2 types of notification
	#notification-short - short description 
	#notification-full - long description
	*/
	const shortInfo = document.querySelector('#notification-short');
	const longInfo = document.querySelector('#notification-full');
	
	/*
	Login Page?
	Show the full notification, no interaction!
	*/
	if(document.querySelector('.oe-login') !== null){
		shortInfo.style.display = "none";
		longInfo.style.display = "block";
		document.querySelector(selector).style.display = "none";	
		return; 	
	}
	
	/*
	Set up interaction on the 'info' icon
	*/
	let defaultDisplay = shortInfo, 
		otherDisplay = longInfo,
		shortDesc = true;
		
	/**
	* show/hide switcher
	* @param {HTMLELement} a - show
	* @param {HTMLELement} b - hide
	*/	
	const showHide = (a,b) => {
		a.style.display = "block";
		b.style.display = "none";
	};
	
	/*
	Events
	*/
	const changeDefault = () => {
		// clicking changes the default state "view" state
		defaultDisplay 	= shortDesc ? longInfo : shortInfo;
		otherDisplay 	= shortDesc ? shortInfo : longInfo;
		shortDesc = !shortDesc;
		
		// Update View (may not change view but is now default IS updated)
		showHide(defaultDisplay,otherDisplay);
	};
	
	uiApp.registerForHover(	selector,	() => showHide(otherDisplay,defaultDisplay) );
	uiApp.registerForExit(	selector,	() => showHide(defaultDisplay,otherDisplay) );	
	uiApp.registerForClick(	selector,	changeDefault );

})(bluejay); 