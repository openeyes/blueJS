(function( bj, oePlot ){

	'use strict';
	
	/**
	* OES Medical Retina R/L template
	* Sub-plot layout
	* |- Events: Injection, Images (OCT), Managment (Inj Mgmt & Clinical Mgmt)
	* |- CRT & VA (VA has multiple units)
	* |- Offscale: CF, HM, PL, NPL
	* |- [Navigator] 
	*
	* Domain allocation for layout: (note: 0 - 1, 0 is the bottom)
	* Using subploting within plot.ly - Navigator outside this
	*/
	const domainRow = [
		[0.75, 1], 		// Events
		[0.15, 0.68],	// CRT & VA
		[0, 0.15],		// Offscale
	];
	
	/**
	* Template globals, helpers added on init() to save memory
	*/
	const oesTemplateType = "OES Medical Retina";
	const darkTheme = oePlot.isDarkTheme();  // which CSS theme is running?
	const myPlotly = new Map();	 // Plotly: Abstraction of required top level parameters for each plot (R & L)
	const helpers = {}; // see init();
	let tools; 
	
	
	/**
	* Build data traces for Plotly
	* traces are stored in myPlotly Map.
	* @param {JSON} eyeJSON data
	* @param {String} eyeSide - 'leftEye' or 'rightEye'
	*/
	const buildDataTraces = ( eyeJSON, eyeSide  ) => {
		
		// VA offscale: CF, HM, PL, NPL
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: eyeJSON.CRT.name,	
			yaxis: 'y2',	
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlot.dashedLine(),
		};
	
		/**
		VA data traces can be changed by the User, e.g. Snellen Metre, logMAR, etc
		the trace AND it's axis layout need to be stored together. This is what
		userSelectedUnits handles.
		*/
		
		for (const [ key, trace ] of Object.entries( eyeJSON.VA.units )){
			tools.selectableUnits.addTrace( eyeSide, key, {
				x: trace.x,
				y: trace.y,
				name: trace.name,	
				yaxis: 'y3',	
				hovertemplate: trace.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
			});
		}
		
		Object.values( eyeJSON.VA.units ).forEach(( trace, index ) => {
			tools.selectableUnits.addTrace( eyeSide, {
				x: trace.x,
				y: trace.y,
				name: trace.name,	
				yaxis: 'y3',	
				hovertemplate: trace.name + ': %{y}<br>%{x}',
				type: 'scatter',
				mode: 'lines+markers',
			});
		});
		
		/**
		Store data traces in myPlotly
		*/
		myPlotly.set( eyeSide, new Map());
		myPlotly.get( eyeSide ).set('data', new Map());
		myPlotly.get( eyeSide ).get('data').set( VA_offScale.name, VA_offScale );
		myPlotly.get( eyeSide ).get('data').set( CRT.name, CRT );
		myPlotly.get( eyeSide ).get('data').set('VA', tools.selectableUnits.getTrace( eyeSide ));
		
		/**
		Event data are all individual traces
		all the Y values are are the SAME, so that are shown on a line
		extra data for the popup can be passed in with customdata
		*/
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			const newEvent = Object.assign({
					oeEventType: event.event, // store event type
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
					hovertemplate: event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}',
					type: 'scatter',
					showlegend: false,
				}, oePlot.eventStyle(  event.event ));
			
			myPlotly.get( eyeSide ).get('data').set( newEvent.name, newEvent);
		});
	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		// get the eyePlot for the eye side
		let eyePlot = myPlotly.get( eyeSide );
		
		/*
		Update user selected units for VA
		*/
		eyePlot.get('data').set('VA', tools.selectableUnits.getTrace( eyeSide ));
		eyePlot.get('layout').yaxis3 = Object.assign({}, tools.selectableUnits.getAxis());
		
		// get Data Array of all traces
		const data = Array.from( eyePlot.get('data').values());
		
		// build new (or rebuild)

		Plotly.react(
			eyePlot.get('div'), 
			data, 
			eyePlot.get('layout'), 
			{ displayModeBar: false, responsive: true }
		);
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const eyeSide = setup.eyeSide;
		
		const layout = oePlot.getLayout({
			darkTheme, // dark?
			legend: {
				yanchor:'bottom',
				y: domainRow[1][1],
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: domainRow.length, // num of sub-plots 
			rangeSlider: true, 
			dateRangeButtons: true,
		});
			
		/*
		Need a wrapper to help with the CSS layout
		*/		
		const div = oePlot.buildDiv(`oes-${eyeSide}`);
		document.querySelector( setup.parentDOM ).appendChild( div );
		
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
		
		// set up click through
		oePlot.addClickEvent( div, setup.eye );
		oePlot.addHoverEvent( div, eyeSide );
		
		// bluejay custom event (user changes layout)
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout( div, layout );
		});	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json  ) => {
		if( json === null ) throw new Error('[oePlot] Sorry, no JSON data!');
		bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		
		/**
		* oePlot tools
		* this allows the user to access extra chart functionality
		* tools will add a fixed toolbar DOM to the page
		*/
		tools = oePlot.tools();
		tools.updatePlot( plotlyReacts );
		//tools.addHoverModeOptions();
		
		/*
		* VA has dynamic axis based, e.g. SnellenMetre, LogMAR, etc
		* builtd all the axes required for each.
		*/
		tools.selectableUnits.addAxes({
			axisDefaults: {
				type:'y',
				rightSide: 'y2', // CRT & VA plot 
				domain: domainRow[1],
				spikes: true,
			}, 
			yaxes: json.yaxis.VA,
			prefix: 'VA',
		});
		
		tools.showToolbar();
		
		// set Y3 to the "makeDefault" unit. User can change this
		const y3 = tools.selectableUnits.getAxis();
		

		/**
		* Traces - build data traces from JSON 
		*/
		
		if( json.rightEye ){
			buildDataTraces( json.rightEye, 'rightEye' );
		}
		
		if( json.leftEye ){
			buildDataTraces( json.leftEye, 'leftEye' );
		}
	
		/**
		* Axes 
		*/
		
		// x1 - Timeline
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );
		
		// y1 - offscale 
		const y1 = oePlot.getAxis({
			type:'y',
			domain: domainRow[2], 
			useCategories: {
				categoryarray: json.yaxis.offScale,
				rangeFit: "padTop", // "exact", etc
			},
			spikes: true,
		}, darkTheme );
		
		// y2 - CRT
		const y2 = oePlot.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'CRT', 
			range: json.yaxis.CRT, 
			spikes: true,
		}, darkTheme );
		

		// y4 - Events
		const y4 = oePlot.getAxis({
			type:'y',
			domain: domainRow[0],
			useCategories: {
				categoryarray: json.allEvents,
				rangeFit: "pad", // "exact", etc
			},
			spikes: true,
		}, darkTheme );
		
		/**
		* Layout & Build  - Eyes
		*/	
		if( myPlotly.has('rightEye') ){
			
			plotlyInit({
				title: "Right Eye",
				eyeSide: "rightEye",
				colors: "rightEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4 ],
				parentDOM: '.oes-left-side',
			});	
		} 
		
		if( myPlotly.has('leftEye') ){
			
			plotlyInit({
				title: "Left Eye",
				eyeSide: "leftEye",
				colors: "leftEyeSeries",
				xaxis: x1, 
				yaxes: [ y1, y2, y3, y4 ],
				parentDOM: '.oes-right-side',
			});			
		}

	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotSummaryMedicalRetina', init );	
		
})( bluejay, bluejay.namespace('oePlot')); 