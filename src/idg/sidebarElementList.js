(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sidebarElementList');	
	

	/*
	Build sidebar element list in EDIT mode
	Run through Elements grab there titles and then display them	
	*/	
	
	// get the <UL> wrapper
	let ul = document.querySelector('.sidebar-eventlist .oe-element-list');
	
	// pretty sure only this class is used here
	let elemTitles = document.querySelectorAll('.element-title');
	if(elemTitles.length < 1) return;
	
	// avoid reflow until necessary
	let fragment = document.createDocumentFragment();
	
	elemTitles.forEach( function(title){
		let li = document.createElement('li');
		li.innerHTML = '<a href="#">'+title.textContent+'</a>';
		fragment.appendChild(li);		
	});
	
	// add the DOM list
	ul.appendChild(fragment);

	

})(bluejay); 