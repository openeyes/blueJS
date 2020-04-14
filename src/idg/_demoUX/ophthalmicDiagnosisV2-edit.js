(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	for Ophthalmic Diagnosis v2!
	*/
	
	if(document.querySelector('.js-idg-diagnosis-active-switcher') === null) return;
	
	const editDate = (id, display) => {
		document.querySelector('#js-idg-demo-diag-date'+id+' input').style.display = display;
	};

	// Active Switcher
	document.addEventListener('input',(ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-diagnosis-active-switcher input')){
			let switcher = me.parentNode.parentNode;
			let text = switcher.querySelector('.js-active-state');
			//;
			let newAdded = switcher.dataset.idgadded === '1' ? true : false;
			let txtActive = 'Active from';
			let txtInactive = 'Inactive from';
			
			if(newAdded){
				txtActive = "Started";
				txtInactive = "None";
			}

			if(me.checked){
				text.textContent = txtActive;
				text.classList.remove('fade');
				if(newAdded){
					editDate(switcher.dataset.idgdemo, 'block');
				}
				
			} else {
				text.textContent = txtInactive;
				text.classList.add('fade');
				if(newAdded){
					editDate(switcher.dataset.idgdemo, 'none');
				}
			}
			
			
		}
	});
	
	// Show history
	document.addEventListener('mousedown',(ev) => {
		let me = ev.target;
		if(me.matches('.js-show-diagnosis-history')){
			let tableRows = document.querySelectorAll('.js-idg-js-idg-diagnosis-history-' + me.dataset.idgdemo);
			tableRows.forEach((row) => {
				console.log(row.style.display);
				if(row.style.display == "table-row"){
					row.style.display = "none";
				} else {
					row.style.display = "table-row";
				}
				
			});
		}
		
		if(me.matches('.js-idg-demo-show-diagnosis-comments')){
			document.querySelector('.js-idg-diagnosis-comments-'+me.dataset.idgdemo).style.display = "table-row";
		}
		
		if(me.matches('.js-remove-diagnosis-comments')){
			me.parentNode.parentNode.style.display = "none";
		}
	});
			
})(bluejay); 