(function( bj ){

	'use strict';
	
	if( document.querySelector('.js-event-date-change') === null ) return;
	
	const changeEventDate = ( ev ) => {
		let icon = ev.target;
		let input = ev.target.parentNode.querySelector('input');
		let text = ev.target.parentNode.querySelector('.js-event-date');
		
		if( icon.classList.contains('rewind')){
			icon.classList.remove('rewind');
			icon.classList.add('save');
			bj.hide( text );
			bj.show( input );
			setTimeout(() => input.focus(), 20);
		} else {
			icon.classList.add('rewind');
			icon.classList.remove('save');
			text.textContent = input.value;
			bj.show( text );
			bj.hide( input );
		}
	};
	
	bj.userDown('.js-event-date-change > .oe-i', changeEventDate ); 	
			
})( bluejay ); 