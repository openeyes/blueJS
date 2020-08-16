(function( bj ) {

	'use strict';	
	
	bj.addModule('navLogo');
	
	const selector = '#js-openeyes-btn';
	
	const css = {
		btnActive: 'active',
		panelShow: 'show'
	};

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
			console.log( 'show' );
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( css.btnActive );
			
			// panel needs a bit of work
			//clearTimeout( this.hideTimerID ); 
			this.panel.classList.add( css.panelShow );
			this.panel.style.pointerEvents = "auto";
			
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
			this.btn.classList.remove( css.btnActive );

			this.panel.classList.remove( css.panelShow );
			this.panel.style.pointerEvents = "none";
			
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
		/**
		* Big hit area for Logo Portal 
		*/
		const btn = document.querySelector( selector );
		const panel = document.querySelector('.oe-portal-info');
		panel.style.pointerEvents = "none";

		return Object.assign({
			hideTimerID: null, 	
			btn,
			panel,
			wrapper: bj.getParent( btn, '.openeyes-brand'),
			open: false,
		},
		_change(),
		_show(),
		_hide(),
		_mouseOutHide() );
	})();
	
	/*
	on Login pop in the panel
	*/
	if(document.querySelector('.oe-login') !== null){
		setTimeout( () => oelogo.show(), 1000 );	
	}
	
	/*
	Events
	*/
	bj.userDown(selector, () => oelogo.change());			
	bj.userEnter(selector, () => oelogo.show());
	

})( bluejay ); 