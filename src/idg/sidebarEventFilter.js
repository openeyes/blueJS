(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sidebarEventFilter');
	
	const cssActive = 'active';
	const selector = '#js-sidebar-filter-btn';
	const btn = document.querySelector(selector);
	if(btn === null) return;

	/*
	Methods	
	*/
	
	const _change = () => ({
		/**
		* Callback for 'click'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Callback for 'hover'
		* Enhanced behaviour for mouse/trackpad
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( cssActive );
			uiApp.show(this.content);
			this.mouseOutHide();
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if(this.open === false) return;
			this.open = false;
			this.btn.classList.remove( cssActive );
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
			},{once:true});
		}
	});
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const eventFilter = (() => {
		return Object.assign(	{	btn:btn,
									content: document.querySelector('#js-sidebar-filter-options'),
									wrapper: document.querySelector('#js-sidebar-filter'),
									open: false 
								},
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => eventFilter.change() );			
	uiApp.registerForHover(selector, () => eventFilter.show() );

	
})(bluejay); 