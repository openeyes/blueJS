(function( bj, queue ){

	'use strict';	
	
	bj.addModule('queueManager');
	
	/*
	Check we are on right page... 
	*/
	if( document.getElementById('js-queue-mgmt-app') === null ) return;
	
	/*
	Fake a small loading delay, gives the impression it's doing something important
	and demonstrates how to do the loader...
	*/
	const loading = bj.div('oe-popup-wrap', '<div class="spinner"></div><div class="spinner-message">Loading...</div>');
	document.body.append( loading );
	setTimeout(() => initApp(), 500 );
	
	/**
	* Init the Queue Manager SPA
	*/
	const initApp = () => {
		bj.log('[Queue Manager] - intialising');
		/* 
		OK, ready to run this app, lets go!
		*/
		queue.app( JSON.parse( idgQueueDemoJSON ));
		loading.remove();
	};
	
})( bluejay, bluejay.namespace('queue')); 
