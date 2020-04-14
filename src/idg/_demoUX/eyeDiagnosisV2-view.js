(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	for Ophthalmic Diagnosis v2!
	*/
	
	if(document.querySelector('.js-idg-demo-eye-diagnosis-audit') === null) return;
	

	const showPopup = (ev) => {
 		let php = 'specific/exam-eye-diagnosis.php';
		
		if(ev.target.dataset.idgDemo !== undefined){
			php = JSON.parse(ev.target.dataset.idgDemo).php;
		}

		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/' + php)
			.then( html => {
				const div = document.createElement('div');
				div.className = "oe-popup-wrap";
				div.innerHTML = html;
				div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
					ev.stopPropagation();
					uiApp.removeElement(div);
				}, {once:true} );
				
				// reflow DOM
				uiApp.appendTo('body',div);
			})
			.catch(e => console.log('failed to load',e));  // maybe output this to UI at somepoint, but for now... 
	};

	uiApp.registerForClick('.js-idg-demo-eye-diagnosis-audit', showPopup);

			
})(bluejay); 