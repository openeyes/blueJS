(function( oePlot ) {
	
	'use strict';
	
	// tools need to use these colour helpers:
	oePlot.axisGridColor = ( dark ) => dark ? '#292929' : '#e6e6e6';
	oePlot.axisTickColor = ( dark ) => dark ? '#666' : '#ccc';
	
	/**
	* Build an axis object 
	* @param {Object} options - optional options for Axis
	* @param {Boolean} dark - use dark theme options?
	* @returns {Object} axis for layout
	*
	Options:
	{
		type: 'x' or 'y' 		// Required {String} axis 
		domain: false, 			// Optional {Array} e.g. [0, 0.75] (if subplot)
		title: false, 			// Optional {String}
		rightSide: false		// Options 	{String} - yAxis to overlay 'y'
		numTicks: false, 		// Optional {Number}
		useDates: false, 		// Options 	{Boolean}
		fixRange: false,		// Options 	{Boolean}
		range: false, 			// Optional {Array} e.g. [0, 100]
		axisType: false			// Optional {String} 
		useCategories: 			// Optional {Object} e.g. { showAll:true, categoryarray:[] }
		spikes: false, 			// Optional {Boolean}
		noMirrorLines: false	// Optional {Boolean}
	}
	*/
	
	
	oePlot.getAxis = function( options, dark ){ 
		
		// default 
		let axis = {
			linecolor: dark ? '#666' : '#999', // axis line colour
			linewidth:1,
			showgrid: true,
			gridcolor: oePlot.axisGridColor( dark ),
			tickmode: "auto",
			nticks: 10, // max. # of ticks. Actual # of ticks auto to be less than or equal to `nticks`. `tickmode` must be set to "auto".
			ticks: "outside",
			ticklen: 3, // px
			tickcolor: oePlot.axisTickColor( dark ),
			automargin: true, //  long tick labels automatically grow the figure margins.
			mirror: true, //  ( true | "ticks" | false | "all" | "allticks" )
			connectgaps: false, // this allows for 'null' value gaps! 
		};
		
		// axis? x or y
		const isY = options.type == 'y' ? true : false; 
		
		// balance axis lines on other side of plot area
		if( options.noMirrorLines ){
			axis.mirror = false;
		}
		
		// subplot?
		if( options.domain && isY ){
			axis.domain = options.domain;
		}
		
		// add titles to Axes?
		if( options.title ){
			axis.title = {
				text: options.title,
				standoff: isY ? 10 : 20, // px offset 
				font: {
					size: 12,
				}
			};
		}
		
		// mirror Y axis (left one has priority)
		if( options.rightSide && isY ){
			axis.overlaying = options.rightSide; // set to y1, y2, etc
			axis.side = 'right';
			axis.showgrid = false;
			axis.zeroline = false;
			axis.title.standoff = 15;
		}
		
		// set nticks
		if( options.maxAxisTicks ){
			axis.nticks = options.maxAxisTicks;
		}
		
		// use Dates? - OE data formatting
		if( options.useDates ){
			axis.tickformat = "%b %Y"; // d Mth Y	
		}
	
		// turn off zoom?
		if( options.fixRange ){
			axis.fixedrange = true;
		}
		
		// manually set axes data range
		if(options.range){
			axis.range = options.range;
		}
		
		// set range type... other wise Plotly will figure it out
		if(options.axisType){
			axis.type = options.axisType;
		}
		
		// categories (assuming this will only be used for yAxis)
		if(options.useCategories){
			let arr = options.useCategories.categoryarray;
			
			axis.type = "category";
			axis.categoryarray = arr;
			/*
			Category range. Each category is assigned a serial number from zero in the order it appears
			Using the "range" options I can "pad" the axis out or have fit the plot exactly
			*/
			if( options.useCategories.rangeFit ){
				switch( options.useCategories.rangeFit ){
					case "exact":		axis.range = [ 0, arr.length-1 ]; break;
					case "pad":			axis.range = [ -1, arr.length ]; break; 
					case "padTop":		axis.range = [ 0, arr.length ]; break;
					case "padBottom":	axis.range = [ -1, arr.length-1 ]; break; 
				}
			}
		}

		// spikes
		if(options.spikes){
			axis.showspikes = true; 
			axis.spikecolor = dark ? '#0ff' : '#00f';
			axis.spikethickness = dark ? 0.5 : 1;
			axis.spikedash = dark ? "1px,3px" : "2px,3px";
		}
		
		return axis;
	};
	
	
})( bluejay.namespace('oePlot'));