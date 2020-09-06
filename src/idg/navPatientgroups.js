(function( bj ) {

	'use strict';	
	
	bj.addModule('navPatientGroups');
	
	const cssActive = 'active';
	const selector = '#js-nav-patientgroups-btn';
	const wrapper = '#js-patientgroups-panel-wrapper';
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
		* Show content
		*/
		show:function(){
			if( this.open ) return;
			this.open = true;
			this.btn.classList.add( cssActive );
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
			this.btn.classList.remove( cssActive );
			bj.hide( this.content );
		}
	});
	
	/**
	* IIFE
	* builds required methods 
	* @returns {Object} 
	*/
	const patientGroups = (() => {
		
		return Object.assign({	
			btn: btn,
			content: document.getElementById('js-patientgroups-panel'),
			open: false 
		},
		_change(),
		_show(),
		_hide());
		
	})();

	/*
	Events 
	*/
	bj.userDown( selector, () => patientGroups.change());			
	bj.userEnter( selector, () => patientGroups.show());
	bj.userLeave( wrapper, () => patientGroups.hide());
	

})( bluejay ); 