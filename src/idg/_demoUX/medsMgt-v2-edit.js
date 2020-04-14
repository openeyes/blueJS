(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	*/
	
	// tr class hook: .js-idg-demo-13420;
	if(document.querySelector('.js-idg-demo-13420') === null) return;
	
	// state change is based on the prescribed toggle switch
	document.addEventListener('input',(ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-demo-13420 .toggle-switch input')){
			/*
			toggling the presciption: 
			ON: show 'Stop' / hide: Duration/dispense & taper
			*/
			let tr = uiApp.getParent(me, 'tr');
			let stopBtn = tr.querySelector('.js-idg-stop-btn');
			let durDis = tr.querySelector('.js-idg-duration-dispense');
			let taperBtn = tr.querySelector('.js-idg-taper-btn');
			
			
			if(me.checked){
				// on
				uiApp.show(stopBtn);
				uiApp.hide(durDis);
				uiApp.hide(taperBtn);	
			} else {
				// off
				uiApp.hide(stopBtn);
				uiApp.show(durDis);
				uiApp.reshow(taperBtn);
			}
			
			
		}
	});

			
})(bluejay); 