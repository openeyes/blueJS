(function( bj ){

	'use strict';
	
	if( document.querySelector('.js-event-date-change') === null ) return;
	
	const changeEventDate = ( ev ) => {
		let icon = ev.target;
		let input = ev.target.parentNode.querySelector('input');
		let text = ev.target.parentNode.querySelector('.js-event-date');
			
		icon.classList.add('disabled');
		bj.hide( text );
		bj.show( input );
		setTimeout(() => input.focus(), 20);
	};
	
	bj.userDown('.js-event-date-change > .rewind', changeEventDate ); 	
			
})( bluejay ); 