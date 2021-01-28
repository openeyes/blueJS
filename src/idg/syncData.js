(function( bj ) {

	'use strict';	
	
	bj.addModule('syncData');	
	
	if( document.getElementById('js-sync-data') == null ) return;
	
	/**
	Sync widget for use on screens that needs auto-refreshing
	e.g. Worklists and Clinic Manager
	For Opening it using the general-ui pattern
	*/
	
	const syncBtn = document.querySelector('.sync-data .sync-btn');
	const syncTime = document.querySelector('.sync-data .last-sync');
	const syncInterval = document.querySelector('.sync-data .sync-interval');
	let timerID = null;
	
	const setSyncTime = () => syncTime.textContent = bj.clock24( new Date( Date.now()));

	const setSyncInterval = ( mins ) => {
		clearInterval( timerID );
		if( mins ){
			const suffix = mins > 1 ? 'mins' : 'min';
			syncInterval.textContent = `${mins} ${suffix}`;
			timerID = setInterval(() => setSyncTime(), mins * 60000 );
			setSyncTime();
			syncBtn.classList.add('on');
		} else {
			syncInterval.textContent = 'Sync OFF';
			syncBtn.classList.remove('on');
		}	
	};
	
	// default is always 1 minute
	setSyncInterval( 1 );
		
	bj.userClick('.sync-options button', ( ev ) => {
		setSyncInterval( parseInt( ev.target.dataset.sync, 10));
	});


})( bluejay ); 