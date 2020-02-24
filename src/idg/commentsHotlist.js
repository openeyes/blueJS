(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('commentHotlist');	
	
	/*
	Basic implement for IDG 
	whilst moving over from jQuery 
	needs improving ...
	*/
	
	const selector = '.oe-hotlist-panel .js-patient-comments';
	const quick = document.querySelector('#hotlist-quicklook');

	const quickOut = () => {
		uiApp.hide(quick);
	};
	
	const quickOver = (ev) => {
		const icon = ev.target;
		/*
		icon is relative positioned by CSS to '.parent-activity'
		offset of 21px allows for the height of the <tr>
		*/
		let relativeTo = uiApp.getParent(icon, '.patient-activity');
		let top = icon.getBoundingClientRect().top - relativeTo.getBoundingClientRect().top + 21;
	
		if(icon.classList.contains('comments-added')){
			quick.textContent = getComments(icon);
			quick.style.top = top + 'px';
			uiApp.show(quick);
		} 
	};
	
	const getComments = (icon) => {
		const trComments = uiApp.getParent(icon,'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		return textArea.value;
	};
	
	const userClick = (ev) => {
		const icon = ev.target;
		const comments = getComments(icon);
		const trComments = uiApp.getParent(icon, 'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		trComments.style.display = "table-row";
		uiApp.resizeTextArea(textArea);
	};
	
	uiApp.registerForClick(selector, userClick);
	uiApp.registerForHover(selector,quickOver);
	uiApp.registerForExit(selector,quickOut);
	
})(bluejay); 