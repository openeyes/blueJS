(function( bj ) {

	'use strict';
	
	if( document.querySelector('.home-messages') === null ) return;
	
	const btn = {
		messages: document.getElementById('idg-js-sidebar-viewmode-1'),
		tags: document.getElementById('idg-js-sidebar-viewmode-2'),
	};
	
	const sidebar = {
		messages: document.querySelector('.sidebar-messages'),
		tags: document.querySelector('.sidebar-tags'),
	};
	
	const content = {
		messages: document.querySelector('.messages-all'),
		tags: document.querySelector('.tags-all'),
	};
	
	const showMessages = () => {
		if(btn.messages.classList.contains('selected')) return;
		btn.messages.classList.add('selected');
		btn.tags.classList.remove('selected');
		
		bj.show( sidebar.messages );
		bj.hide( sidebar.tags );
		bj.show( content.messages );
		bj.hide( content.tags );
		
	};
	
	const showTags = () => {
		if(btn.tags.classList.contains('selected')) return;
		btn.messages.classList.remove('selected');
		btn.tags.classList.add('selected');
		
		bj.hide( sidebar.messages );
		bj.show( sidebar.tags );
		bj.hide( content.messages );
		bj.show( content.tags );
	};
	
	
	bj.userDown('#idg-js-sidebar-viewmode-1', showMessages );
	bj.userDown('#idg-js-sidebar-viewmode-2', showTags ); 
			
})( bluejay ); 