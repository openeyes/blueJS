/**
* Element Selector 2.0
*/
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('elementSelector');
	
	/*
	Copying the OverlayPop approach for this
	*/
	
	const elements = (selector,css,php) => {
		
		const btn = document.querySelector(selector);
		if(btn == null) return;
	
		const showElements = () => {
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/sidebar/'+php)
				.then( html => {
					const nav = document.createElement('nav');
					nav.className = css;
					nav.innerHTML = html;
					btn.classList.add('selected');
					btn.addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.removeElement(nav);
						btn.classList.remove('selected');
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',nav);
				})
				.catch(e => console.log('elementSelector failed to load',e));  // maybe output this to UI at somepoint, but for now... 
		};	
		
		// register Events
		uiApp.registerForClick(selector,showElements);	
	};
	
	// Two Elements Btns
	elements('#js-manage-elements-btn','oe-element-selector','element-selector.php');
	elements('#js-element-structure-btn','sidebar element-overlay','examination-elements.php'); // old skool sidebar nav!
	
})(bluejay); 