(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('comments');	
	
	
	/**
	Comments icon is clicked on to reveal 
	comments input field. Either:
	1) Textarea switches places with icon button
	2) Textarea is shown in different DOM placement  
	**/
	
	const userClick = (ev) => {
		const btn = ev.target;
		const comments = document.querySelector('#' + btn.dataset.input);
		uiApp.hide(btn);
		uiApp.show(comments);
		comments.querySelector('textarea').focus();
		comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
			uiApp.show(btn,"inline-block");
			uiApp.hide(comments);
		},{once:true});	
	};
	
	uiApp.registerForClick('.js-add-comments', userClick );
	
})(bluejay); 