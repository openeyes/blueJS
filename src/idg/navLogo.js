(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('navLogo');
	
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-openeyes-btn';
	
	/*
	on Login flag the logo
	*/
	if(document.querySelector('.oe-login') !== null){
		document.querySelector(selector).classList.add(cssActive);	
	}
	
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

	const _over = () => ({
		/**
		* Callback for 'hover'
		*/
		over: function(){
			this.btn.classList.add( cssActive );
		}	
	});
	
	const _out = () => ({
		/**
		* Callback for 'exit'
		*/
		out: function(){
			this.btn.classList.remove( cssActive );
		}	
	});

	const _show = () => ({
		/**
		* Show content
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( cssOpen );
			uiApp.show(this.content, 'block');
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
			this.btn.classList.remove( cssOpen, cssActive );
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
	* oelogo singleton 
	* (using IIFE to maintain code pattern)
	*/
	const oelogo = (() => {
		let btn = document.querySelector(selector);
		return Object.assign( 	{	btn: btn,
									content: document.querySelector('#js-openeyes-info'),
									wrapper: uiApp.getParent(btn, '.openeyes-brand'),
									open: false
								},
								_over(),
								_out(),
								_change(),
								_show(),
								_hide(),
								_mouseOutHide() );
	})();
	
	/*
	Events
	*/
	uiApp.userDown(selector, () => oelogo.change());			
	uiApp.userEnter(selector, () => oelogo.over());
	uiApp.userLeave(selector, () => oelogo.out());
	

})(bluejay); 