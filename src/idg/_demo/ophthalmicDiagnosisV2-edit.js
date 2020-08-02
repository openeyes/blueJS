(function (uiApp) {

	'use strict';
	
	/*
	IDG DEMO of some UX functionality
	for Ophthalmic Diagnosis v2!
	*/
	
	if(document.querySelector('.js-idg-diagnosis-active-switcher') === null) return;
	
	/*
	Update VIEW states to demo UX
	*/
	const updateActiveState = (div, state) => {
		let text = div.querySelector('.js-idg-diagnosis-text');
		let toggle = div.querySelector('.toggle-switch');
		let remove = div.querySelector('.remove-circle');
		let btn = div.querySelector('.js-idg-diagnosis-add-btn');
		let doubt = div.querySelector('.js-idg-diagnosis-doubt');
		let doubtInput = div.querySelector('.js-idg-diagnosis-doubt-input');
		
		let side = div.dataset.idgside;
		let eyelatIcon = div.parentNode.previousElementSibling.querySelector('.oe-eye-lat-icons .oe-i');
		
		let date = div.parentNode.nextElementSibling.querySelector('.js-idg-diagnosis-date');	
				
		switch(state){
			case 'active':
			uiApp.reshow(text);
			uiApp.reshow(toggle);
			uiApp.reshow(doubt);
			uiApp.hide(remove);
			uiApp.hide(btn);
			uiApp.reshow(date);
			text.textContent = 'Active (confirmed)';
			text.classList.remove('fade');
			doubt.querySelector('input').checked = false;
			toggle.querySelector('input').checked = true;
			setEyeLatIcon(eyelatIcon, side, 'active');
			break;
			
			case 'confirmed':
			uiApp.hide(doubtInput);
			uiApp.reshow(text);
			break;
			
			case 'doubt':
			uiApp.reshow(doubtInput);
			uiApp.hide(text);
			break;
			
			case 'inactive':
			uiApp.reshow(text);
			uiApp.reshow(toggle);
			uiApp.reshow(remove);
			uiApp.hide(btn);
			uiApp.hide(doubt);
			uiApp.hide(doubtInput);
			uiApp.reshow(date);
			text.textContent = 'Inactive from';
			text.classList.add('fade');
			setEyeLatIcon(eyelatIcon, side, 'inactive');
			break;
			
			case 'removed':
			uiApp.hide(toggle);
			uiApp.hide(remove);
			uiApp.reshow(btn);
			uiApp.hide(date);
			text.textContent = 'Not present';
			setEyeLatIcon(eyelatIcon, side, 'none');
			break; 
		}
	};
	
	const setEyeLatIcon = (i, side, state) => {
		/*
		oe-i laterality L small pad
		oe-i laterality NA small pad	
		*/
		if(i === null) return;
		
		let css = ['oe-i'];
		let eye = side == 'left' ? 'L' : 'R';
		
		switch(state){
			case 'active':
			css.push('laterality', eye);
			break;
			case 'inactive':
			css.push('laterality', eye+'i');
			break;
			case 'none':
			css.push('laterality', 'NA');
			break;
		}
		
		css.push('small', 'pad');
		
		i.className = css.join(' ');
	};
	
	
	// store the default <td> 
	let tdDefault = null;
	
	let td1 = '<span class="oe-eye-lat-icons"><i class="oe-i laterality NA small pad"></i></span>';
	let td2 = '<div class="flex-layout cols-11 js-idg-diagnosis-active-switcher" data-idgdemo="-r-nSysEx2" data-idgside="right"><div class="js-idg-diagnosis-actions"><label class="toggle-switch" style="display: none;"><input type="checkbox"><div class="toggle-btn"></div></label><label class="inline highlight js-idg-diagnosis-doubt" style="display: none;"><input value="diagnosis-doubt" name="idg-4131" type="checkbox"> <i class="oe-i doubt small-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="? = doubts; suspected, etc"></i></label><i class="oe-i remove-circle small-icon pad-left" style="display: none;"></i><button class="js-idg-diagnosis-add-btn ">Add right side</button></div><div class="js-idg-diagnosis-state"><input class="js-idg-diagnosis-doubt-input" value="Suspected" placeholder="Suspected" maxlength="32" style="display: none;"><span class="js-idg-diagnosis-text js-active-state fade ">Not present</span></div></div>';
	let td3 = '<div class="js-idg-diagnosis-date"><input type="text" class="date" value="30 Apr 2020"></div>';
	//td3.className = 'valign-top';
	
	
	const updateSystemic = (tr, num) => {
		
		let sidesCheck = tr.querySelector('.js-idg-sides');
		let text = tr.querySelector('.js-idg-diagnosis-text');
		
		let div = tr.querySelector('.js-idg-diagnosis-active-switcher');
		let toggle = div.querySelector('.toggle-switch');
		let doubt = div.querySelector('.js-idg-diagnosis-doubt');
		let doubtInput = div.querySelector('.js-idg-diagnosis-doubt-input');
		
		let systemicIcons = tr.querySelector('.js-idg-right-icon .oe-systemic-icons');


		if(tdDefault == null){
			tdDefault = tr.querySelector('.js-idg-diagnosis-state-options').innerHTML;
			uiApp.reshow(text);
		}

		
		switch(num){
			case '0':
				uiApp.reshow(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Active (confirmed)';
				text.classList.remove('fade');
				uiApp.reshow(toggle);
				toggle.querySelector('input').checked = true;
				uiApp.reshow(doubt);
				doubt.querySelector('input').checked = false;
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i person-green small pad";
				
				
			break;
			
			case '1':
				uiApp.hide(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Not present';
				text.classList.add('fade');
				uiApp.hide(toggle);
				uiApp.reshow(doubt);
				doubt.querySelector('input').checked = false;
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i NA small pad";
			break;
			
			case '2':
				uiApp.hide(sidesCheck);
				uiApp.reshow(text);
				text.textContent = 'Not checked';
				text.classList.add('fade');
				uiApp.hide(toggle);
				uiApp.hide(doubt);
				uiApp.hide(doubtInput);
				systemicIcons.querySelector('.oe-i').className = "oe-i NA small pad";
			break;
		}
	};
	
	const systemicSidesChange = (tr, val) => {
		let td = tr.querySelector('.js-idg-diagnosis-state-options');
		let systemicIcons = tr.querySelector('.js-idg-right-icon .oe-systemic-icons');
		let eyeLatIcons = tr.querySelector('.js-idg-right-icon .oe-eye-lat-icons .oe-i');
	
		
		if(val){
			// show sides
			td.innerHTML = td1;
			td.colSpan = 0;
			let newCell1 = tr.insertCell(2);
			let newCell2 = tr.insertCell(3);
			newCell1.innerHTML = td2;
			newCell2.innerHTML = td3;	
			
			uiApp.hide(tr.cells[5].querySelector('.toggle-switch'));
			uiApp.hide(tr.cells[5].querySelector('.highlight'));
		
			if(tr.cells[5].querySelector('.js-idg-diagnosis-actions .js-idg-diagnosis-add-btn') === null){
				let btn = document.createElement('button');
				btn.className = "js-idg-diagnosis-add-btn";
				btn.textContent = "Add left side";
				tr.cells[5].querySelector('.js-idg-diagnosis-actions').appendChild(btn);
			} else {
				uiApp.reshow(tr.cells[5].querySelector('.js-idg-diagnosis-add-btn'));
			}
			
			let text = tr.cells[5].querySelector('.js-idg-diagnosis-text');
			text.textContent = 'Inactive from';
			text.classList.add('fade');
			
			systemicIcons.style.display = "none";
			eyeLatIcons.style.display = "inline-block";
			
		} else {
			// no sides
			tr.deleteCell(2);
			tr.deleteCell(2); // was 3, now 2!
			td.innerHTML = tdDefault;
			td.colSpan = 3;
			
			uiApp.hide(tr.cells[3].querySelector('.js-idg-diagnosis-add-btn'));
			uiApp.reshow(tr.cells[3].querySelector('.toggle-switch'));
			tr.cells[3].querySelector('.toggle-switch').checked = true;
			uiApp.reshow(tr.cells[3].querySelector('.highlight'));
			
			td.querySelector('input').checked = true;
			
			systemicIcons.style.display = "inline-block";
			eyeLatIcons.style.display = "none";
		}		
	};

	const showAuditHistory = (id) => {
		let tableRows = document.querySelectorAll('.js-idg-diagnosis-history-' + id);
		tableRows.forEach((row) => {
			// toggle the audit rows
			if(row.style.visibility == "collapse"){
				row.style.visibility = "visible";
			} else {
				row.style.visibility = "collapse";
			}
		});
	};
	

	// Active Switcher
	document.addEventListener('input',(ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-diagnosis-active-switcher .toggle-switch input')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, (me.checked ? 'active' : 'inactive'));		
		}
		
		if(me.matches('.js-idg-diagnosis-doubt input')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, (me.checked ? 'doubt' : 'confirmed'));
		}
		
		// demo the Present, Not Present and Not checked raido
		if(me.matches('.js-idg-demo-sys-diag-side-switcher .js-idg-diagnosis-state-options input')){
			let parent = uiApp.getParent(me, '.js-idg-demo-sys-diag-side-switcher');
			updateSystemic(parent, me.value);
		}
		
	});
	
	document.addEventListener('click', (ev) => {
		let me = ev.target;
		if(me.matches('.js-idg-demo-sys-diag-side-switcher .js-idg-sides')){
			let parent = uiApp.getParent(me, '.js-idg-demo-sys-diag-side-switcher');
			let icon = me.querySelector('.oe-i');
			if(me.dataset.state == "no-sides"){
				systemicSidesChange(parent, true);
				me.dataset.state = "sides";
				icon.classList.replace("person", "person-split");
			} else {
				systemicSidesChange(parent, false);
				me.dataset.state = "no-sides";
				icon.classList.replace("person-split", "person");
			}
		}
	});
	
	document.addEventListener('mousedown',(ev) => {
		let me = ev.target;
		
		// show
		if(me.matches('.js-show-diagnosis-history')){
			showAuditHistory(me.dataset.idgdemo);
		}
		
		if(me.matches('.js-idg-diagnosis-active-switcher .remove-circle')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, 'removed');
		}
		
		if(me.matches('.js-idg-diagnosis-add-btn')){
			let parent = uiApp.getParent(me, '.js-idg-diagnosis-active-switcher');
			updateActiveState(parent, 'active');
		}

	});
	
	const showDeletePopup = (ev) => {
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/specific/exam-oph-diag-delete.php')
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

	uiApp.userDown('.js-idg-demo-remove-oph-diag', showDeletePopup);
	
	
			
})(bluejay); 