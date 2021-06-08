(function( bj ){

	'use strict';	
	
	bj.addModule('navWorklists');
	
	const worklistsPanel = document.getElementById('js-worklists-panel');
	if( worklistsPanel === null ) return;
	
	const btn = document.getElementById('js-nav-worklists-btn');
	let open = false;
	
	const show = () => {
		bj.show( worklistsPanel, 'block');
		btn.classList.add('active');
		open = true;
	};
	
	const hide = () => {
		bj.hide( worklistsPanel );
		btn.classList.remove('active');
		open = false;
	};

	/*
	Events
	*/
	bj.userDown('#js-nav-worklists-btn', () => open ? hide() : show());	
	
	// OEC landing page needs to pop this open!
	bj.extend('openNavWorklistPanel', show );
	
	
	/**
	Worklist panel completely obscures the hotlist.
	therefore if the User clicks on the hotlist make sure
	worklist panel hides otherwise they can't see the 
	the hotlist!
	*/
	document.addEventListener('idg:hotlistLockedOpen', hide );
	
	// user clicks on hotlist icon (it's fixed but they can't see it)
	document.addEventListener('idg:hotlistViewFixed', hide );


})( bluejay ); 