/*
Lightning (Document Viewer page)
Updated to Vanilla JS for IDG
*/

(function (uiApp) {

	'use strict';	
	
	const lightning = uiApp.addModule('lightning');	
	
	if(document.querySelector('.oe-lightning-viewer') === null) return;
	
	/*
	Methods	
	*/
	const _updateView = () => ({
		updateView: function(id){
			this.updateStack(id);
			this.updateMeta(document.querySelector(this.iconPrefix + id).dataset.meta);
		}
	});
	
	const _updateMeta = () => ({
		updateMeta: function(meta){
			let div = document.querySelector('.lightning-meta');
			let info = meta.split(',');
			['.type','.date','.who'].forEach((item, index) => {
				div.querySelector(item).textContent = info[index];
			});
		}
	});
	
	const _updateStack = () => ({
		updateStack: function(stackID){
			uiApp.hide(document.querySelector(this.stackPrefix + this.currentStack));
			uiApp.show(document.querySelector(this.stackPrefix + stackID));
			this.currentStack = stackID; // track id
			this.updateCounter();
			this.timelineIcon();
		}
	});
	
	
	const _updateCounter = () => ({
		updateCounter: function(){
			document.querySelector('.lightning-ui .stack-position').textContent = this.currentStack+1 + '/' + this.totalStackNum;
		}
	});

	const _timelineIcon = () => ({
		timelineIcon: function(){
			document.querySelector('.icon-event').classList.remove('js-hover');
			document.querySelector(this.iconPrefix + this.currentStack).classList.add('js-hover');	
		}
	});
	
	/*
	xscroll using DOM overlay (rather than the image)
	(note: the overlay has 2 possible widths depending on browser size)
	*/
	const _xscroll = () => ({
		xscroll: function(xCoord,e){
			var xpos = Math.floor(xCoord/(this.xscrollWidth / this.totalStackNum));
			if(this.locked == false){
				this.updateView( xpos );
			} 
		}
	});
	
	const _swipeLock = () => ({
		swipeLock: function(){
			this.locked = !this.locked;
			let help = document.querySelector('.lightning-ui .user-help');
			if(this.locked){
				help.textContent = 'Swipe is LOCKED | Click to unlock';
			} else {
				help.textContent = 'Swipe to scan or use key RIGHT / LEFT | Click to LOCK swipe';
			}
		}
	});

	const _stepThrough = () => ({
		stepThrough: function(dir){
			var next = this.currentStack + dir;
			if( next >= 0 && next < this.totalStackNum){
				this.updateView(next);
			}
		}
	});
	
	
	

	/**
	* singleton 
	* (using IIFE to maintain code pattern)
	*/
	const app = (() => {
		return Object.assign({	
			currentStack: 0,
			iconPrefix: '#lqv_',
			stackPrefix: '#lsg_',
			totalStackNum: document.querySelectorAll('.stack-group').length,
			xscrollWidth: document.querySelector('.lightning-view').clientWidth,
			locked: true
		},
		_updateView(),
		_updateMeta(), 
		_updateStack(),
		_updateCounter(),
		_timelineIcon(),
		_xscroll(),
		_swipeLock(),
		_stepThrough());
	})();
	
	
	/*
	setup viewer	
	*/
	app.updateCounter();
	app.swipeLock();
	
	/*
	Events	
	*/
	uiApp.registerForClick('#lightning-left-btn', () => app.stepThrough(-1));
	uiApp.registerForClick('#lightning-right-btn', () => app.stepThrough(1));
	uiApp.registerForClick('.lightning-view', () => app.swipeLock());
	uiApp.registerForClick('.icon-event', () => app.swipeLock());
	
	uiApp.registerForHover('.icon-event', (ev) => {
		let icon = ev.target;
		app.updateStack( icon.dataset.id );
		app.updateMeta( icon.dataset.meta );
	});
	
	const view = document.querySelector('.lightning-view');
	view.addEventListener('mousemove', (ev) => {
		//app.xscroll(e.pageX - offset.left,e);
	});
	
	uiApp.listenForResize(() => app.xscrollWidth = view.clientWidth);

	document.addEventListener('keydown', (ev) => {
		if ((ev.keyCode || ev.which) == 37) app.stepThrough(-1);
		if ((ev.keyCode || ev.which) == 39) app.stepThrough(1);
	});
		
		
})(bluejay); 
