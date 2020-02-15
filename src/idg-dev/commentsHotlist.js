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
		quick.style.display = 'none';
	};
	
	const quickOver = (ev) => {
		const icon = ev.target;
		/*
		icon is relative positioned by CSS to '.parent-activity'
		offset of 21px allows for the height of the <tr>
		*/
		let relativeTo = uiApp.getParent(icon,'.patient-activity');
		let top = icon.getBoundingClientRect().top - relativeTo.getBoundingClientRect().top + 21;
	
		if(icon.classList.contains('comments-added')){
			quick.textContent = getComments(icon);
			quick.style.top = top + 'px';
			quick.style.display = 'block';
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
		const trComments = uiApp.getParent(icon,'tr').nextSibling;
		const textArea = trComments.querySelector('textarea');
		trComments.style.display = "table-row";
		uiApp.resizeTextArea(textArea);
		
		// update the icon based on the textarea
	};
	
	uiApp.registerForClick(selector, userClick);
	uiApp.registerForHover(selector,quickOver);
	uiApp.registerForExit(selector,quickOut);
	
	/*
		if(textArea.val() == ""){
			if($(this).hasClass("comments-added")){
				$(this).removeClass("comments-added active");
				$(this).addClass("comments");
			}
		} else {
			if($(this).hasClass("comments")){
				$(this).removeClass("comments");
				$(this).addClass("comments-added active")
			}
		};
	*/
	
})(bluejay); 