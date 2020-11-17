(function ( bj ) {

	'use strict';
	
	const oesTemplateType = "Bar Percent Complete";
	
	// oe CSS theme!
	const darkTheme = oePlotly.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
		
		let percentIncomplete = json.percentComplete.map( p => 100 - p );
		
		const complete = {
			x: json.xAxis,
			y: json.percentComplete,
			name: '',		
			hovertemplate: 'Complete<br>%{y}%',
			type: 'bar'
		};
		
		const incomplete = {
			x: json.xAxis,
			y: percentIncomplete,
			name: '',		
			hovertemplate: 'Incomplete<br>%{y}%',
			type: 'bar'
		};
	
		/*
		Data trace array
		*/
		return [ complete, incomplete ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlotly.getLayout({
			darkTheme, // dark? 
			colors: 'posNeg',
			xaxis: setup.xaxis,
			yaxes: setup.yaxes,
		});
		
		// stack the 2 yaxis
		layout.barmode = 'stack';
			
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
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}

		/**
		* Data 
		*/
	
		const data = dataTraces( json );
		
		/**
		* Axes templates 
		*/
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 20,
		}, darkTheme );
		
		
		// y1
		const y1 = oePlotly.getAxis({
			type:'y', 
			range: [0, 100],
			numTicks: 20,
		}, darkTheme );
		
		/**
		* Layout & Build - Eyes
		*/	
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			data,
			xaxis: x1, 
			yaxes: [ y1 ],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotBarPercentComplete', init);	
	
		
})( bluejay ); 