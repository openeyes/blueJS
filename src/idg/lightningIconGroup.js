(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('lightningIconGroups');
	
	const iconGroups = uiApp.nodeArray(document.querySelectorAll('.icon-group'));
	if(iconGroups.length < 1) return;
	
	iconGroups.forEach((group) => {
		let count = group.childElementCount;
		let div = document.createElement('div');
		div.textContent = '(' + count + ')';
		uiApp.hide(div);
		group.parentNode.appendChild(div);
	});
	
	const collapseTimeline = (ev) => {
		let icon = ev.target;
		let group = document.querySelector('#js-icon-' + icon.dataset.icons);
		if(icon.classList.contains('collapse')){
			uiApp.hide(group);
			uiApp.show(group.nextElementSibling, 'block');
			icon.classList.replace('collapse','expand');
		} else {
			uiApp.show(group, 'block');
			uiApp.hide(group.nextElementSibling);
			icon.classList.replace('expand','collapse');
		}
	};
	
	/*
	Events 
	*/
	uiApp.userDown('.js-timeline-date', collapseTimeline);
	
})(bluejay); 