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
		document.body.appendChild( div );
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
		uiApp.show(ed3app, 'block');
		
		// get demo JSON data
		let json = JSON.parse(btn.dataset.idgDemo);
		// then pass it back into PHP...
		var queryString = Object.keys(json).map(key => key + '=' + json[key]).join('&');
		
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/ed3/ed3-app.php?' + queryString)
			.then( html => {
				ed3app.innerHTML = html;
				ed3app.querySelector('.close-icon-btn').addEventListener('mousedown', () => {
					ed3app.style.display = "none";
				},{once:true});
			})
			.catch(e => console.log('ed3app php failed to load', e));  // maybe output this to UI at somepoint, but for now...			
	};

	uiApp.userDown('.js-idg-ed3-app-btn', userClick);

})(bluejay); 