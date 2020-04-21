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
			let ongoingTxt = tr.querySelector('.js-idg-ongoing-text');
			let stopBtn = tr.querySelector('.js-idg-date-stop');
			let durDis = tr.querySelector('.js-idg-duration-dispense');
			let taperBtn = tr.querySelector('.js-idg-taper-btn');
			let reasons = tr.querySelector('.js-idg-stopped-reasons');
			
			if(me.checked){
				// on
				uiApp.hide(stopBtn);
				uiApp.hide(reasons);
				uiApp.show(ongoingTxt);
				uiApp.show(durDis);
				uiApp.reshow(taperBtn);	
			} else {
				// off
				uiApp.show(stopBtn);
				uiApp.hide(ongoingTxt);	
				uiApp.hide(durDis);
				uiApp.hide(taperBtn);
			}	
		}
	});
	
	const updateStopState = (td, stop) => {
		
		let stopBtn = td.querySelector('.js-idg-stop-btn');
		let stopDate = td.querySelector('.js-idg-stop-date');
		let reasons = td.querySelector('.js-idg-stopped-reasons');
		let cancelIcon = td.querySelector('.js-idg-cancel-stop');
		
		if(stop){
			uiApp.hide(stopBtn);
			uiApp.show(stopDate);
			uiApp.show(reasons);
			uiApp.show(cancelIcon);
		} else {
			uiApp.show(stopBtn);
			uiApp.hide(stopDate);
			uiApp.hide(reasons);
			uiApp.hide(cancelIcon);
		}
	};
	
	// 'stop' button
	document.addEventListener('click', (ev) => {
		if(ev.target.matches(".js-idg-stop-btn")){
			updateStopState( uiApp.getParent(ev.target, 'td'), true);
		}
	});
	
	// cancel 'stop'
	document.addEventListener('mousedown', (ev) => {
		if(ev.target.matches('.js-idg-cancel-stop')){
			updateStopState( uiApp.getParent(ev.target, 'td'), false);
		}
	});

	
	// Show history
	document.addEventListener('mousedown',(ev) => {
		let me = ev.target;
		if(me.matches('.js-show-medication-history')){
			let tableRows = document.querySelectorAll('.js-idg-medication-history-' + me.dataset.idgdemo);
			tableRows.forEach((row) => {
				if(row.style.display == "table-row"){
					row.style.display = "none";
				} else {
					row.style.display = "table-row";
				}
				
			});
		}
	});
			
})(bluejay); 