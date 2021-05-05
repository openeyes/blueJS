(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDateRange');	

	const div = document.querySelector('.set-date-range');
	
	if( div == null ) return;
	
	// DOM elements
	const inputTo = div.querySelector('.js-filter-date-to');
	const inputFrom = div.querySelector('.js-filter-date-from');
	
	/* 
	values in milliseconds 
	remember: server timestamps PHP work in seconds
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
	const setDateRange = ( dateFrom, dateTo ) => {	
		inputFrom.value = oeDate( dateFrom ); 
		if( dateTo ){
			inputTo.value = oeDate( dateTo );
		} else {
			inputTo.value = "";
		}
		
	};
	
	/**
	* Single day
	* @param {Date} day
	*/
	const singleDay = day => setDateRange( day, false );
	
	/**
	* Week: Mon to Fri
	* @param {Number} weekoffset
	*/
	const weekRange = ( offset ) => {
		let dayNum = today.getDay();
		let monday = now + ( day * (1 - dayNum ));
		let weekStart = monday + ( day * offset);
		setDateRange( new Date( weekStart ), new Date( weekStart + ( day * 6 )));
	};
	
	/**
	* Month
	* @param {Number} monthOffset
	*/
	const monthRange = ( offset ) => {
		let y = today.getFullYear(); 
		let m = today.getMonth() + offset;
		// watch out for year changes
		if( m > 11 ){
			m = 0;
			y = y + 1;
		}
		if( m < 0){
			m = 11; 
			y = y - 1;
		}
		setDateRange( new Date(y, m, 1), new Date(y, m + 1, 0 ));
	};

	/**
	* Handle user event
	* @param {Event} ev (div.range)
	*/
	const userClicks = ( range ) => {
		switch( range ){
			case 'yesterday': singleDay( new Date( now - day ));
			break;
			case 'today': singleDay( today );
			break; 
			case 'tomorrow': singleDay( new Date( now + day ));
			break;
			
			case 'next-4-days': 
			case 'next-7-days': 
			case 'next-12-days': 
				const days = range.split('-')[1];
				const add = parseInt( days , 10 );
				setDateRange( today, new Date( now + ( day * add )));
			break; 
			
			case 'last-week': weekRange( -7 );		
			break;
			case 'this-week': weekRange( 0 );	
			break; 
			case 'next-week': weekRange( 7 );		
			break; 
			
			case 'last-month': monthRange( -1 );
			break; 
			case 'this-month': monthRange( 0 );
			break; 
			case 'next-month': monthRange( +1 );
			break;

			default: bj.log('[fastDateRange] unknown range request: ' +  range );
		}
	
	};
	
	// If this is being used on the new worklist page, create a quick iDG UIX demo: 
	const setHeaderDateRange = ( msg ) => {
		const showDate = document.querySelector('.clinic-context .date-range');
		if( showDate == null ) return; 
	
		showDate.textContent = msg == "custom" ? 
			`${inputFrom.value} - ${inputTo.value}`: 
			msg;
	};
	
	/*
	Initiate date range based on the checked date selector
	*/
	(() => {
		const checkedSelector = div.querySelector('input:checked');
		if( checkedSelector != null ){
			userClicks( checkedSelector.value );
		}
	})();
	

	/*
	Events	
	*/
	div.addEventListener('change', ev => {
		userClicks( ev.target.value );
		setHeaderDateRange( ev.target.nextSibling.textContent );
	});
	
	// if the use clicks on the DatePicker this means 
	// it's now a custom date range
	document.addEventListener('idg:DatePickerChange', ev => {
		setHeaderDateRange( "custom" );
	});
		
})( bluejay ); 
