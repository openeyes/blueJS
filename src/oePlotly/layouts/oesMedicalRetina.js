(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Medical Retina";
	
	/**
	* Work out full date range for all data
	*/
	const dateRange = oePlotly.fullDateRange();
	
	/**
	* Build data trace format for Glaucoma
	* @param { JSON } Eye data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( eye ) => {
		
		const CRT = {
			x: eye.CRT.x,
			y: eye.CRT.y,
			name: eye.CRT.name,		
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		const VA_SnellenMetre = {
			x: eye.va.snellenMetre.x,
			y: eye.va.snellenMetre.y,
			name: eye.va.snellenMetre.name,	
			yaxis: 'y2',	
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		dateRange.add( eye.CRT.x );
		dateRange.add( eye.va.snellenMetre.x );
		
		/**
		Build Events data for right eye
		*/
		const events = [];
		// loop through array...
		Object.values( eye.events ).forEach(( event ) => {
			
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
		
		return [ CRT, VA_SnellenMetre ].concat( events );
				
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlotly.getLayout({
			theme: window.oeThemeMode, 
			legend: {
				yanchor:'bottom',
				y:0.71,
			},
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 2,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${setup.eye}Eye`, '70vh', '600px');
		document.querySelector( setup.parentDOM ).appendChild( div );
		
		Plotly.newPlot(
			div, 
			setup.data, 
			layout, 
			{ displayModeBar: false, responsive: true }
		);
		
		// set up click through
		oePlotly.addClickEvent( div );
		
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
		
		/**
		* Data 
		*/
		let rightEye_data = null;
		let leftEye_data = null;
		
		if( json.rightEye ){
			rightEye_data = dataTraces( json.rightEye );
		}
		
		if( json.leftEye ){
			leftEye_data = dataTraces( json.leftEye );
		}

		/**
		* Axes templates 
		*/
		const dark = oePlotly.isDarkTheme( window.oeThemeMode );
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true,
			range: dateRange.firstLast(), 
			spikes: true,
		}, dark );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: [0, 0.7],
			title: 'CRT', 
			range: [200, 650],
			spikes: true,
		}, dark );
		
		// y2 - VA
		const y2 = oePlotly.getAxis({
			type:'y',
			rightSide: 'y1',
			domain: [0, 0.7],
			title: 'VA', 
			useCategories: {
				showAll: true, 
				categoryarray: json.yaxis.snellenMetre.reverse()
			},
			spikes: true,
		}, dark );
	
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: [0.8, 1],
			useCategories: {
				showAll: true, 
				categoryarray: json.eventTypes.reverse()
			},
			spikes: true,
		}, dark );
		
		/**
		* Layout & Build  - Right Eye
		*/	
		if( rightEye_data ){
			
			plotlyInit({
				data: rightEye_data,
				title: "Right Eye",
				eye: "right",
				colors: "rightEye",
				xaxis: x1, 
				yaxes: [ y1, y2, y3 ],
				parentDOM: '.oes-left-side',
			});	
		} 
		
		/**
		* Layout & Build - Left Eye
		*/
		if( leftEye_data ){
			
			plotlyInit({
				data: leftEye_data,
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