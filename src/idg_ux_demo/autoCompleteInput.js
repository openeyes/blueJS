(function( bj ) {

	'use strict';	
	
	bj.addModule('autoCompleteInput');

	const autoComplete = input => {
		const rect = input.getBoundingClientRect();
		
		// build a demo autocomplete
		const ul = bj.dom('ul', 'oe-autocomplete');
		ul.innerHTML = [
			`<li>Example of an autocomplete</li>`,
			`<li>Another longer example of an autocomplete suggestion</li>`,
			`<li>Abnormal communication between pericardial sac and peritoneal cavity</li>`
		].join('');
		
		ul.style.top = (rect.top + rect.height) + 'px';
		ul.style.left = rect.left + 'px';
		
		document.body.append( ul );
		
		document.addEventListener('focusout', ev => {
			ul.remove();
		}, { once: true });
		
	};
	
	bj.userDown('.js-idg-demo-autocomplete', ev => autoComplete( ev.target ));	
	
})( bluejay ); 