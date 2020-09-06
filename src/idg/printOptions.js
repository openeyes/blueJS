(function( bj ){

	'use strict';	
	
	bj.addModule('printOptions');
	
	const cssActive = 'active';
	const selector = '#js-header-print-dropdown-btn';
	const wrapper = '#js-header-print-dropdown';
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
	const printOptions = (() => {
		return Object.assign({
			btn:btn,
			content: document.getElementById('js-header-print-subnav'),
			open: false 
		},
		_change(),
		_show(),
		_hide());
	})();
	
	/*
	Events 
	*/
	bj.userDown( selector, () => printOptions.change());			
	bj.userEnter( selector, () => printOptions.show());
	bj.userLeave( wrapper, () => printOptions.hide());
	

})( bluejay ); 