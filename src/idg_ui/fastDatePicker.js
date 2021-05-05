
(function( bj ) {
	'use strict';	
	
	bj.addModule('fastDatePicker');	

	/*
	values in milliseconds 
	remember: server timestamps PHP work in seconds
	*/
	const now = Date.now(); // should we be using a Server timestamp?
	const today = new Date( now );

	/** 
	* Model - extended with MV views
	*/	
	const model = Object.assign({ 
		pickDate:null, 	// currently picked date
		inputDate:null, // if a valid date already exists in <input>
	
		get date(){
			return this.pickDate;
		}, 
		set date( val ){
			this.pickDate = val;
			this.views.notify();	
		}, 
		get userDate(){
			if( this.inputDate == null ) return false;
			return this.inputDate;
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
	* Date grid - calendar of dates in weekly grid
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
		* Observer the model. 
		* Build the date grid based on the current picked Date
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
				
			// in JS sundays start the week (0), re-adjust to a Monday start
			let startDay = mthStartDay ? mthStartDay : 7;	
				 
			// Previous month dates to fill first week line to the start day of current month
			for( let i = startDay-1, j = prevEndDate; i > 0; i--, j-- ) prev.push( j );
			
			// Current Month dates
			for( let i = 1; i <= mthLastDate; i++ ) current.push( i );
			
			// Next Month dates fill remaining spaces - date grid is 7 x 6 (42)
			const fillDays = 42 - (prev.length + current.length);
			for( let i = 1; i <= fillDays; i++ ) next.push( i );
			
			// order previous dates correctly
			prev.reverse(); 
				
			// build DOM
			const datesPrev = Mustache.render( '{{#prev}}<div class="prev">{{.}}</div>{{/prev}}', { prev });
			const datesCurrent = Mustache.render( '{{#current}}<div id="js-fast-date-{{.}}">{{.}}</div>{{/current}}', { current });
			const datesNext = Mustache.render( '{{#next}}<div class="next">{{.}}</div>{{/next}}', { next });
			
			div.innerHTML = datesPrev + datesCurrent + datesNext;
			
			// flag today 
			flagDate( today, 'today' );
			
			// if there is valid user date...
			if( model.userDate != false ) flagDate( model.userDate, 'selected' );
		};
		
		// add to observers
		model.views.add( dates );
		
		// public
		return { reset, build };
		
	})();
	
	/**
	* Months
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
		let div, nodes, yearList;
		let slideYears = false;
		
		/**
		* Reset (ready for next date)
		*/
		const reset = () => {
			div = null;
			nodes = null;
			yearList = null;
			slideYears = false;
		};

		/**
		* Build DOM
		* @param {Element} wrap - main <div>
		*/
		const build = ( wrap ) => {
			const template = [
				'<div class="century">{{#century}}<div>{{.}}</div>{{/century}}</div>',
				// '<ul class="decade">{{#ten}}<li>{{.}}</li>{{/ten}}</ul>',
				'<ul class="years">{{#years}}<li>{{.}}</li>{{/years}}</ul>',
			].join('');

			//const ten = Array.from( Array(10).keys() ); // 0 - 9
			const hundred = Array.from( Array(100).keys() ); // 0 - 99;
			const years = hundred.map( x => x < 10 ? `0${x}` : x );
			
			div = bj.div("year");
			div.innerHTML = Mustache.render( template, { century: ['19', '20'], years });
			
			yearList = div.querySelector('.years');
			
			// store reference to nodelists (should be OK, use Array.from otherwise)
			nodes = {
				c: div.querySelector('.century').childNodes, 
				//d: div.querySelector('.decade').childNodes,
				y: yearList.childNodes,
			};
			
			wrap.append( div );
			
		};
		
		/**
		* Years need to used in centuries, decades and single years
		* @retures {Object} year units
		*/
		const getYearUnits = () => {
			const fullYear =  model.date.getFullYear();
			return {
				c: Math.floor( fullYear / 100 ),
				//d: parseFloat( fullYear.toString().charAt(2) ),
				y: parseFloat( fullYear.toString().substring(2))
			};
			
			
		};
		
		/**
		* Update DOM to show selected Year
		*/
		const update = () => {
			const yr = getYearUnits();
			
			// convert '19' and '20' century to UI nodelist places
			yr.c = yr.c == 20 ? 1 : 0; 

			nodes.c.forEach((n) => n.classList.remove('selected'));
			//nodes.d.forEach((n) => n.classList.remove('selected'));
			nodes.y.forEach((n) => n.classList.remove('selected'));
		
			nodes.c[ yr.c ].classList.add('selected');
			//nodes.d[ yr.d ].classList.add('selected');
			nodes.y[ yr.y ].classList.add('selected');
			
			// and center scrolling years (based on CSS height settings)

			yearList.scrollTo({
			  top: (yr.y * 38.5) - 95,
			  left: 0,
			  behavior: slideYears ? 'smooth' : 'auto' // first time jump to position
			});
			
			slideYears = true;
		};
		
		
		// add to observers
		model.views.add( update );
		
		return { reset, build, getYearUnits };
		
	})();
	
	
	/**
	* Picker (controller)
	*/
	const picker = (() => {
		let input, div;
		/*
		Using 'blur' event to remove picker popup. But if user 
		clicks on a picker date this needs to be ignored
		*/
		let ignoreBlurEvent = false;
		
		/**
		* Remove and reset
		* Either called directly when user selects a Date or by 'blur'
		* Or by 'blur' event
		*/
		const remove = () => {
			/*
			If part of an Event chain from Month 
			or Year change then ignore this	'blur' request
			*/
			if( ignoreBlurEvent ){
				ignoreBlurEvent = false;
				input.focus(); // instantly return focus so that we can use 'blur'
				return;
			}
			
			// help JS with GC
			dateGrid.reset();
			month.reset();
			year.reset();
			
			// clean up and reset 
			document.removeEventListener('blur', picker.remove, { capture: true });
			//window.removeEventListener('scroll', picker.remove, { capture:true, once:true });
			bj.remove( div );
			div = null;
			input = null;
		};
		
		/**
		* initCalender when DOM is built.
		* check <input> for a valid or use 'today'
		*/
		const initCalendar = () => {
			let timeStamp;
			let validUserInputDate = false;
			
			// <input> - test for valid date format: '1 Jan 1970' pattern
			if( input.value ){
				if( /^\d{1,2} [a-z]{3} \d{4}/i.test( input.value )){
					timeStamp = Date.parse( input.value ); 
					if( !isNaN( timeStamp )){
						/*
						Seems valid, but is it reasonable?
						it could be '1 Jan 2328', check within year range
						*/
						const userDate = new Date( timeStamp );
						const userFullYear = userDate.getFullYear();
						if( userFullYear > 1900 && userFullYear < 2099 ){
							validUserInputDate = userDate;
						} 
					}
				}
			}
			
			// set up Model with Date 
			if( validUserInputDate ){
				model.userDate = validUserInputDate;
				model.date = new Date( timeStamp ); // note: this will trigger Views notifications, must be set last!
			} else {
				model.date = new Date( now );
			}
		};
		
		/**
		* Show Fast Date picker - callback from 'focus' event
		* @param {Element} el - event.target (input.date)
		*/
		const show = ( el ) => {
			/*
			Note: refocusing on the input, after ignoring a blur event
			will trigger the input event again, ignore this	
			*/
			if( el.isSameNode( input )) return;

			// OK new <input>
			input = el;
	
			/*
			CSS height and width is fixed. 	
			Default position is below, left (follows Pick me up)
			*/
			const h = 240;
			const w = 430;
			const rect = input.getBoundingClientRect();
			
			div = bj.div("fast-date-picker");
			div.style.left = (rect.right - w ) + 'px';
			div.style.top = rect.bottom + 'px';
			
			// check default positioning is available, if not shift position
			if( rect.left < w ) div.style.left = rect.left + 'px';
			if( (rect.bottom + h) > bj.getWinH())	div.style.top = (rect.top - h) + 'px';
			
			
			// build popup elements 
			year.build( div );
			month.build( div );
			dateGrid.build( div );	
			
			
			// show picker
			document.body.appendChild( div );  
			
			// initCalendar (set the Model)
			initCalendar();
							
			// use blur to remove picker
			document.addEventListener('blur', picker.remove, { capture: true });
			//window.addEventListener('scroll', picker.remove, { capture:true, once:true });
		};
		
		/**
		* Callback for Events on Month and Year
		* @param {Element} target - event.target
		* @param {String} unit - unit type
		*/
		const changeDate = ( target, unit ) => {
			/*
			This event will trigger 'blur' must ignore it
			in this Event chain, otherwise it will close picker
			*/
			ignoreBlurEvent = true;
			
			const btnNum = parseFloat( target.textContent );
			const yearParts = year.getYearUnits();
			
			switch( unit ){
				case 'month':
					model.changeMonth( month.getMonthNum( target.textContent )); 
				break;
				
				case 'century': 
					if( btnNum == yearParts.c ) return;
					if( btnNum == 19 ){
						model.changeFullYear( 1999 );
					} else {
						model.changeFullYear( today.getFullYear() );
					}
				break;
/*
				case 'decade':
					let decadeChange = (btnNum - yearParts.d) * 10;
					model.changeFullYear( model.date.getFullYear() + decadeChange );
				break;
*/
				case 'year':
					let yearChange = btnNum - yearParts.y;
					model.changeFullYear( model.date.getFullYear() + yearChange );
				break;
			}
		};
		
		/**
		* oeDate
		* @param {Date} date
		* @returns {String} "dd Mth YYYY"
		*/
		const oeDate = date => date.getDate() + ' ' + month.getMonthName( date.getMonth()) + ' ' + date.getFullYear();
		
		/**
		* Callback for Events on Dates
		* instantly sets the input date value
		* @param {Element} target - event.target
		*/
		const selectDate = ( target ) => {
			const date = parseFloat( target.textContent );
			let m = model.date.getMonth(); 
			
			if( target.classList.contains('prev')){
				model.changeMonth( m - 1 ); // JS handles Year change
			}
			if( target.classList.contains('next')){
				model.changeMonth( m + 1 ); // JS handles Year change
			}
			
			/* 
			Update Model with the selected Date 
			and insert date into input
			*/
			model.date.setDate( date );
			input.value = oeDate( model.date );
			
			bj.customEvent('idg:DatePickerChange', model.date );
			
			remove(); // done! 
		};
		
		// public
		return { show, remove, changeDate, selectDate };
	
	})();
	
	/*
	Events
	*/
	
	document.addEventListener('focus', ( ev ) => {
		if( ev.target.matches('input.date')){
			picker.show( ev.target );
		}
	}, { capture: true });

	bj.userDown('.fast-date-picker .month > div', ev => picker.changeDate( ev.target, 'month' ));
	bj.userDown('.fast-date-picker .century > div', ev => picker.changeDate( ev.target, 'century' ));
	//bj.userDown('.fast-date-picker .decade li', ev => picker.changeDate( ev.target, 'decade' ));
	bj.userDown('.fast-date-picker .years li', ev => picker.changeDate( ev.target, 'year' ));
	bj.userDown('.fast-date-picker .date-grid > div', ev => picker.selectDate( ev.target ));

})( bluejay ); 
