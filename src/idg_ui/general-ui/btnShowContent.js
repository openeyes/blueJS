(function( bj ){

	'use strict';	
	
	bj.addModule('GUI-btnShowContent');
	
	const cssActive = 'active';
	
	/**
	Common interaction pattern for all these Elements
	*/
	const mapElems = [
		{ // Nav, shortcuts
			btn: 'js-nav-shortcuts-btn',
			wrapper: 'js-nav-shortcuts',
			contentID: 'js-nav-shortcuts-subnav',
		}, 
		{ // Print Event options
			btn: 'js-header-print-dropdown-btn',
			wrapper: 'js-header-print-dropdown',
			contentID: 'js-header-print-subnav',
		},
		{ // Fancy new Event sidebar filter (IDG)
			btn: 'js-sidebar-filter-btn',
			wrapper: 'js-sidebar-filter',
			contentID: 'js-sidebar-filter-options',
		},
		// Sync, in header (Worklist)
		{
			btn: 'js-sync-btn',
			wrapper: 'js-sync-data',
			contentID: 'js-sync-options',
		}
	];

	
	/**
	Methods	
	*/
	const _change = () => ({
		/**
		* Callback for mousedown
		*/
		change: function(){
			if(this.open) this.hide();
			else this.show();
		}
	});
	
	const _show = () => ({
		/**
		* Show content
		* Callback for Mouseenter
		*/
		show:function(){
			if( this.open ) return;
			this.open = true;
			this.btn.classList.add( cssActive );
			bj.show( this.content, 'block');
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		* Callback for Mouseleave
		*/
		hide:function(){
			if( !this.open ) return;
			this.open = false;
			this.btn.classList.remove( cssActive );
			bj.hide( this.content );
		}
	});

	/**
	* @Class
	* builds generic pattern for these elements
	* @returns {Object} 
	*/
	const btnShowContent = ( me ) => Object.assign( me, _change(), _show(), _hide());
	
	/**
	* Init common elems
	* but only if there is a btn in the DOM
	*/
	mapElems.forEach(( item ) => {
		
		const btn = document.getElementById( item.btn );
		
		if( btn !== null ){

			const obj = btnShowContent({	
				btn: btn,
				content: document.getElementById( item.contentID ),
				open: false, 
			});
		
			bj.userDown(`#${item.btn}`, () => obj.change());			
			bj.userEnter(`#${item.btn}`, () => obj.show());
			bj.userLeave(`#${item.wrapper}`, () => obj.hide());
		}	
	});
		

})( bluejay ); 