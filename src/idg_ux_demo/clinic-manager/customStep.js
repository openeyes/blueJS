(function( bj, clinic ){

	'use strict';	
	
	/**
	* Editable steps from adder!
	*/
	let type = null;
	let popup = null;
	let stepData = null;
	
	/**
	* Content: General custom task
	*/
	const domCustom = ( div ) => {
		div.querySelector('.title').textContent = "Add custom general task";
		
		const content = div.querySelector('.oe-popup-content');
		content.innerHTML = [
			`<h4>Name</h4>`,
			`<input name="taskname" type="text" maxlength="64" size="66" placeholder="Task name (maximum 64 characters)"/>`,
			`<h4>Step pathway display name (restricted to 16 characters)</h4>`,
			`<input name="shortname" type="text" maxlength="16" size="18" placeholder="Display name"/>`,
		].join('');
		
		stepData = { c:'General', s:'todo', t:'process' };	
	};
	

	/**
	* Content: Timer
	*/
	const domTimer = ( div ) => {
		div.querySelector('.title').textContent = "Add pathway hold timer";
		
		const mins = min => `<label><input type="radio" name="idg-timer-mins" value="${min}"><div class="li">Add ${min} minute timer</div></label>`;
		
		const content = div.querySelector('.oe-popup-content');
		content.innerHTML = [
			`<h4>Timer</h4>`,
			`<fieldset class="btn-list">`,
			mins(1),
			mins(2),
			mins(5),
			mins(10),
			mins(15),
			mins(20),
			mins(30),
			`</fieldset>`,
		].join('');
		
		stepData = { c:'1', s:'todo', t:'hold', i:'on-hold' };
	};
	
	
	/**
	* build template DOM
	* @returns Element
	*/
	const setPopup = () => {
		const wrap = bj.div("oe-popup-wrap");
		const div = bj.div("oe-popup");
		wrap.append( div );
		
		div.innerHTML = [
			`<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>`,
			`<div class="title"></div>`,
			`<div class="oe-popup-content">`,
			`</div><!-- .oe-popup-content -->`,
			`<div class="popup-actions flex-right">`,
			`<button class="green hint js-add-custom-step">Add to selected patients</button>`,
			`<button class="red hint js-cancel-popup-steps">Cancel</button>`,
			`</div>`
		].join('');
		
		// only custom name needs this, but here so only declared once:
		div.addEventListener('input', stepBuilder );
		return wrap;
	};
	
	/**
	* Inputs
	*/
	const stepBuilder = ( ev ) => {
		// custom name
		if( ev.target.name == "taskname" ){
			const task = ev.target.value; 
			const shortname = ev.target.parentNode.querySelector('input[name="shortname"]');
			if( task.length > 16 ){
				shortname.value = task.substring(0, 13) + '...';	
			} else {
				shortname.value = task;
			}
			stepData.c = shortname.value.length > 1 ? shortname.value : 'General';
		}
		
		if( ev.target.name == "idg-timer-mins"){
			stepData.c = ev.target.value;
		}
	};
	
	/**
	* Event - update the App
	*/
	bj.userClick('button.js-add-custom-step', () => {
		bj.customEvent('idg:addCustomStep', stepData );
		popup.remove();
	});
	
	/**
	* Editable steps: General (common) or Hold timer
	* @param {String} userRequest - 'common' or 'timer'
	*/
	const init = ( userRequest ) => {
		type = userRequest;
		popup = popup || setPopup();
		
		if( type == "common") domCustom( popup.firstChild );
		if( type == "timer") domTimer( popup.firstChild );
		
		document.body.append( popup );
	};
	
	// make component available to Clinic SPA	
	clinic.customStep = init;			
  
})( bluejay, bluejay.namespace('clinic')); 