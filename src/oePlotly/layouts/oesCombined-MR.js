(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Combined Medical Retina"; // used in ID for div
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	/**
	* Helpers
	*/
	const dateRange = oePlotly.fullDateRange();
	const userSelecterUnits = oePlotly.selectableUnits();
	
	
	/**
	* Build data trace format for Glaucoma
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye' or 'BEO'
	* @param {Array} colorsArr  
	* @returns {Array} for Plol.ly data
	*/
	const buildDataTraces = ( eyeJSON, eyeSide, colorsArr  ) => {
		
		// a helper to loop through the color array
		const getColour = (() => {
			let i = 0;
			return () => {
				let c = i++;
				if( i >= colorsArr.length ) i = 0; 
				return colorsArr[ c ];
			};
		})();
		
		
		/**
		* store data traces with own keys
		* traces can then be accessed by their JSON name
		*/
		myPlotly.get( eyeSide ).set('data', new Map());
		
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dataLine({
				color: getColour()
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.VA.offScale.name, VA_offScale);
		dateRange.add( eyeJSON.VA.offScale.x );
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,	
			yaxis: 'y2',	
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dataLine({
				color: getColour(),
				dashed: true,
			}),
		};
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);
		dateRange.add( eyeJSON.CRT.x );
		
		/**
		* User selectable VA data traces
		*/
		
		const vaColorTrace = getColour();
		
		Object.values( eyeJSON.VA.units ).forEach(( unit, index ) => {
			
			userSelecterUnits.addTrace( eyeSide, {
				x: unit.x,
				y: unit.y,
				name: unit.name,	
				yaxis: 'y3',	
				hovertemplate: unit.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
				line: oePlotly.dataLine({
					color: vaColorTrace
				}),
			});
			
			// only need to check one of these dates
			if( !index ) dateRange.add( unit.x );
		});
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', userSelecterUnits.selectedTrace( eyeSide ));
		
		/**
		Build Events data for right eye
		*/
		// loop through array...
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			let template = event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}';
			
			let newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
					hovertemplate: template,
					type: 'scatter',
					showlegend: false,
				}, oePlotly.eventStyle(  event.event, getColour() ));
			
			myPlotly.get( eyeSide ).get('data').set( event.name, newEvent);
			dateRange.add( event.x );
		});
	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = () => {
		/*
		Single plot can have RE, LE or BEO
		Update all available traces and build data trace array
		*/
		let eyeKeys = ['rightEye', 'leftEye', 'BEO'];
		let data = [];
		
		eyeKeys.forEach(( key ) => {
			if( myPlotly.has( key )){
				
				let eyePlot = myPlotly.get( key ).get('data'); 
				
				// update VA data
				eyePlot.set('VA', userSelecterUnits.selectedTrace( key ));
				
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		}); 
		
		// make sure variable yAxis is updated
		myPlotly.get('layout').yaxis3 = Object.assign({}, userSelecterUnits.selectedAxis());
		
		// build new (or rebuild)
		Plotly.react(
			myPlotly.get('div'), 
			data, 
			myPlotly.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} axes
	*/
	const plotlyInitCombined = ( axes ) => {

		const layout = oePlotly.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'bottom',
				y:0.82,
			},
			plotTitle: 'Right, Left and BEO',
			xaxis: axes.x,
			yaxes: axes.y,
			subplot: 3,	 // offScale, VA, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
		});
		
		
		const div = oePlotly.buildDiv(`${oesTemplateType}`, '80vh', '650px');
		document.querySelector( '.oes-left-side' ).appendChild( div );
		
		/**
		Comnbined data plots, therefore only 1 <div> and only 1 'layout'
		*/
		myPlotly.set('div', div);
		myPlotly.set('layout', layout);
		
		// build
		plotlyReacts();
		
		// set up click through
		oePlotly.addClickEvent( div, '?' );
		oePlotly.addHoverEvent( div, '?' );
		
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
			[0, 0.15],
			[0.2, 0.82],
			[0.88, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			darkTheme,
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
				rightSide: 'y2',
				domain: domainRow[1],
				title: 'VA',  // prefix for title
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges ),
		});


		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());

			buildDataTraces( json.rightEye, 'rightEye',
				oePlotly.getColorSeries('rightEyeSeries')
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlotly.getColorSeries('leftEyeSeries')
			);
		}
		
		if( json.BEO ){
			myPlotly.set('BEO', new Map());
			buildDataTraces( json.BEO, 'BEO', 
				oePlotly.getColorSeries('BEOSeries')
			);
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
			noMirrorLines: true,
		}, darkTheme );
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: [200, 650], // hard coded range
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
		
		
		plotlyInitCombined({
			x: x1, 
			y: [ y0, y1, y2, y3 ],
		});	
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotCombinedMedRet', init);	
		
})( bluejay ); 