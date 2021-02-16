(function ( bj ) {

	'use strict';	
	
	bj.addModule('navLogo');
	
	const cssActive = 'active';
	const cssOpen = 'open';
	const selector = '#js-openeyes-btn';
	const wrapper = '.openeyes-brand';
	
	/**
	Bling.
	Login Page: Flag the logo
	*/
	if(document.querySelector('.oe-login') !== null){
		document.querySelector(selector).classList.add( cssActive );	
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
			if( this.open ) return;
			this.open = true;
			this.btn.classList.add( cssOpen );
			bj.show( this.content, 'block' );
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			if( !this.open ) return;
			this.open = false;
			this.btn.classList.remove( cssOpen, cssActive );
			bj.hide( this.content );			
		}
	});
	
	/**
	* IIFE
	* builds required methods 
	* @returns {Object} 
	*/
	const oelogo = (() => {
		
		return Object.assign({	
			btn: document.querySelector( selector ),
			content: document.querySelector('#js-openeyes-info'),
			open: false
		},
		_over(),
		_out(),
		_change(),
		_show(),
		_hide());
		
	})();
	
	/*
	Events
	*/
	bj.userDown( selector, () => oelogo.change());			
	bj.userEnter( selector, () => oelogo.over());
	bj.userLeave( selector, () => oelogo.out());
	// wrapper
	bj.userLeave( wrapper, () => oelogo.hide());
	
})( bluejay) ; 