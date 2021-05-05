(function( bj ) {

	'use strict';	
	
	bj.addModule('sidebarExpandBtn');
	
	/**
	* This needs to match the CSS Media Query
	* when it changes check for reset
	*/
	const mediaQueryList = window.matchMedia("(max-width: 1180px)");
	mediaQueryList.addListener(() => {
		const nav = document.querySelector('nav.sidebar');
		if( !mediaQueryList.matches && nav != null ) {
			nav.classList.remove('show'); // back to desktop, reset!
		}
	});
	
	/**
	* @callback
	*/
	const change = () => {
		const nav = document.querySelector('nav.sidebar');
		if( nav.classList.contains('show')){
			nav.classList.remove('show');
		} else {
			nav.classList.add('show');
		}
	};

	// Events
	bj.userDown( '.sidebar-expander-btn', change );
	

})( bluejay ); 