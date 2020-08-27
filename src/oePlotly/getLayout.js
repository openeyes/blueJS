(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build Plotly layout: colours and layout based on theme and standardised settings
	* @param {Object} options - quick reminder of 'options':
	* @returns {Object} layout themed for Plot.ly
	*
	Options:
	{
		darkTheme: "dark",  	// Required {Boolean} oePlotly Theme  
		legend: false, 			// Optional {Boolean || Object} customise any of the defaults
		colors: 'varied', 		// Optional {String} varied" or "twoPosNeg" or "rightEye" (defaults to "blues")
		plotTitle: false, 		// Optional {String}
		xaxis: x1,				// Required {Object} xaxis
		yaxes: [ y1 ],			// Required {Array} all yaxes
		subplot: false,			// Optional {Number} number of 'rows' (number of verical plots)
		vLineLabel: false		// Optional {Object} e.g. { x: [ ... ], h: 0.75 }
		hLineLabel: false		// Optional {Object} e.g. { y: [ ... ], axis: 'y2' }
		rangeslider: false,		// Optional {Boolean || Array} e.g. [firstDate, lastDate]
		dateRangeButtons: false // Optional {Boolean}
	}
	*/
	oePlotly.getLayout = function( options ){
		// set up layout colours based on OE theme settings: "dark" or "light"
		const dark = options.darkTheme;
		
		// build the Plotly layout obj
		let layout = {
			isDark: dark, // store OE dark theme in layout
			hovermode:'closest', // get single point rather than all of them
			autosize:true, // onResize change chart size
			margin: {
				l:50, // 80 default, if Y axis has a title this will need more
				r:50, // change if y2 axis is added (see below)
				t:30, // if there is a title will need upping to 60
				b:40, // allow for xaxis title
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
		Colour theme	
		*/ 
		if( options.colors ){
			layout.colorway = oePlotly.getColorSeries( options.colors, dark );			
		} else {
			layout.colorway = oePlotly.getColorSeries( "default", dark );
		}
		
		/*
		Plot title
		*/
		if( options.plotTitle ){
			layout.title = {
				text: options.plotTitle,
				xref: 'paper', //  "container" | "paper" (as in, align too)
				yref: 'container', 
				x: 0, // 0 - 1
				y: 1,
				yanchor: 'top',
				pad: {
					t: 20 // px gap from top 
 				},
				font: {
					size: 15,
					// color:'#f00' - can override base font
				}, 		
			};
			// adjust the margin area
			layout.margin.t = 50;
		}
		
		/*
		Plot legend
		*/
		if( options.legend ){
			
			layout.showlegend = true; // default is true. 
			// basic set up for legend
			// note: if "legendgroup" is add to the data traces
			// the legends will be automatically grouped
			const legendDefaults = {
				font: {
					size: 9
				},
				itemclick: 'toggleothers', //  ( default: "toggle" | "toggleothers" | false )
 				orientation: 'h', // 'v' || 'h'		
				// traceorder: "grouped", // or "reversed+grouped"		
				xanchor:'right',
				yanchor:'bottom',
				x:1,
				y:1,
			};
			
			if( typeof options.legend === "boolean"){
				layout.legend = legendDefaults;
			} else {
				// customise the defaults
				layout.legend = Object.assign( legendDefaults, options.legend );				
			}
		} else {
			layout.showlegend = false; // defaults to true otherwise
		}
		
		
		/*
		Subplots (n charts on a single plot)
		Assumes always vertically stacked
		*/
		if( options.subplot ){
			layout.grid = {
		    	rows: options.subplot,
				columns: 1,
				pattern: 'independent',
			};
		}
		
		/*
		Shapes and Annotations
		*/
		layout.shapes = [];
		layout.annotations = [];
		
		/*
		Vertical marker line
		{array} = [{x:x, y:1, name:"name"}]
		*/
		if( options.vLineLabel ){
			
			// vLineLabel must be an array of objects
			const verticals = options.vLineLabel.x;
			const height = options.vLineLabel.h;
		
			const line = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'above', // or "below"
			      yref: 'paper', // this means y & y0 are ratios of area (paper)
			      x0: my.x,
			      y0: 0,
			      x1: my.x,
			      y1: height,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 0.5,
					//dash:"3px,4px,1px,4px,3px,1px",
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
				   y: height 
			    };
			}; 
			
			// Add verticals
			layout.shapes = layout.shapes.concat( verticals.map( line ));
		    layout.annotations = layout.annotations.concat( verticals.map( annotate ));
		}
		
		/*
		Horizontal marker line
		{array} = [{ axis:'y3', y:15, name: "Target IOP"}]
		*/
		if( options.hLineLabel ){
			
			// hLineLabel must be an array of objects
			const horizontals = options.hLineLabel.y;
			const axis = options.hLineLabel.axis;
			
			// expecting an array of objects here
			const line = ( my, index ) => {
				return {
			      type: 'line',
			      layer: 'below', // or "below"
			      xref: "paper", // this means x & x0 are ratios of area (paper)
			      yref: axis, // assign to a yaxis
			      x0: 0,
			      y0: my.y,
			      x1: 1,
			      y1: my.y,
			      line: {
			        color: oePlotly.getBlue( dark ),
			        width: 2,
			        dash:"3px,12px",
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
				   yshift: 8, // shift over so label isnt' too close to the axis 
				   yref: axis, // this means y is ratio of area (paper)
				   y: my.y 
			    };
			}; 
			
			// Add horizontals
			layout.shapes = layout.shapes.concat( horizontals.map( line ));
		    layout.annotations = layout.annotations.concat( horizontals.map( annotate ));
		}
		
		/*
		X & Y Axes
		*/
		if( options.xaxis ){
			layout.xaxis = options.xaxis; // only 1 axis per layout
			
			if( layout.xaxis.title ){
				layout.margin.b = 80;
			}
		}
		
		if( options.yaxes ){
			options.yaxes.forEach((y, index) => {
				if( index ){
					layout['yaxis'+(index + 1)] = y;
				} else {
					layout.yaxis = y;
				}
				
				if( y.title ){
					if( y.side == 'right' ){
						layout.margin.r = 80; // make spare for Y on the right?
					} else {
						layout.margin.l = 80; // make space for Y title
					}
				}	
			});
		}
		
		/*
		Add range slider to xaxis
		*/
		if(options.rangeSlider){
			
			const rangeslider = {
				thickness: 0.08
			};
			
			if(dark){
				// this is a pain. Plot.ly does not handles this well
				// can't find a setting to change the slide cover color!
				// it's set at a black opacity, so to make it usable...
				rangeslider.bgcolor = layout.paper_bgcolor;
				rangeslider.borderwidth = 1;
				rangeslider.bordercolor = layout.plot_bgcolor;
			} 
			
			
			/*
			if not a boolean assume a range array
			note: there is bug in Plot.ly (known) that this won't
			restrict the range, but it helps with the dateRangebuttons
			*/
			if( typeof options.rangeSlider !== "boolean" ){
				rangeslider.range = options.rangeSlider; 
			}
			
			// update layout:
			layout.xaxis.rangeslider = rangeslider;
			layout.margin.b = 15;
		}
		
		if( options.dateRangeButtons ){
			layout.xaxis.rangeselector = Object.assign({
				x:1,
				xanchor: 'right',
				buttons: [{
					label: 'Show all',
					step: "all",
				}, {
					label: '2 Yr',
					step: "year",
					count: 2, // 1 = year, 2 = 2 years
				}, {
					label: '1 Yr',
					step: "year",
					count: 1, // 1 = year, 2 = 2 years
				}, {
					label: '6 Mth',
					step: "month",
					count: 6, // 1 = year, 2 = 2 years
				}]
			}, oePlotly.buttonStyling( dark ) );
		}
		
		// ok, all done
		return layout;
	};
	
	
})( oePlotly );