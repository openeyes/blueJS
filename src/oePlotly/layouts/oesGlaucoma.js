(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Glaucoma";
	
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
			x: eyeJSON.va.offScale.x,
			y: eyeJSON.va.offScale.y,
			name: eyeJSON.va.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		dateRange.add( eyeJSON.va.offScale.x );
		
		const VFI = {
			x: eyeJSON.va.VFI.x,
			y: eyeJSON.va.VFI.y,
			name: eyeJSON.va.VFI.name,	
			yaxis: 'y5',	
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		dateRange.add( eyeJSON.va.VFI.x );
		
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
		Object.values( eyeJSON.va.units ).forEach(( unit, index ) => {
			
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
		
		myPlotly.get( eyeSide ).set('data', all);
		
		return 	all;	
	};
	
	/**
	* React to user request to change VA scale 
	* (note: used as a callback by selectableUnits)
	* @param {String} which eye side?
	*/
	const plotlyReacts = ( eyeSide ) => {
		// get the eyeMap for the correct side
		let eyeMap = myPlotly.get( eyeSide );
		
		// update SPECIFIC data traces in data array = [n]
		eyeMap.get('data')[2] = userSelecterUnits.selectedTrace( eyeSide );
		
		// update layout specific axis
		eyeMap.get('layout').yaxis2 = Object.assign({}, userSelecterUnits.selectedAxis());

		// build new (or rebuild)
		Plotly.react(
			eyeMap.get('div'), 
			eyeMap.get('data'), 
			eyeMap.get('layout'), 
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
			theme: window.oeThemeMode, 
			legend: {
				//orientation: 'v',
				traceorder: "reversed",
				//xanchor:'left',
				yanchor:'bottom',
				//x:1.01,
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

		// oe CSS theme!
		const dark = oePlotly.isDarkTheme( window.oeThemeMode );
		
		// for all subplot rows
		const domainRow = [
			[0, 0.08],
			[0.1, 0.45],
			[0.47, 0.82],
			[0.88, 1],
		];
		
		// user selectable units for VA units:
		userSelecterUnits.init({
			plotlyUpdate: plotlyReacts,
			axisDefaults: {
				type:'y',
				domain: domainRow[1],
				title: 'VA',  // prefix for title
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges ),
			dark
		});
		
		/**
		* Data 
		*/
		let rightEye_data = null;
		let leftEye_data = null;
		
		if( json.rightEye ){
			rightEye_data = dataTraces( json.rightEye, 'right' );
		}
		
		if( json.leftEye ){
			leftEye_data = dataTraces( json.leftEye, 'left' );
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
		}, dark );
		
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[0], 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.offScale.reverse()
			},
			spikes: true,
		}, dark );
		
		// y2 - IOP
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[2],
			title: 'IOP', 
			range: [0, 75],
			spikes: true,
		}, dark );
		
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[3],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, dark );
		
		// y4 - VFI
		const y4 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1],
			title: 'VFI',
			range: [-30, 5],
			rightSide: 'y2',
			spikes: true,
		}, dark );
		
		/*
		* Dynamic axis
		* y1 - VA axis depends on selected unit state
		*/
		const y1 = userSelecterUnits.selectedAxis();
		
		/**
		* Layout & Build - Right Eye
		*/	
		if( rightEye_data ){
			
			plotlyInit({
				data: rightEye_data,
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
		
		/**
		* Layout & Build -  Left Eye
		*/
		if( leftEye_data ){
			
			plotlyInit({
				data: leftEye_data,
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