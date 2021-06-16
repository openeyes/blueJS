(function( bj, clinic ){

	'use strict';	
	
	/**
	* Customise a step via a popup
	*/
	let popup = null;
	
	const setPopup = () => {
		const wrap = bj.div("oe-popup-wrap");
		const div = bj.div("oe-popup");
		wrap.append( div );
		
		div.innerHTML = [
			`<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>`,
			`<div class="title">Add custom general task</div>`,
			`<div class="oe-popup-content">`,
			`<h4>Name</h4>`,
			`<input name="taskname" type="text" maxlength="64" size="66" placeholder="Task name (maximum 64 characters)"/>`,
			`<h4>Step pathway display name (restricted to 16 characters)</h4>`,
			`<input name="shortname" type="text" maxlength="16" size="18" placeholder="max 16 characters"/>`,
			`</div><!-- .oe-popup-content -->`,
			`<div class="popup-actions flex-right">`,
			`<button class="green hint js-add-custom-step">Add to selected patients</button>`,
			`<button class="red hint js-cancel-popup-steps">Cancel</button>`,
			`</div>`
		].join('');
		
		const shortname = div.querySelector('input[name=shortname]');
		
		div.addEventListener('input', ev => {
			ev.stopPropagation();
			if( ev.target.name == "taskname" ){
				const task = ev.target.value; 
				if( task.length > 16 ){
					shortname.value = task.substring(0, 13) + '...';	
				} else {
					shortname.value = task;
				}
			}
		});
		
		bj.userClick('button.js-add-custom-step', () => {
			const ps = { c:'General', s:'todo', t:'process' };
			if( shortname.value.length > 1 ) ps.c = shortname.value;
			bj.customEvent('idg:addCustomStep', ps );
			wrap.remove();
		});	
		
		return wrap;
	};
	
	const init = () => {
		popup = popup || setPopup();
		document.body.append( popup );
	};
	
	// make component available to Clinic SPA	
	clinic.customStep = init;			
  
})( bluejay, bluejay.namespace('clinic')); 