(function( bj ) {

	'use strict';	
	
	bj.addModule('navSlidePanel');
	
	/**
	Behaviour for the Logo Panel and the Menu Panel
	is identical, however the Menu isn't included on 
	the Login page
	*/

	const css = {
		btnActive: 'active',
		panelShow: 'show'
	};

	/*
	Methods	
	*/
	const _change = () => ({
		/**
		* Callback for 'down'
		*/
		change: function(){
			if(this.open)	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Callback for 'enter'
		*/
		show:function(){
			if(this.open) return;
			this.open = true;
			this.btn.classList.add( css.btnActive );
			
			// panel needs a bit of work
			//clearTimeout( this.hideTimerID ); 
			this.panel.classList.add( css.panelShow );
			this.panel.style.pointerEvents = "auto";
		}	
	});
	
	const _hide = () => ({
		/**
		* Callback for 'leave'
		*/
		hide:function(){
			if(this.open === false) return;
			this.open = false;
			this.btn.classList.remove( css.btnActive );
			this.panel.classList.remove( css.panelShow );
			this.panel.style.pointerEvents = "none";
			
		}
	});
	
	/**
	* navSlidePanel.
	* Pattern is the same for Logo and Menu
	* @param {Object} me - setup object
	* @returns navSlidePanel instance
	*/
	const navSlidePanel = ( me ) => {
		return Object.assign( me, _change(), _show(), _hide() );
	};
	
	/**
	Init - Logo
	*/
	const logoBtn = '#js-openers-btn';
	
	const logo = navSlidePanel({
		btn: document.querySelector( logoBtn ),
		panel: document.querySelector('.oe-portal-info'),
		open: false,
	});
	
	// A little Bling: on Login page pop in the panel
	if( document.querySelector('.oe-login') !== null && window.innerWidth > 800 ){
		setTimeout( () => logo.show(), 1000 );	
	}
	
	// Events
	bj.userDown( logoBtn, () => logo.change());			
	bj.userEnter( logoBtn, () => logo.show());
	bj.userLeave('.brand', () => logo.hide());
	
	
	/**
	Init - Menu
	*/
	const menuBtn = '#js-menu-btn';
	
	if( document.querySelector( menuBtn ) === null ) return; // login page
	
	const menu = navSlidePanel({
		btn: document.querySelector( menuBtn ),
		panel: document.querySelector('.menu-info'),
		open: false,
	});
	
	// Events
	bj.userDown( menuBtn, () => menu.change());			
	bj.userEnter( menuBtn, () => menu.show());
	bj.userLeave('.portal-menu', () => menu.hide());
	

})( bluejay ); 