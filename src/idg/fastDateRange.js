(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDateRange');	

	const fastDateRange = document.querySelector('.fast-date-range');
	
	if( fastDateRange == null ) return;
	
	// DOM elements
	const inputTo = document.querySelector('.js-filter-date-to');
	const inputFrom = document.querySelector('.js-filter-date-from');
	const allDates = document.getElementsByName('show-all-date-range')[0]; // nodelist!
	
	/* 
	values in milliseconds 
	rememnber: server timestamps PHP work in seconds
	*/
	const now = Date.now();
	const today = new Date( now );
	const day = 1000 * 60 * 60 * 24;
	const week = 1000 * 60 * 60 * 24 * 7;
	const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
	
	/**
	* Make oeDate
	* @param {Date} date
	* @returns {String}
	*/
	const oeDate = date => date.getDate() + ' ' + months[ date.getMonth() ] + ' ' + date.getFullYear();

	/**
	* Set the 'to' and 'from' date inputs
	* @param {Date} dateTo
	* @param {Date} dateFrom
	*/
	const setDateRange = ( dateTo, dateFrom ) => {	
		inputTo.value = oeDate( dateTo ); 
		inputFrom.value = oeDate( dateFrom );
		allDates.checked = false; // unclick "all dates"
	};
	
	/**
	* Single day
	* @param {Date} day
	*/
	const singleDay = day => setDateRange( day, day );
	
	/**
	* Week: Mon to Fri
	* @param {Number} weekoffset
	*/
	const weekRange = ( offset ) => {
		let dayNum = today.getDay();
		let monday = now + ( day * (1 - dayNum ));
		let weekStart = monday + ( day * offset);
		setDateRange( new Date( weekStart ), new Date( weekStart + ( day * 4 )));
	};

	/**
	* Handle user event
	* @param {Event} ev (div.range)
	*/
	const userClicks = ( ev ) => {
		const div = ev.target;
		if( !div.hasAttribute('data-range')) return;
		
		const range = div.getAttribute('data-range');
	
		switch( range ){
			case 'yesterday': singleDay( new Date( now - day ));
			break;
			case 'today': singleDay( today );
			break; 
			case 'tomorrow': singleDay( new Date( now + day ));
			break; 
			
			case 'last-week': weekRange( -7 );		
			break;
			case 'this-week': weekRange( 0 );	
			break; 
			case 'next-week': weekRange( 7 );		
			break; 

			default: bj.log('[fastDateRange] unknown range request: ' +  range );
		}
	};

	/*
	Events	
	*/
	bj.userDown('.fast-date-range .range', userClicks );
		
})( bluejay ); 
