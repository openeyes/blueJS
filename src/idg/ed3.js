(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('ed3');	
	
	/*
	Side Nav Select List filtering
	Used in Worklist, Messages, Trials, etc
	Anywhere you have a bunch of "lists" that need filtering. 
	*/
	
	let ed3app = false;
	
	const buildDOM = () => {
		let div = document.createElement('div');
		div.className = "oe-eyedraw-app spinner-loader";
		uiApp.appendTo('body', div);
		return div;
	};
	
	const userClick = (ev) => {
		let btn = ev.target;
		ed3app = ed3app || buildDOM();
		/*
		CSS handles the x (left) positioning but we to position the 
		popup near the button, rather than centered.	
		*/
		let btnY = btn.getBoundingClientRect().bottom;
		/*
		ed3 app height fixed at 532px;
		it can not go above 60px (OE Header)
		*/
		let top = btnY - 532;
		ed3app.style.top = top < 60 ? '60px' : top + "px";
		ed3app.style.display = "block";
		
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/ed3/' + btn.dataset.php)
			.then( html => {
				ed3app.innerHTML = html;
				ed3app.querySelector('.close-icon-btn').addEventListener('mousedown', () => {
					ed3app.style.display = "none";
				},{once:true});
			})
			.catch(e => console.log('ed3app php failed to load', e));  // maybe output this to UI at somepoint, but for now...			
	};
	

	uiApp.registerForClick('.js-idg-ed3-app-btn', userClick);

})(bluejay); 