(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('comments');	

	/**
	Comments icon is clicked on to reveal 
	comments input field. Either:
	1) Textarea switches places with icon button
	2) Textarea is shown in different DOM placement  
	
	update: 
	New Diagnosis Element need comments for both sides
	see: Ophthalmic & Systemic Diagnosis EDIT
	**/
	
	const userClick = (ev) => {
		const btn = ev.target;
		const json = JSON.parse(btn.dataset.idgdemo);
		
		uiApp.hide(btn);
		
		if(json.bilateral){
			// Find 2 comment inputs (I assume suffix of "-left" & '-right')
			const commentsR = document.querySelector('#' + json.id + '-right');
			const commentsL = document.querySelector('#' + json.id + '-left');
			
			uiApp.show(commentsR);
			uiApp.show(commentsL);
			
			commentsR.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
			
			commentsL.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(commentsR);
				uiApp.hide(commentsL);
			},{once:true});
				
		} else {
			// single comment input
			const comments = document.querySelector('#' + json.id);
			uiApp.show(comments);
			comments.querySelector('textarea').focus();
			comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				uiApp.reshow(btn);
				uiApp.hide(comments);
			},{once:true});	
		}
	};
	
	uiApp.registerForClick('.js-add-comments', userClick );
	
})(bluejay); 