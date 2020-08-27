(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Patient Popup"; // used in ID for div
	
	// oe CSS theme - fixed, because in Patient Popup
	const darkTheme = true; 
	
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
		
		
		const VA = {
			x: eyeJSON.VA.units.x,
			y: eyeJSON.VA.units.y,
			name: eyeJSON.VA.units.name,
			yaxis: 'y3',		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dataLine({
				color: getColour()
			}),
		};
				
		myPlotly.get( eyeSide ).get('data').set( 'VA', VA );

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
		let eyeKeys = ['rightEye', 'leftEye' ];
		let data = [];
		
		eyeKeys.forEach(( key ) => {
			if( myPlotly.has( key )){
				
				let eyePlot = myPlotly.get( key ).get('data'); 
				// build the Data array
				data = data.concat( Array.from( eyePlot.values()) );
			}
		}); 
		
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
				yanchor:'top',
				y:1,
			},
			//plotTitle: 'Right, Left and BEO',
			xaxis: axes.x,
			yaxes: axes.y,
			subplot: 2,	 // offScale, VA 
		});
		
		/*
		For the popup I couldn't get plotly to resize to available width
		without adding a specific width!	
		*/
		const div = oePlotly.buildDiv(`${oesTemplateType}`, '415px', '415px', '1020px'); // 1020px best guess based on 1280px layout
		document.getElementById('patient-popup-oeplolty').appendChild( div );
		
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
			[0.2, 1],
		];
		
		/**
		* Data 
		* Combined Plot. Colours have to get set on the data!
		*/
		if( json.rightEye ){
			myPlotly.set('rightEye', new Map());
			buildDataTraces( json.rightEye, 'rightEye',
				oePlotly.getColorSeries('rightEyeSeries', darkTheme)
			);
		}
		
		if( json.leftEye ){
			myPlotly.set('leftEye', new Map());
			buildDataTraces( json.leftEye, 'leftEye', 
				oePlotly.getColorSeries('leftEyeSeries', darkTheme)
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
		
		// y2 - VA
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: domainRow[1], 
			title: 'VA',
			rightSide: 'y2',
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.unitRanges.snellenMetre.range.reverse()
			},
			spikes: true,
		}, darkTheme );
		
		
		plotlyInitCombined({
			x: x1, 
			y: [ y0, y1, y2 ],
		});	
		 
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotPatientPopup', init);	
		
})( bluejay ); 