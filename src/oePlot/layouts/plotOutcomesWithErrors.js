(function ( bj, oePlot ) {

	'use strict';
	
	const oesTemplateType = "Outcomes with Error bars";
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
		
		const VA = {
			x: json.VA.x,
			y: json.VA.y,
			name: 'VA',		
			hovertemplate: 'Mean ± SD<br>VA: %{y}<br>(N: %{x})',
			type: 'scatter',
			yaxis:'y1',
			error_y: {
			  type: 'data',
			  array: json.VA.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
		
		const IOP = {
			x: json.IOP.x,
			y: json.IOP.y,
			name: 'IOP',		
			hovertemplate: 'Mean ± SD<br>IOP: %{y}<br>(N: %{x})',
			type: 'scatter',
			yaxis:'y2',
			error_y: {
			  type: 'data',
			  array: json.IOP.error_y,
			  visible: true,
			  thickness: 0.5,
			}
		};
	
		/*
		Data trace array
		*/
		return [ VA, IOP ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			colors: 'varied',
			legend: true,
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
			rangeSlider: true,
		});
		
		// build new (or rebuild)
		Plotly.react(
			setup.div, 
			setup.data, 
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

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlot.getAxis({
			type:'x',
			title: 'Weeks',
			numTicks: 20,
			range: [-20, 220],
		}, darkTheme );
		
		
		// y1
		const y1 = oePlot.getAxis({
			type:'y', 
			title: 'VA (change) from baseline (LogMAR)',
			range: [70, 110],
			numTicks: 20,
		}, darkTheme );
		
		// y2
		const y2 = oePlot.getAxis({
			type:'y', 
			title: 'IOP (mm Hg))',
			rightSide: 'y1',
			numTicks: 20,
		}, darkTheme );
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			data,
			xaxis: x1, 
			yaxes: [ y1, y2],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotOutcomesWithErrors', init);	
	
		
})( bluejay, bluejay.namespace('oePlot')); 