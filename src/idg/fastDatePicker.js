(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDatePicker');	

	/*
	values in milliseconds 
	remember: server timestamps PHP work in seconds
	*/
	const now = Date.now();
	const today = new Date( now );

	/** 
	* Model - extended with views
	*/	
	const model = Object.assign({ 
		pickDate:null,
		inputDate:null, 
	
		get date(){
			return this.pickDate;
		}, 
		
		set date( val ){
			this.pickDate = val;
			this.views.notify();	
		}, 
		
		get userDate(){
			if( this.inputDate === null ){
				return false;
			} else {
				return this.inputDate;
			}
		},
		
		set userDate( val ){
			this.inputDate = val;
		},
		
		changeMonth( n ){
			this.pickDate.setMonth( n );
			this.views.notify();
		},
		
		changeFullYear( n ){
			this.pickDate.setFullYear( n );	
			this.views.notify();	
		}
		
	}, bj.ModelViews());

	
	/**
	* Date grid
	* @returns API
	*/
	const dateGrid = (() => {
		let div;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
		};
		
		/**
		* Build DOM, and pre-fill grid with blanks
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			div = bj.div("date-grid");
			div.innerHTML = Mustache.render( '{{#divs}}<div class="prev">{{.}}</div>{{/divs}}', { divs: new Array(42).fill('') });
			wrap.appendChild( div );
		};
		
		/**
		* Flag a date in the grid 
		* @param {Date} mydate
		* @param {String} className
		*/
		const flagDate = ( mydate, className ) => {
			if( mydate.getMonth() == model.date.getMonth() && 
				mydate.getFullYear() == model.date.getFullYear()){
				
				// flag date in UI
				const dateDiv = div.querySelector('#js-fast-date-' + mydate.getDate());
				dateDiv.classList.add( className ); 
			}
		};
		
		/**
		* Observers the model. 
		* Build the date grid based on the current date
		*/
		const dates = () => {
			const 
				y = model.date.getFullYear(),
				m = model.date.getMonth(), 
				mthStartDay = new Date(y, m, 1).getDay(),
				mthLastDate = new Date(y, m +1, 0).getDate(),
				prevEndDate = new Date(y, m, 0).getDate(),
				prev = [],
				current = [],
				next = [];
				
			// Sundays start the week (0), re-adjust to a Monday start
			let startDay = mthStartDay ? mthStartDay : 7;	
				 
			// Previous month dates to fill first week to the start day of current one
			for( let i = startDay-1, j = prevEndDate; i > 0; i--, j-- ) prev.push( j );
			
			// Current Month dates
			for( let i = 1; i <= mthLastDate; i++ ) current.push( i );
			
			// Next Month dates fills remaining spaces, grid is 7 x 6 (42)
			const fillDays = 42 - (prev.length + current.length);
			for( let i = 1; i <= fillDays; i++ ) next.push( i );
			
			if(( prev.length + current.length + next.length ) != 42 ) bj.log('[FastDatePicker] = DateGrid length error');
			
			prev.reverse(); // order previous correctly
				
			const datesPrev = Mustache.render( '{{#prev}}<div class="prev">{{.}}</div>{{/prev}}', { prev });
			const datesCurrent = Mustache.render( '{{#current}}<div id="js-fast-date-{{.}}">{{.}}</div>{{/current}}', { current });
			const datesNext = Mustache.render( '{{#next}}<div class="next">{{.}}</div>{{/next}}', { next });
			
			div.innerHTML = datesPrev + datesCurrent + datesNext;
			
			// flag today 
			flagDate( today, 'today' );
			
			// valid user date
			if( model.userDate != false ) flagDate( model.userDate, 'selected' );
		};
		
		// add to observers
		model.views.add( dates );
		
		// public
		return { reset, build };
		
	})();
	
	/**
	* Month
	* @returns API
	*/
	const month = (() => {
		const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		let div, active;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
			active = null;
		};
		
		/**
		* Build DOM
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			div = bj.div("month");
			div.innerHTML = Mustache.render( '{{#months}}<div>{{.}}</div>{{/months}}', { months });
			wrap.appendChild( div );
		};
		
		/**
		* Picker needs to find the month number from the btn name
		* @param {String} mthStr - e.g. 'Jan'
		* @returns {Number}
		*/
		const getMonthNum = ( mthStr ) =>  months.indexOf( mthStr );
		
		/**
		* Picker needs to know the month name
		* @param {Number} n 
		* @returns {String}
		*/
		const getMonthName = ( n ) =>  months[ n ];
		
		/**
		* Update DOM to show selected Month
		*/
		const update = () => {
			const mth = div.children[ model.date.getMonth() ];
			if( active ) active.classList.remove('selected');
			mth.classList.add('selected');
			active = mth;
		};
		
		// add to observers
		model.views.add( update );
		
		return { reset, build, getMonthNum, getMonthName };
		
	})();
	
	/**
	* Year
	* @returns API
	*/
	const year = (() => {
		let div, nodes;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
			nodes = null;
		};

		const build = ( wrap ) => {
			const template = [
				'<div class="century">{{#century}}<div>{{.}}</div>{{/century}}</div>',
				'<ul class="decade">{{#ten}}<li>{{.}}</li>{{/ten}}</ul>',
				'<ul class="single">{{#ten}}<li>{{.}}</li>{{/ten}}</ul>',
			].join('');

			const ten = Array.from( Array(10).keys() ); // 0 - 9
			
			div = bj.div("year");
			div.innerHTML = Mustache.render( template, { century: ['19', '20'], ten });
			
			nodes = {
				c: div.querySelector('.century').childNodes, 
				d: div.querySelector('.decade').childNodes,
				y: div.querySelector('.single').childNodes,
			};
			
			wrap.appendChild( div );
		};
		
		const getYearUnits = () => {
			const full = Array.from( model.date.getFullYear().toString());
			return {
				c: parseFloat( full[0] + full[1] ),
				d: parseFloat( full[2] ),
				y: parseFloat( full[3] )
			};
		};
		
		const update = () => {
			const yr = getYearUnits();
			yr.c = yr.c == 20 ? 1 : 0; // convert '19' and '20' century

			nodes.c.forEach((n) => n.classList.remove('selected'));
			nodes.d.forEach((n) => n.classList.remove('selected'));
			nodes.y.forEach((n) => n.classList.remove('selected'));
		
			nodes.c[ yr.c ].classList.add('selected');
			nodes.d[ yr.d ].classList.add('selected');
			nodes.y[ yr.y ].classList.add('selected');
		};
		
		
		// add to observers
		model.views.add( update );
		
		return { build, getYearUnits };
		
	})();
	
	
	/**
	* initate picker, build DOM and position
	* @param {Element} input (<input>)
	*/
	const picker = (() => {
		let input = null;
		let div = null;
		let ignoreBlurEvent = false;
		
		const initCalendar = () => {
			let validUserInputDate = false;
			let timeStamp;	
			
			if( input.value ){
				// check for valid date format: '1 Jan 1970' pattern
				if( /^\d{1,2} [a-z]{3} \d{4}/i.test( input.value )){
					timeStamp = Date.parse( input.value ); 
					if( !isNaN( timeStamp )){
						// OK, but is a reasonable date?
						const userDate = new Date( timeStamp );
						const userFullYear = userDate.getFullYear();
						if( userFullYear > 1900 && userFullYear < 2099 ){
							validUserInputDate = userDate;
						} 
					}
				}
			}
			
			// set up Model 
			if( validUserInputDate ){
				model.userDate = validUserInputDate;
				model.date = new Date( timeStamp ); // note: this will trigger Views, set last!
			} else {
				model.date = new Date( now );
			}
		};
		
		
		const show = ( el ) => {
			/*
			Refocusing on input, after ignoring a blue event
			will trigger the input event. 	
			*/
			if( el.isSameNode( input )) return; // ignore this.

			input = el;
	
			/*
			CSS height and width is fixed. 	
			Default position is below, left (follows Pick me up)
			*/
			const h = 240;
			const w = 460;
			const rect = input.getBoundingClientRect();
			
			div = bj.div("fast-date-picker");
			div.style.left = rect.left + 'px';
			div.style.top = rect.bottom + 'px';
			
			// check default positioning is available
			if( (rect.bottom + h) > bj.getWinH() ){
				div.style.top = (rect.top - h) + 'px';
			}
			if( (rect.left + w) > bj.getWinW() ){
				div.style.left = (rect.right - w ) + 'px';
			} 
			
			// build DOM elements 
			dateGrid.build( div );	
			month.build( div );
			year.build( div );
			
			// show picker
			document.body.appendChild( div );  
			
			// initCalendar
			initCalendar();
							
			// use blur to remove picker
			document.addEventListener('blur', picker.remove, { capture: true });
		};
		
		const changeDate = ( target, unit ) => {
			ignoreBlurEvent = true;
			
			const btnNum = parseFloat( target.textContent );
			const yr = year.getYearUnits();
			
			switch( unit ){
				case 'month':
					model.changeMonth( month.getMonthNum( target.textContent )); 
				break;
				
				case 'century': 
					if( btnNum == yr.c ) return;
					if( btnNum == 19 ){
						model.changeFullYear( 1999 );
					} else {
						model.changeFullYear( 2000 );
					}
				break;
				case 'decade':
					let decadeChange = (btnNum - yr.d) * 10;
					model.changeFullYear( model.date.getFullYear() + decadeChange );
				break;
				case 'year':
					let yearChange = btnNum - yr.y;
					model.changeFullYear( model.date.getFullYear() + yearChange );
				break;
			}
		};
		
		/**
		* Make oeDate
		* @param {Date} date
		* @returns {String} "dd Mth YYYY"
		*/
		const oeDate = date => date.getDate() + ' ' + month.getMonthName( date.getMonth()) + ' ' + date.getFullYear();
		
		const selectDate = ( target ) => {
			const date = parseFloat( target.textContent );
			let m = model.date.getMonth(); 
			
			if( target.classList.contains('prev')){
				model.changeMonth( m - 1 ); // JS handles Year change
			}
			if( target.classList.contains('next')){
				model.changeMonth( m + 1 ); // JS handles Year change
			}
			// insert date into input
			model.date.setDate( date );
			input.value = oeDate( model.date );
			remove();
			
		};
		
		const remove = () => {
			
			if( ignoreBlurEvent ){
				ignoreBlurEvent = false;
				input.focus();
				return;
			}
			
			dateGrid.reset();
			month.reset();
			//year.reset();
			
			// clean up and reset 
			document.removeEventListener('blur', picker.remove, { capture: true });
			bj.remove( div );
			div = null;
			input = null;
		};
		
		// public
		return { show, remove, changeDate, selectDate };
	
	})();
	
	/*
	Events
	custom event delegation	
	*/
	document.addEventListener('focus', ( ev ) => {
		if( ev.target.matches('input.date')){
			picker.show( ev.target );
		}
	}, { capture: true });
	

	bj.userDown('.fast-date-picker .month > div', ev => picker.changeDate( ev.target, 'month' ));
	bj.userDown('.fast-date-picker .century > div', ev => picker.changeDate( ev.target, 'century' ));
	bj.userDown('.fast-date-picker .decade li', ev => picker.changeDate( ev.target, 'decade' ));
	bj.userDown('.fast-date-picker .single li', ev => picker.changeDate( ev.target, 'year' ));
	bj.userDown('.fast-date-picker .date-grid > div', ev => picker.selectDate( ev.target ));

	
		
})( bluejay ); 
