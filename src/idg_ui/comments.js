(function( bj ) {

	'use strict';	
	
	bj.addModule('comments');	

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
		
		bj.hide( btn );
		
		if(json.bilateral){
			// Find 2 comment inputs (I assume suffix of "-left" & '-right')
			const commentsR = document.querySelector('#' + json.id + '-right');
			const commentsL = document.querySelector('#' + json.id + '-left');
			
			bj.show( commentsR, 'block');
			bj.show( commentsL, 'block');
			
			commentsR.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( commentsR );
				bj.hide( commentsL );
			}, { once:true });
			
			commentsL.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( commentsR );
				bj.hide( commentsL );
			}, { once:true });
				
		} else {
			// single comment input
			const comments = document.querySelector('#' + json.id);
			bj.show( comments, 'block' );
			comments.querySelector('textarea').focus();
			comments.querySelector('.js-remove-add-comments').addEventListener('mousedown', () => {
				bj.show( btn );
				bj.hide( comments );
			},{ once:true });	
		}
	};
	
	bj.userDown('.js-add-comments', userClick );
	
})( bluejay ); 