(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navHotlist');
			
	const cssActive = 'active';
	const cssOpen = 'open';
	
	/*
	Methods	
	*/
	const _over = () => ({
		over: function(){
			if(this.isFixed) return;
			this.btn.classList.add( cssActive );
			this.show();
		}	
	});
	
	const _changeState = () => ({
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
	
	const _makeLocked = () => ({
		makeLocked: function(){
			this.isLocked = true; 
			this.btn.classList.add( cssOpen );
		}
	});
	
	const _fixedOpen= () => ({
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

	
	const _show = () => ({
		show:function(){
			if(this.open) return;
			this.open = true;
			
			this.content.style.display = "block";
			this.mouseOutWrapper();
		}	
	});
	
	const _hide = () => ({
		hide:function(){
			if(this.open === false || this.isLocked || this.isFixed ) return;
			this.open = false;
			
			this.btn.classList.remove( cssActive, cssOpen );
			this.content.style.display = "none";
		}
	});
	
	const _mouseOutWrapper = () => ({
		mouseOutWrapper: function(){
			this.wrapper.addEventListener('mouseleave',(ev) => {
				ev.stopPropagation();
				this.hide();
			},{once:true});
		}
	});
	

	const hotlist = (() => {
		const me = {
			btn: document.querySelector('#js-nav-hotlist-btn'),
			content: document.querySelector('#js-hotlist-panel'),
			wrapper: document.querySelector('#js-hotlist-panel-wrapper'),
			open: false,
			isLocked: false,
			isFixed: false,
		};
		
		return Object.assign( 	me,
								_changeState(),
								_over(),
								_mouseOutWrapper(),
								_makeLocked(),
								_show(),
								_hide(),
								_fixedOpen() );
	})();
	
	uiApp.registerForClick('#js-nav-hotlist-btn', () => hotlist.changeState() );			
	uiApp.registerForHover('#js-nav-hotlist-btn', () => hotlist.over() );
	
	
	/*
	Hotlist can be Locked open if: 
	1) The browser is wide enough
	2) The content area allows it
	*/
	const checkBrowserWidth = () => {
		let btn = document.querySelector('#js-nav-hotlist-btn');
		if(btn.dataset.fixable){
			if(window.innerWidth > uiApp.settings.cssExtendBrowserSize){
				hotlist.fixedOpen(true);
			} else {
				hotlist.fixedOpen(false);
			}
		}
	};
	
	uiApp.listenForResize(checkBrowserWidth);
	


})(bluejay); 