(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Glaucoma";
	
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
		
		const VA_offScale = {
			x: eye.va.offScale.x,
			y: eye.va.offScale.y,
			name: eye.va.offScale.name,		
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
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
				
		const IOP = {
			x: eye.IOP.x,
			y: eye.IOP.y,
			name: eye.IOP.name,		
			yaxis: 'y3',
			hovertemplate: 'IOP: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		dateRange.add( eye.va.offScale.x );
		dateRange.add( eye.va.snellenMetre.x );
		dateRange.add( eye.IOP.x );
		
		/**
		Build Drugs data for right eye
		*/
		const drugs = [];
		//const arr = Object.values( eye.drugs );
		// loop through array...
		Object.values( eye.drugs ).forEach(( drug ) => {			
			drugs.push({
				x: drug.x, 
				y: drug.y, 
				customdata: drug.customdata,
				name:'', 
				yaxis: 'y4',
				hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
				type: 'scatter', 
				mode: 'lines+markers',
				marker: oePlotly.markerFor('drug')
			});
			
			dateRange.add( drug.x );
		});
		
		return [ VA_offScale, VA_SnellenMetre, IOP ].concat( drugs );		
	};
	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlotly.getLayout({
			theme: window.oeThemeMode, 
			legend: false,
			colors: setup.colors,
			plotTitle: setup.title,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			subplot: 4,		// offScale, VA, IOP, meds 
			rangeSlider: dateRange.firstLast(),
			dateRangeButtons: true,
			vLineLabel: {
				x: Object.values( setup.procedures ),
				h: 0.85,
			},
			hLineLabel: {
				y: Object.values( setup.targetIOP ),
				axis: 'y3'
			}
		});
			
		const div = oePlotly.buildDiv(`${oesTemplateType}-${setup.eye}Eye`, '80vh', '850px');
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
			spikes: true,
			range: dateRange.firstLast(),
		}, dark );
		
		
		// y0 - offscale 
		const y0 = oePlotly.getAxis({
			type:'y',
			domain: [0, 0.1], 
			useCategories: {
				showAll: true, 
				categoryarray: json.rightEye.va.offScale.yaxis.reverse()
			},
			spikes: true,
		}, dark );
		
		// y1 - VA
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: [0.1, 0.45],
			title: 'VA', 
			useCategories: {
				showAll: true, 
				categoryarray: json.rightEye.va.snellenMetre.yaxis.reverse()
			},
			spikes: true,
		}, dark );
		
		// y2 - IOP
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: [0.5, 0.85],
			title: 'IOP', 
			range: [0, 75],
			spikes: true,
		}, dark );
		
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: [0.88, 1],
			useCategories: {
				showAll: true, 
				categoryarray: json.drugTypes.reverse()
			},
			spikes: true,
		}, dark );
		
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
				yaxes: [ y0, y1, y2, y3 ],
				procedures: json.rightEye.procedures,
				targetIOP: json.rightEye.targetIOP,
				parentDOM: '.oes-left-side',
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
				yaxes: [ y0, y1, y2, y3 ],
				procedures: json.leftEye.procedures,
				targetIOP: json.leftEye.targetIOP,
				parentDOM: '.oes-right-side',
			});
		}
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('oesGlaucoma', init);	
		
})( bluejay ); 