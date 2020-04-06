(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navHotlist');
			
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-nav-hotlist-btn';
	const btn = document.querySelector(selector);
	
	if(btn === null) return;
	
	/*
	Methods	
	*/
	
	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			if(this.isFixed) return;
			this.btn.classList.add( cssActive );
			this.show();
		}	
	});
	
	const _changeState = () => ({
		/**
		* Callback for 'click'
		* Hotlist can be quickly viewed or 'locked' open
		*/
		changeState:function(){
			if(this.isFixed) return;
			if(!this.open){
				this.makeLocked();
				this.over();
			} else {
				if(this.isLocked){
					this.isLocked = false;
					this.hide();
				} else {
					this.makeLocked();
				}
			}
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			uiApp.show(this.content);
			this.mouseOutHide();
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false || this.isLocked || this.isFixed ) return;
			this.open = false;
			this.btn.classList.remove( cssActive, cssOpen );
			uiApp.hide(this.content);
		}
	});
	
	const _mouseOutHide = () => ({
		/**
		* Enhanced behaviour for mouse/trackpad
		*/
		mouseOutHide: function(){
			this.wrapper.addEventListener('mouseleave',(ev) => {
				ev.stopPropagation();
				this.hide();
			}, {once:true});
		}
	});
	
	const _makeLocked = () => ({
		/**
		* 'locked' open if user clicks after opening with 'hover'
		*/
		makeLocked: function(){
			this.isLocked = true; 
			this.btn.classList.add( cssOpen );
		}
	});
	
	const _fixedOpen= () => ({
		/**
		* Automatically 'fixed' open if there is space and it's allowed
		* @param {boolean}
		*/
		fixedOpen: function(b){
			this.isFixed = b; 
			if(b){
				this.isLocked = false;
				this.btn.classList.add( cssOpen );
				this.btn.classList.remove( cssActive );
				this.show();
			} else {
				this.hide();
			}
		}
	});
	
	/**
	* hotlist singleton 
	* (using IIFE to maintain code pattern)
	*/
	const hotlist = (() => {
		return Object.assign( 	{	btn:btn,
									content: document.querySelector('#js-hotlist-panel'),
									wrapper: document.querySelector('#js-hotlist-panel-wrapper'),
									open: false,
									isLocked: false,
									isFixed: false,
								},
								_changeState(),
								_over(),
								_mouseOutHide(),
								_makeLocked(),
								_show(),
								_hide(),
								_fixedOpen() );
	})();
	
	/*
	Hotlist can be Locked open if: 
	1) The browser is wide enough
	2) The content area allows it (DOM will flag this via data-fixable attribute)
	*/
	const checkBrowserWidth = () => {
		// note: Boolean is actually a string! 
		if(btn.dataset.fixable === "true"){
			hotlist.fixedOpen((window.innerWidth > uiApp.settings.cssExtendBrowserSize));
		}
	};
	
	/*
	Events
	*/
	uiApp.registerForClick(selector, () => hotlist.changeState() );			
	uiApp.registerForHover(selector, () => hotlist.over() );
	uiApp.listenForResize(checkBrowserWidth);
	checkBrowserWidth();

})(bluejay); 