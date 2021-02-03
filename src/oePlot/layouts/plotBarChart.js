(function( bj, oePlot ){

	'use strict';
	
	const oesTemplateType = "Bar Chart";
	
	// oe CSS theme!
	const darkTheme = oePlot.isDarkTheme();

	/**
	* Build data trace format for Glaucoma
	* @param {JSON} json data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( json ) => {
	
		const trace = {
			y: json.data.y,
			name: json.data.name,		
			type: 'bar'
		};
		
		// optional settings
		
		if( json.data.x ){
			trace.x = json.data.x;
		}
		
		if( json.data.hovertemplate ){
			trace.hovertemplate = json.data.hovertemplate;
		}
		
		/*
		Data trace array
		*/
		return [ trace ];			
	};

	
	/**
	* build layout and initialise Plotly 
	* @param {Object} setup
	*/
	const plotlyInit = ( setup ) => {
		
		const layout = oePlot.getLayout({
			darkTheme, // dark? 
			plotTitle: setup.title,
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
			numTicks: 20,
		}, darkTheme );
		
		// y1
		const y1 = oePlot.getAxis({
			type:'y', 
			numTicks: 20,
		}, darkTheme );
		
		// optional
		if( json.title.xaxis ){
			x1.title = json.title.xaxis;
		}
		
		if( json.title.yaxis ){
			y1.title = json.title.yaxis;
		}
		
		
		/**
		* Layout & Build - Eyes
		*/	
		console.log( json );
		
		plotlyInit({
			div: document.querySelector( json.dom ),
			title: json.title.plot,
			data,
			xaxis: x1, 
			yaxes: [ y1 ],
		});
		
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('plotBarChart', init);	
	
		
})( bluejay, bluejay.namespace('oePlot')); 