(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('lightningFilterOptions');
	
	const cssActive = 'active';
	const selector = '.lightning-btn';
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
	
	
	
	/**
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const lightningFilter = (() => {
		return Object.assign({	
			btn:btn,
			content: document.querySelector('.change-timeline'),
			open: false 
		},
		_change(),
		_show(),
		_hide() );
	})();
	

	/*
	Events 
	*/
	uiApp.registerForClick(selector, () => lightningFilter.change());
	
})(bluejay); 