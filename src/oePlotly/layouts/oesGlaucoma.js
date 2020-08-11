(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Glaucoma";
	
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
	const dataTraces = ( eyeJSON, eyeSide ) => {
		
		const VA_offScale = {
			x: eyeJSON.VA.offScale.x,
			y: eyeJSON.VA.offScale.y,
			name: eyeJSON.VA.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		dateRange.add( eyeJSON.va.offScale.x );
		
		const VFI = {
			x: eyeJSON.VFI.x,
			y: eyeJSON.VFI.y,
			name: eyeJSON.VFI.name,	
			yaxis: 'y5',	
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		dateRange.add( eyeJSON.VFI.x );
		
		const IOP = {
			x: eyeJSON.IOP.x,
			y: eyeJSON.IOP.y,
			name: eyeJSON.IOP.name,		
			yaxis: 'y3',
			hovertemplate: 'IOP: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		dateRange.add( eyeJSON.IOP.x );
		
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
		* Events
		*/
		const events = [];
		Object.values( eyeJSON.events ).forEach(( event ) => {
			
			let template = event.customdata ? '%{y}<br>%{customdata}<br>%{x}' : '%{y}<br>%{x}';
			
			let newEvent = Object.assign({
					x: event.x, 
					y: event.y, 
					customdata: event.customdata,
					name: event.name, 
					yaxis: 'y4',
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
		const all = [ VA_offScale, VFI, userSelecterUnits.selectedTrace( eyeSide ), IOP ].concat( events );
		
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
		eyePlot.get('data')[2] = userSelecterUnits.selectedTrace( eyeSide );
		
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
				traceorder: "reversed",
				yanchor:'bottom',
				y:0.82,
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 4,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			vLineLabel: {
				x: Object.values( setup.procedures ),
				h: 0.82,
			},
			hLineLabel: {
				y: Object.values( setup.targetIOP ),
				axis: 'y3'
			}
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${eyeSide}Eye`, '80vh', '850px');
		document.querySelector( setup.parentDOM ).appendChild( div );
		
		// store details
		myPlotly.get( eyeSide ).set('div', div);
		myPlotly.get( eyeSide ).set('layout', layout);
		
		// build
		plotlyReacts( eyeSide );
	
		// add events
		oePlotly.addClickEvent( div, eyeSide );
		oePlotly.addHoverEvent( div, eyeSide );
		
		// bluejay custom event (user changes layout ratio)
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
			[0.1, 0.45],
			[0.47, 0.82],
			[0.88, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			darkTheme,
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
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
			spikes: true,
			range: dateRange.firstLast(),
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
		
		// y2 - IOP
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[2],
			title: 'IOP', 
			range: [0, 75],
			spikes: true,
		}, darkTheme );
		
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[3],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		// y4 - VFI
		const y4 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'VFI',
			range: [-30, 5],
			rightSide: 'y2',
			spikes: true,
		}, darkTheme );
		
		/*
		* Dynamic axis
		* VA axis depends on selected unit state
		*/
		const y1 = userSelecterUnits.selectedAxis();
		
		/**
		* Layout & Build - Eyes
		*/	
		if( myPlotly.has('right') ){
			
			plotlyInit({
				title: "Right Eye",
				eye: "right",
				colors: "rightEye",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3, y4 ],
				procedures: json.rightEye.procedures,
				targetIOP: json.rightEye.targetIOP,
				parentDOM: json.rightEye.dom,
			});
		} 
	
		if( myPlotly.has('left') ){
			
			plotlyInit({
				title: "Left Eye",
				eye: "left",
				colors: "leftEye",
				xaxis: x1, 
				yaxes: [ y0, y1, y2, y3, y4 ],
				procedures: json.leftEye.procedures,
				targetIOP: json.leftEye.targetIOP,
				parentDOM: json.leftEye.dom,
			});
		}
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotSummaryGlaucoma', init);	
	
		
})( bluejay ); 