/**
* Hidden DOM Elements
*/
(function (uiApp) {

	'use strict';
	
	/*
	To avoid a 'flickering' effect
	DOM elements that need to be 'hidden'
	on page load need to use "hidden" CSS class
	when the JS loads it can switch it over
	*/ 
	
	let hidden = uiApp.nodeArray(document.querySelectorAll('.hidden'));
	if(hidden.length < 1) return; // no elements!
	
	hidden.forEach( (elem) => {
		elem.style.display = "none";
		elem.classList.remove('hidden');
	});

	
	
	$('.hidden').hide().removeClass('hidden');

	
	
})();