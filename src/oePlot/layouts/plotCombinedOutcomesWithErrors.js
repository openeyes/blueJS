(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Combined Medical Retina"; // used in ID for div
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();
	
	/**
	* Plotly parameters
	* Map top level parameters for each plot (R & L)
	*/
	const myPlotly = new Map();	
	
	
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
		
		const VA = {
			x: eyeJSON.VA.x,
			y: eyeJSON.VA.y,
			name: 'VA',		
			hovertemplate: 'Mean ± SD<br>VA: %{y}<br>(N: %{x})',
			type: 'scatter',
			mode: 'lines+markers',
			yaxis:'y2',
			line: oePlot.dataLine({
				color: getColour()
			}),
			error_y: {
			  type: 'data',
			  array: eyeJSON.VA.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		myPlotly.get( eyeSide ).get('data').set( 'VA', VA );
		
		const CRT = {
			x: eyeJSON.CRT.x,
			y: eyeJSON.CRT.y,
			name: 'CRT',		
			hovertemplate: 'Mean ± SD<br>CRT: %{y}<br>(N: %{x})',
			type: 'scatter',
			line: oePlot.dataLine({
				color: getColour(),
				dashed: true,
			}),
			error_y: {
			  type: 'data',
			  array: eyeJSON.CRT.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		
		myPlotly.get( eyeSide ).get('data').set( eyeJSON.CRT.name, CRT);

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
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			legend: true,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			rangeSlider: true,
		});
		
		// build the combined data for Left and Right into a single data array
		let data = [];
		
		['rightEye', 'leftEye'].forEach(( key ) => {
			
			if( myPlotly.has( key )){
				let eyePlot = myPlotly.get( key ).get('data'); 
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		});
		
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);	
	}; 
	
	
	/**
	* init - called from the PHP page that needs it
	* @param {JSON} json - PHP supplies the data for charts
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log(`[oePlot] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlot] - building Plot.ly ${oesTemplateType}`);
		}
		
		// for all subplot rows
		const domainRow = [
			[0, 0.15],
			[0.2, 1],
		];


		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye',
				oePlot.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlot.getColorSeries('leftEyeSeries', darkTheme)
			);
		}

		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			numTicks: 10,
			spikes: true,
			noMirrorLines: true,
		}, darkTheme );

		
		// y1 - CRT
		const y1 = oePlot.getAxis({
			type:'y',
			title: 'CRT', 
			range: json.yaxis.CRT, // hard coded range
			spikes: true,
		}, darkTheme );
		
		// y2 - VA (logMar or whatever is passed in)
		const y2 = oePlot.getAxis({
			type:'y',
			title: 'VA', 
			range: json.yaxis.VA, // hard coded range
			rightSide: 'y1',
			spikes: true,
		}, darkTheme );
		
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			xaxis: x1, 
			yaxes: [ y1, y2 ],
		});
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotCombinedOutcomesWithErrors', init);	
		
})( bluejay, bluejay.namespace('oePlot')); 