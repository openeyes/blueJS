(function( bj ) {

	'use strict';	
	
	bj.addModule('sidebarExpandBtn');
	
	/**
	Sidebar expander
	*/
	const nav = document.querySelector('nav.sidebar');
	if( nav == null ) return;
	
	/**
	* This needs to match the CSS Media Query
	* when it changes check for reset
	*/
	const mediaQueryList = window.matchMedia("(max-width: 1180px)");
	
	mediaQueryList.addListener(() => {
		if( !mediaQueryList.matches ) {
			nav.classList.remove('show'); // back to desktop, reset!
		}
	});
	
	/**
	* @callback
	*/
	const change = () => {
		if( nav.classList.contains('show')){
			nav.classList.remove('show');
		} else {
			nav.classList.add('show');
		}
	};

	// Events
	bj.userDown( '.sidebar-expander-btn', change );
	

})( bluejay ); 