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
		btn.style.display = "none";
		comments.style.display = "block";
		comments.querySelector('textarea').focus();
		comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
			btn.style.display = "inline-block";
			comments.style.display = "none";
		},{once:true});	
	};
	
	
	uiApp.registerForClick('.js-add-comments', userClick );
	
})(bluejay); 