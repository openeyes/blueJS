(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Init with template layout properties
	*/
	oePlotly.highlighPoint = ( myPlotly, darkTheme ) => {
		
		/**
		* External API 
		* (note: used as a callback by selectableUnits)
		* @param {String} flattened objects e.g 'leftEye.OCT'
		* @param {Number} index of point
		*/
		return ( flattenedObj, indexPoint ) => {
			
			// find trace obj from flattened Object path
			let objPath = flattenedObj.split('.');
			
			if(objPath.length != 2){
				bj.log('oePlotly - for highlightPoint to work it needs EyeSide & Date JSON name e.g. "leftEye.OCT" ');
				return;
			}
			
			let eyeSide = objPath[0];
			let dataTraceName = objPath[1];
			let traceData, traceIndex;
			let i = 0;
			/*
			Have to loop through because i need an index ref to the array 
			passed in when Plotly is built: see plotlyReacts below
			*/
			myPlotly.get( eyeSide ).get('data').forEach((value, key) => {
				if( key === dataTraceName ){
					traceData = value;
					traceIndex = i;
				}
				i++;
			});
			
			/*
			Need do a bit of work with this.
			1) create an array of colors for ALL marks in trace in default eye colour
			2) set specific marker colour to blue
			3) relayout	
			*/
			let eyeColor = oePlotly.getColor( eyeSide, darkTheme );
			let markerColors = [];
			for( let i=0; i < traceData.x.length; i++ ){
				markerColors.push( eyeColor );
			}
			// set specific marker to blue
			markerColors[ indexPoint ] = oePlotly.getColor( 'highlight', darkTheme );
			
			// get marker style for event type 
			let markerObj = oePlotly.markerFor( traceData.oeEventType ); // added on creation of trace
			// add colors
			markerObj.color = markerColors;
			
			/**
			* Update Plotly 
			*/
			Plotly.restyle( myPlotly.get( eyeSide ).get('div'), { 'marker': markerObj }, [ traceIndex ]);	
		};
	};
	
})( oePlotly );