(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build Plotly layout: colours and layout based on theme and standardised settings
	* @param {Object} options - quick reminder of 'options':
	* @returns {Object} layout themed for Plot.ly
	* All options...
	{
		theme: "dark",  		// OE Theme  
		colors: 'varied', 		// Optional {String} varied" or "twoPosNeg" or "rightEye" (defaults to "blues")
		plotTitle: false, 		// Optional {String}
		legend: true, 			// Required {Boolean}
		titleX: false, 			// Optional {String}
		titleY: false, 			// Optional {String}
		numTicksX: 20, 			// Optional {Number}
		numTicksY: 20, 			// Optional	{Number}
		rangeX: false, 			// Optional {Array} e.g. [0, 100]
		rangeY: false, 			// Optional {Array} e.g. [0, 100]
		useCategories: 			// Optional {Object} e.g. {showAll:true, categoryarray:[]}
		y2: false,				// Optional {Object} e.g {title: "y2 title", range: [0, 100], useCategories: {showAll:true, categoryarray:[]}}
		rangeslider: false,		// Optional {Boolean}
		zoom: true, 			// Optional {Boolean}
		subplot: false,			// Optional {Boolean}
		domain: false, 			// Optional {Array} e.g. [0, 0.75] (if subplot)
		spikes: false, 			// Optional {Boolean} 
		vLineMarker: false		// Optional {Boolean} or Array of objects e.g. [{x:x, y:1, name:"name"}]
	}
	*/
	oePlotly.getLayout = function( options ){
		// set up layout colours based on OE theme settings: "dark" or "light"
		const dark = oePlotly.isDarkTheme( options.theme );
		
		// build the Plotly layout obj
		let layout = {
			hovermode:'closest', // get single point rather than all of them
			autosize:true, // onResize change chart size
			margin: {
				l:60, // 80 default, if Y axis has a title this will need more
				r:60, // change if y2 axis is added (see below)
				t:30, // if there is a title will need upping to 60
				b:80, // allow for xaxis title
				pad:4, // px between plotting area and the axis lines
				autoexpand:true, // auto margin expansion computations
			},
			// Paper = chart area. Set at opacity 0.5 for both, to hide the 'paper' set to: 0
			paper_bgcolor: dark ? 'rgba(30,46,66,0.5)' : 'rgba(255,255,255,0.5)',
			
			// actual plot area
			plot_bgcolor: dark ? 'rgb(10,10,30)' : '#fff',
			
			// base font settings
			font: {
				family: "Roboto, 'Open Sans', verdana, arial, sans-serif",
				size: 11,
				color: dark ? '#aaa' : '#333',
			},
			
			// legend?
			showlegend: options.legend,
			// if so, it will be like this:
			legend: {
				font: {
					size: 10
				},
				orientation: 'h', // 'v' || 'h'				
				xanchor:'right',
				yanchor:'top',
				x:1,
				y:1,
			}, 
			
			// default set up for hoverlabels
			hoverlabel: {
				bgcolor: dark ? "#003" : '#fff',
				bordercolor: dark ? '#003' : '#00f',
				font: {
					size: 11, // override base font
					color: oePlotly.getBlue( dark ),
				}
			},
			
		};
	
		/*
		Colour themes!	
		*/ 
		if(options.colors){
			layout.colorway = oePlotly.getColorSeries( options.colors, dark );			
		} else {
			layout.colorway = oePlotly.getColorSeries( "default", dark );
		}
		
		/*
		Plot title
		*/
		if(options.plotTitle){
			layout.title = {
				text: options.plotTitle,
				xref: 'paper', //  "container" | "paper" (as in, align too)
				yref: 'container', 
				x: 0, // 0 - 1
				y: 0.97,
				font: {
					size: 15,
					// color:'#f00' - can override base font
				}, 		
			};
			// adjust the margin area
			layout.margin.t = 60;
		}
		
		/*
		Axes
		*/
		let axis = oePlotly.defaultAxis( {}, dark );
		
		// spikes
		if(options.spikes){
			axis.showspikes = true; 
			axis.spikecolor = dark ? '#0ff' : '#00f';
			axis.spikethickness = dark ? 0.5 : 1;
			axis.spikedash = dark ? "1px,3px" : "2px,3px";
		}

		// set up X & Y axis
		layout.xaxis = Object.assign({}, axis); 
		layout.xaxis.nticks = options.numTicksX;
		
		layout.yaxis = Object.assign({} ,axis); 
		layout.yaxis.nticks = options.numTicksY;
		
		// turn off zoom?
		if(options.zoom === false){
			layout.xaxis.fixedrange = true;
			layout.yaxis.fixedrange = true;
		}
		
		// manually set axes data range
		if(options.rangeX){
			layout.xaxis.range = options.rangeX;
		}
		
		if(options.rangeY){
			layout.yaxis.range = options.rangeY;
		}
		
		// categories (assuming this will only be used for yAxis)
		if(options.useCategories){
			layout.yaxis = oePlotly.makeCategoryAxis( layout.yaxis, options.useCategories.categoryarray, options.useCategories.showAll);
		}
		
		// OE data formatting
		if(options.datesOnAxis){
			switch(options.datesOnAxis){
				case "x": layout.xaxis.tickformat = "%e %b %Y";
				break; 
				case "y": layout.yaxis.tickformat = "%e %b %Y";
				break; 
			}	
		}
			
		// add titles to Axes?
		if(options.titleX){
			layout.xaxis.title = {
				text: options.titleX,
				standoff:20, // px offset 
				font: {
					size: 12,
				}
			};
		}
		
		if(options.titleY){
			layout.yaxis.title = {
				text: options.titleY,
				standoff: 15, // px offset 
				font: {
					size: 12,
				}
			};
			// make space for Y title
			layout.margin.l = 80;
		}
		
		// two Y axes? 
		if(options.y2){
			
			layout.yaxis2 = Object.assign({}, axis);
			layout.yaxis2.nticks = options.numTicksY;
			layout.yaxis2.overlaying = 'y';
			layout.yaxis2.side = 'right';
			layout.yaxis2.showgrid = false;
			
			if(options.y2.range){
				layout.yaxis2.range = options.y2.range; 
			}
			
			// categories
			if(options.y2.useCategories){
				layout.yaxis2 = oePlotly.makeCategoryAxis( layout.yaxis2, options.y2.useCategories.categoryarray, options.y2.useCategories.showAll );
			}


			// and need a title as well??
			if(options.y2.title){
				layout.yaxis2.title = {
					text: options.y2.title,
					standoff: 15, // px offset 
					font: {
						size: 12,
					}
				};
				// make space for Y title
				layout.margin.r = 80;
			}
		}
		
		/*
		Subplots (2 charts on a single plot)
		*/
		if(options.subplot){
			layout.grid = {
		    	rows: 2,
				columns: 1,
				pattern: 'independent',
			};
			
			layout.yaxis.domain = options.domain;
			if(layout.yaxis2){
				layout.yaxis2.domain = options.domain;
			}
		}
		
		
		/*
		Shapes and Annotations! 
		*/
		
		let layoutShapes = [];
		let layoutAnnotate = [];
		
		/*
		Vertical marker line
		{array} = [{x:x, y:1, name:"name"}]
		*/
		if(options.vLineMarker){
			// vLineMarker must be an array of objects
			
			const shape = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'below', // or "below"
			      yref: 'paper', // this means y & y0 are ratios of area (paper)
			      x0: my.x,
			      y0: 0,
			      x1: my.x,
			      y1: my.y,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 1,
					dash:"3px,1px",
			      }
			    };
			}; 
			const annotate = ( my, index ) => {
				return {
				   showarrow: false,
				   text: my.name,
				   textangle: 90,
				   align: "left",
				   font: {
					   color: oePlotly.getBlue( dark )
				   },
				   borderpad: 2,
				   x: my.x,
				   xshift: 8, // shift over so label isnt' on line? 
				   yref: "paper", // this means y is ratio of area (paper)
				   y: my.y 
			    };
			}; 
			
			// Add verticals
			layoutShapes = layoutShapes.concat( options.vLineMarker.map( shape ));
		    layoutAnnotate = layoutAnnotate.concat( options.vLineMarker.map( annotate ));
		}
		
		/*
		Horizontal marker line
		{array} = [{ axis:'y3', y:15, name: "Target IOP"}]
		*/
		if(options.hLineMarker){
			
			// expecting an array of objects here
			const shape = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'below', // or "below"
			      xref: "paper", // this means x & x0 are ratios of area (paper)
			      yref: my.axis, 
			      x0: 0,
			      y0: my.y,
			      x1: 1,
			      y1: my.y,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 2,
			        dash:"3px,9px",
			      }
			    };
			}; 
			const annotate = ( my, index ) => {
				return {
				   showarrow: false,
				   text: my.name,
				   align: "left",
				   font: {
					   color: oePlotly.getBlue( dark )
				   },
				   borderpad: 2,
				   xref: "paper",
				   x:0,
				   yshift: 8, // shift over so label isnt' on line? 
				   yref: my.axis, // this means y is ratio of area (paper)
				   y: my.y 
			    };
			}; 
			
			// Add horizontals
			layoutShapes = layoutShapes.concat( options.hLineMarker.map( shape ));
		    layoutAnnotate = layoutAnnotate.concat( options.hLineMarker.map( annotate ));
		}
		
		// update layout
		layout.shapes = layoutShapes;
		layout.annotations = layoutAnnotate;
		
		
		
		// add range slider
		if(options.rangeslider){
			if(dark){
				// this is a pain.
				// can't find a setting to change the slide cover color!
				// it's set at a black opacity, so to make this usable:
				layout.xaxis.rangeslider = {
					bgcolor: layout.paper_bgcolor,
					borderwidth: 1,
					bordercolor: layout.plot_bgcolor,
					thickness: 0.1, // 0 - 1, default 0.15 (height of area)
				};
			} else {
				// Plot.ly handles this well in 'light' theme mode
				layout.xaxis.rangeslider = {
					thickness: 0.1, // 0 - 1, default 0.15 (height of area)
				};
			}
			// adjust the margin because it looks better:
			layout.margin.b = 40;
		}
		
		// ok, all done
		return layout;
	};
	
	
})( oePlotly );