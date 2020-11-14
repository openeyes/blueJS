(function (uiApp) {

	'use strict';
	
	uiApp.addModule('whiteboard');
	
	if(document.querySelector('main.oe-whiteboard') === null) return;
	
	/*
	In Whiteboard mode hide these DOM Elements
	*/
	uiApp.hide(document.querySelector('#oe-admin-notifcation'));
	
	/*
	Set up Whiteboard 
	2 states: Standard & Biometry report
	Handling both... 
	*/
	
	// Actions panel (bottom) is standard for both:
	const actionsPanel = document.querySelector('.wb3-actions');
	const actionsBtn = document.querySelector('#js-wb3-openclose-actions');
	
	const openClosePanel = (ev) => {
		if(actionsBtn.classList.contains('up')){
			actionsBtn.classList.replace('up','close');
			actionsPanel.classList.replace('down','up'); // CSS animation
		} else {
			actionsBtn.classList.replace('close','up');
			actionsPanel.classList.replace('up','down'); // CSS animation
		}
	};
	
	uiApp.userDown('#js-wb3-openclose-actions', openClosePanel);
	
	// provide a way to click around the whiteboard demos:		
	uiApp.userDown('.wb-idg-demo-btn',(ev) => {
		window.location = '/v3-whiteboard/' + ev.target.dataset.url;
	});
	
	/*
	Standard
	Demo the editible text concept
	*/
	uiApp.userDown('.edit-widget-btn .oe-i', (ev) => {
		// check the state.
		let oei = ev.target;
		let widget = uiApp.getParent(oei, '.oe-wb-widget');
		let view = widget.querySelector('.wb-data ul');
		let edit = widget.querySelector('.wb-data .edit-widget');
		
		if(oei.classList.contains('pencil')){
			oei.classList.replace('pencil','tick');
			uiApp.hide(view);
			uiApp.show(edit, 'block');
		} else {
			oei.classList.replace('tick','pencil');
			uiApp.hide(edit);
			uiApp.show(view, 'block');
		}
	});

	/*
	Overflow popup?
	--- MOVED, into a seperate script in newblue! 
	*/
/*
	const overflowPopup = ( ev ) => {
		const json = JSON.parse( ev.target.dataset.overflow );
		let div = document.createElement('div');
		div.className = "oe-popup-wrap clear";
		div.innerHTML = `<div class="wb-data-overflow-popup">${json.data}</div>`;
		document.body.appendChild( div );	
	};
	
	uiApp.userDown('.overflow-icon-btn', overflowPopup );
	uiApp.userDown('.wb-data-overflow-popup', ( ev ) => {
		let wrap = uiApp.getParent( ev.target, '.oe-popup-wrap' );
		uiApp.remove( wrap );
	});
*/

	/*
	Biometry Report?
	*/
	if(document.querySelector('.multipage-nav') === null) return;
	
	let stack = document.querySelector('.multipage-stack');
	let pages = uiApp.nodeArray(stack.querySelectorAll('img'));
	
	/*
	Get first IMG height Attribute to work out page scrolling.
	note: CSS adds 20px padding to the (bottom) of all images
	*/
	let pageH = pages[0].height + 20;
	uiApp.listenForResize(() => pageH = pages[0].height + 20 );

	// scrollJump 
	let scrollPos = 0;
	const scrollJump = (px) => {
		scrollPos = scrollPos + px;
		if(scrollPos < 0) scrollPos = 0;
		if(scrollPos > (pages.length * pageH)) scrollPos = pages.length * pageH;
		stack.scrollTop = scrollPos; // uses CSS scroll behaviour
	};

	uiApp.userDown('#js-scroll-btn-down', () => scrollJump(200) );
	uiApp.userDown('#js-scroll-btn-up', () => scrollJump(-200) );
	
	let pageJump = document.querySelector('.page-jump');
	
	pages.forEach((page, i) => {
		let div = document.createElement('div');
		div.className = "page-num-btn";
		div.setAttribute('data-page', i);
		div.textContent = i + 1;
		pageJump.appendChild(div);
	});
	
	uiApp.userDown('.page-num-btn', (e) => {
		scrollPos = 0;
		let pageScroll = parseInt(e.target.dataset.page * pageH);
		scrollJump(pageScroll);
	});
	
	
	
	
	
		
})(bluejay); 


