(function( bj ) {

	'use strict';	
	
	bj.addModule('sidebarEventFilter');
	
	const cssActive = 'active';
	const selector = '#js-sidebar-filter-btn';
	const wrapper = '#js-sidebar-filter';
	
	const btn = document.querySelector( selector );
	
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
	* shortcuts singleton 
	* (using IIFE to maintain code pattern)
	*/
	const eventFilter = (() => {
		return Object.assign({	
			btn:btn,
			content: document.getElementById('js-sidebar-filter-options'),
			open: false 
		},
		_change(),
		_show(),
		_hide());
	})();
	
	/*
	Events 
	*/
	bj.userDown( selector, () => eventFilter.change());			
	bj.userEnter( selector, () => eventFilter.show());
	bj.userLeave( wrapper, () => eventFilter.hide());

	
})(bluejay); 