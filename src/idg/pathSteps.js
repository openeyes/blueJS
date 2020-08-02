(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('pathSteps');	
	
	const selector = '.oe-pathstep-btn';
	if(document.querySelector(selector) === null) return;
	
	let activePathBtn = false;
	
	/**
	Build DOM popup template and insert in DOM.
	2 view modes: quick and full
	*/
	const div = document.createElement('div');
	div.style.display = "none";
	div.className = "oe-pathstep-popup";
	div.innerHTML = [	'<div class="close-icon-btn"><i class="oe-i remove-circle medium"></i></div>',
						'<h3 class="title"></h3>',
						'<div class="popup-overflow"><div class="data-group">',
						'<table class="data-table"><tbody>',
						'</tbody></table>',
						'</div></div>',
						'<div class="step-actions"><div class="flex-layout">',
						'<button class="red hint">Remove PSD</button><button class="green hint">Administer</button>',
						'</div></div>',
						'<div class="step-status"></div>',].join('');
	// add to DOM					
	uiApp.appendTo('body',div);
	
	/**
	Set up references to the required DOM elements
	*/
	const popup = {
		title: div.querySelector('.title'),
		closeBtn: div.querySelector('.close-icon-btn .oe-i'),
		status: div.querySelector('.step-status'),
		tbody: div.querySelector('.data-table tbody'),
		actions: div.querySelector('.step-actions'),
		detailRows: null,
		locked:false, // user clicks to lock open (or touch)
	};
	
	/**
	* EyeLat icons DOM
	* @param {String} eye - R, L or B
	* @returns {DOMString}
	*/
	const eyeLatIcons = (eye) => {
		let r,l = "NA";
		if(eye == "R" || eye == "B") r = "R";
		if(eye == "L" || eye == "B") l = "L";
		return `<span class="oe-eye-lat-icons"><i class="oe-i laterality ${r} small"></i><i class="oe-i laterality ${l} small"></i></span>`;
	};
	
	/**
	* OE icon DOM
	* @param {String} i - icon type
	* @returns {DOMString}
	*/
	const icon = i => `<i class="oe-i ${i} small"></i>`;
	
	/**
	* Set popup status message and colour
	* @param {String} status - "done", etc
	*/
	const setStatus = (state) => {
		const css = 'step-status';
		let msg = 'No status set';
		let color = "default";
		
		switch( state ){
			case "done":
				msg = 'PSD: Completed at 11:40';
				color = 'green';
			break;
			case "todo":
				msg = 'PSD: Waiting to start';
				color = 'default';
			break;
			case "progress":
				msg = 'PSD: In progress';
				color = 'orange';		
			break;
			case "problem":
				msg = 'Issue with PSD';
				color = 'red';
			break;
		}
		
		popup.status.textContent = msg;
		popup.status.className = [css,color].join(' ');
	};
	
	/**
	* create <td>'s for Directive <tr>
	* @param {Array} - JSON data array
	* @returns {Array} - DOMStrings to insert
	*/
	const directiveDOM = (arr) => {
		return [ eyeLatIcons(arr[0]), arr[1], arr[2] ];
	};
	
	/**
	* create <td>'s for Step <tr>
	* @param {Array} - JSON data array
	* @returns {Array} - DOMStrings to insert
	*/
	const stepDOM = (arr) => {
		// waiting only has 1... add the rest
		if(arr.length == 1) arr = arr.concat(['<em class="fade">to do</em>','']);
		return [ icon(arr[0]), arr[1], arr[2] ];
	};

	/**
	* Build TR for PSD table
	* @param {String} i - icon type
	* @param {DocFragment} fragment - append to this
	* @param {String} trClass - class to add to the <tr>
	* @returns {DOMString}
	*/
	const buildTableRow = (data, fragment, trClass=false) => {
		let tr = document.createElement('tr');
		if(trClass) tr.className = trClass;
		
		data.forEach((item) => {
			let td = document.createElement('td');
			td.innerHTML = item;
			tr.appendChild(td);	
		});
		
		fragment.appendChild(tr);
	};
	
	
	/**
	* build and insert PSD table data into popup
	* @param {Array} - JSON data
	*/
	const buildPSDTable = (psd) => {
		let fragment = document.createDocumentFragment();
		/*
		A PSD could have many 'parts'
		each part has a Directive and then Steps to administer the Directive
		*/
		psd.forEach((part) => {
			// PSD Directive 
			buildTableRow( directiveDOM(part.directive), fragment );
			
			// Directive could have 1 or n step states to complete
			// this shows what steps have been "administered"!
			part.steps.forEach(step => {
				buildTableRow( stepDOM(step), fragment, 'administer-details');
			});
		});
		
		// clear previous data and add new data
		popup.tbody.innerHTML = "";		
		popup.tbody.appendChild(fragment);
		
		// store a reference to the all the 'administered' <tr> data
		popup.detailRows = uiApp.nodeArray(div.querySelectorAll('.administer-details'));	
	};
	
	/**
	* update popup DOM
	*/
	const updatePopup = () => {
		let json = JSON.parse(activePathBtn.dataset.step);
		popup.title.textContent = json.title;
		buildPSDTable(json.psd);
		setStatus(json.status);
	};
	
	/**
	* Change popup display for Quick or Full states
	* @param {Boolean} full? 
	*/
	const fullDisplay = (full) => {
		let block = full ? 'block' : 'none';
		let tableRow = full ? 'table-row' : 'none';
		popup.title.style.display = block;
		popup.closeBtn.style.display = block;
		popup.actions.style.display = block;
		popup.detailRows.forEach( tr => tr.style.display = tableRow);
	};
	
	
	const hide = () => {
		popup.locked = false;
		div.style.display = "none";	
	};
	
	/**
	* show and position popup
	* @param {Number} top
	* @param {Number} left 
	* @param {Number} offsetY - this lines up the close btn with mouse position
	*/
	const show = (top,left,offsetY=0) => {
		let divWidth = 360;
		div.style.top = top + offsetY + "px";
		div.style.left = left - divWidth + "px";
		div.style.display = "block";
	};
	
	/**
	* Callback for 'Click'
	* @param {event} event
	*/
	const userClick = (ev) => {
		if(ev.target !== activePathBtn){
			activePathBtn = ev.target;
			updatePopup();
		}
		fullDisplay(true);
		popup.locked = true;
		// position & show
		let rect = activePathBtn.getBoundingClientRect();
		show(rect.top, rect.right, -5);
		
		// hide if user scrolls
		window.addEventListener('scroll', hide, {capture:true, once:true});
	};
	
	/**
	* Callback for 'Hover'
	* @param {event} event
	*/
	const userHover = (ev) => {
		if(popup.locked) return;
		activePathBtn = ev.target;
		updatePopup();
		fullDisplay(false);
		// position & show
		let rect = activePathBtn.getBoundingClientRect();
		show(rect.bottom, rect.right);
	};
	
	/**
	* Callback for 'Exit'
	* @param {event} event
	*/
	const userOut = (ev) => {
		if(popup.locked) return;
		hide();
	};

	/*
	Events 
	*/
	uiApp.userDown(selector,userClick);
	uiApp.userEnter(selector,userHover);
	uiApp.userLeave(selector,userOut);
	uiApp.userDown('.oe-pathstep-popup .close-icon-btn .oe-i',hide);
		
})(bluejay); 