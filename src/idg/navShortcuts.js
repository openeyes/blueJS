(function( bj ){

	'use strict';	
	
	bj.addModule('navShortcuts');
	
	const cssActive = 'active';
	const selector = '#js-nav-shortcuts-btn';
	const wrapper = '#js-nav-shortcuts';
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
			bj.show(this.content, 'block');
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
			bj.hide(this.content);
		}
	});
	

	/**
	* IIFE
	* builds required methods 
	* @returns {Object} 
	*/
	const shortcuts = (() => {
		
		return Object.assign({
			btn:btn,
			content: document.getElementById('js-nav-shortcuts-subnav'),
			open: false 
		},
		_change(),
		_show(),
		_hide());
		
	})();
	
	/*
	Events 
	*/
	bj.userDown(selector, () => shortcuts.change());			
	bj.userEnter(selector, () => shortcuts.show());
	bj.userLeave( wrapper, () => shortcuts.hide());
	

})( bluejay ); 