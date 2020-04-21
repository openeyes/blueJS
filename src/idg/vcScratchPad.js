(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('vcScratchPad');	
	
	const scratchPad = document.querySelector('#oe-vc-scratchpad');
	if(scratchPad === null) return;
	
	let offsetX, offsetY;
	let show = false;

	const handleStart = (e) => {
		e.dataTransfer.dropEffect = "move";
		let rect = e.target.getBoundingClientRect();
		offsetX = e.clientX - rect.left;
		offsetY = e.clientY - rect.top;
	};
	
	const handleEnd = (e) => {
		let top = Math.round(e.clientY - offsetY);
		let left = Math.round(e.clientX - offsetX);
		// stop it being dragged off screen
		top = top < 1 ? 1 : top;
		left = left < 1 ? 1 : left;
		scratchPad.style.top = top + "px";
		scratchPad.style.left = left + "px";
	};

	scratchPad.addEventListener("dragstart", handleStart, false);
	scratchPad.addEventListener("dragend", handleEnd, false);

	/*
	Demo the the scratchPad behaviour 
	*/
	const change = (ev) => {
		let btn = ev.target;
		if(show){
			uiApp.hide(scratchPad);
			btn.textContent = 'ScratchPad';
		} else {
			uiApp.show(scratchPad);
			btn.textContent = 'Hide ScratchPad';
		}
		show = !show;		
	};
	
	uiApp.registerForClick('#js-vc-scratchpad', change );


})(bluejay); 