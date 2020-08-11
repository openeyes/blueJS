(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Medical Retina";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map([
		[ 'right', new Map() ],
		[ 'left', new Map() ]
	]);
	
	/**
	* Helpers
	*/
	const dateRange = oePlotly.fullDateRange();
	const userSelecterUnits = oePlotly.selectableUnits();
	
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'left' or 'right'
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( eyeJSON, eyeSide  ) => {
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,		
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		dateRange.add( eyeJSON.CRT.x );
		
		/**
		* User selectable VA data traces
		*/
		Object.values( eyeJSON.VA.units ).forEach(( unit, index ) => {
			
			userSelecterUnits.addTrace( eyeSide, {
				x: unit.x,
				y: unit.y,
				name: unit.name,	
				yaxis: 'y2',	
				hovertemplate: unit.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
			});
			
			if( !index ) dateRange.add( unit.x ); // only need 1 of these 
		});
		
		
		/**
		Build Events data for right eye
		*/
		const events = [];
		// loop through array...
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			let template = event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}';
			
			let newEvent = Object.assign({
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y3',
					hovertemplate: template,
					type: 'scatter',
					showlegend: false,
				}, oePlotly.eventStyle(  event.event ));
			
			events.push( newEvent );
			
			dateRange.add( event.x );
		});
		
		/*
		Data trace array
		*/
		const all = [ CRT, userSelecterUnits.selectedTrace( eyeSide ) ].concat( events );
		
		// store data traces
		myPlotly.get( eyeSide ).set('data', all);
	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide );
		
		// update SPECIFIC data trace in data array. note: [n]
		eyePlot.get('data')[1] = userSelecterUnits.selectedTrace( eyeSide );
		
		// update layout specific axis
		eyePlot.get('layout').yaxis2 = Object.assign({}, userSelecterUnits.selectedAxis());

		// build new (or rebuild)
		Plotly.react(
			eyePlot.get('div'), 
			eyePlot.get('data'), 
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const eyeSide = setup.eye;
		
		const layout = oePlotly.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'bottom',
				y:0.80,
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 2,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${setup.eye}Eye`, '80vh', '600px');
		document.querySelector( setup.parentDOM ).appendChild( div );
		
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
		
		// set up click through
		oePlotly.addClickEvent( div, setup.eye );
		oePlotly.addHoverEvent( div, eyeSide );
		
		// bluejay custom event (user changes layout)
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}
		
		// for all subplot rows
		const domainRow = [
			[0, 0.08],
			[0.1, 0.80],
			[0.88, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			darkTheme,
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
				rightSide: 'y1',
				domain: domainRow[1],
				title: 'VA',  // prefix for title
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges ),
		});
		
		
		/**
		* Data 
		*/
	
		if( json.rightEye ){
			dataTraces( json.rightEye, 'right' );
		}
		
		if( json.leftEye ){
			dataTraces( json.leftEye, 'left' );
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			range: dateRange.firstLast(), 
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650],
			spikes: true,
		}, darkTheme );
		

		// y3 - Events
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[2],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		/*
		* Dynamic axis
		* VA axis depends on selected unit state
		*/
		const y2 = userSelecterUnits.selectedAxis();
		
		/**
		* Layout & Build  - Eyes
		*/	
		if( myPlotly.has('right') ){
			
			plotlyInit({
				title: "Right Eye",
				eye: "right",
				colors: "rightEye",
				xaxis: x1, 
				yaxes: [ y1, y2, y3 ],
				parentDOM: '.oes-left-side',
			});	
		} 
		
		if( myPlotly.has('left') ){
			
			plotlyInit({
				title: "Left Eye",
				eye: "left",
				colors: "leftEye",
				xaxis: x1, 
				yaxes: [ y1, y2, y3 ],
				parentDOM: '.oes-right-side',
			});			
		}
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotSummaryMedicalRetina', init);	
		
})( bluejay ); 