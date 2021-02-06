(function( oePlot ) {
	
	'use strict';
	
	/**
	* Highlight a point (marker) on a plotly chart.
	* This allows external JS to change a specific marker to blue
	* It needs to be externally controlled because of OCT viewing
	* i.e. the OCT stack will be controlled by another JS module
	* but as you go through the stack the associated marker on the
	* plotly chart should be flagged blue.
	* 
	* oePlot broadcasts a hover or click event. External JS then 
	* uses this to highlight the marker. It is returned from an init
	* in a template. see IDG Glaucoma OCT demo
	*/
	
	
	/**
	* Initiate with link to oePlot
	* @param {Map} myPlotly - to target
	* @returns {Function} for external API use
	*/
	oePlot.highlightPoint = ( myPlotly ) => {
		
		/**
		* External API 
		* @param {String} flattened objects e.g 'leftEye.OCT'
		* @param {Number} index of point
		*/
		return ( flattenedObj, indexPoint ) => {
			
			// find trace obj from flattened Object path
			let objPath = flattenedObj.split('.');
			
			if(objPath.length != 2){
				bj.log('oePlot - for highlightPoint to work it need side and trace name: "leftEye.OCT" ');
				return;
			}
			
			let eyeSide = objPath[0];
			let dataTraceName = objPath[1];
			let traceData, traceIndex;
			let i = 0;
			/*
			Have to loop through because i need an index ref to the array 
			passed in when Plotly is built
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
			1) create an array of colors for ALL markers in trace in default eye colour
			2) set specific marker colour to blue
			3) re-layout	
			*/
			let eyeColor = oePlot.getColor( eyeSide, oePlot.isDarkTheme() );
			let markerColors = [];
			for( let i=0; i < traceData.x.length; i++ ){
				markerColors.push( eyeColor );
			}
			// set specific marker to blue
			markerColors[ indexPoint ] = oePlot.getColor( 'highlight', oePlot.isDarkTheme() );
			
			// get marker style for event type 
			let markerObj = oePlot.markerFor( traceData.oeEventType ); // added on creation of trace
			// add colors
			markerObj.color = markerColors;
			
			/**
			* RESTYLE Plotly directly!!
			*/
			Plotly.restyle( myPlotly.get( eyeSide ).get('div'), { 'marker': markerObj }, [ traceIndex ]);	
		};
	};
	
})( bluejay.namespace('oePlot'));