/**
* Textarea Resize on type
*/
(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('textAreaResize');	

	document.addEventListener('input', (ev) => {
		if(ev.target.matches('textarea')){
			ev.target.style.height = 'auto';
			ev.target.style.height = ev.target.scrollHeight + 'px';
		}
	},true);

})(bluejay); 