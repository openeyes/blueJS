/**
* Using "oePloyly" as namespace
* @namespace
*/
const oePlotly = (function ( bj ) {

	'use strict';
	
	bj.log('[oePlotly]');
	
	
	const colours = {
		electricBlue: '#63d7d6',
		dark: {
			green: '#65d235',
			greenSeries: ['#65d235', '#94d712', '#36be8d', '#099f18', '#9bd727'],
			red: '#ea2b34',
			redSeries: ['#ea2b34','#D41C81','#F65B20','#D4341C'],
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#3f0aea','#7b3131'],
		}, 
		light: {
			green: '#418c20',
			greenSeries: ['#418c20','#99991C','#1DA323','#74A31D','#1C9944'],
			red: '#da3e43',
			redSeries: ['#da3e43', '#F0379A', '#E66735', '#F05037'],
			standard: ['#0a4198', '#1451b3', '#175ece'],
			varied: ['#0a2aea', '#ea0a8e', '#00b827','#890aea'],
			dual: ['#0a4198','#874e4e'],
		}
	};
	
	const getElectricBlue = () => {
		return colours.electricBlue;
	};
	
	/**
	* Get color series
	* @param {String} colour name
	* @param {Boolean} dark 
	* @returns {Array} of colour series
	*/
	const getColorSeries = ( colorName, dark ) => {
		let colorWay = null;
		
		switch( colorName ){
			case "varied": colorWay = dark ?  colours.dark.varied : colours.light.varied;
			break;	
			case "twoPosNeg": colorWay = dark ?  colours.dark.dual : colours.light.dual;   // assumes Postive trace is first! 
			break;
			case "rightEye": colorWay = dark ?  colours.dark.greenSeries : colours.light.greenSeries;
			break; 
			case "leftEye": colorWay = dark ?  colours.dark.redSeries : colours.light.redSeries;
			break; 
			default: 
				colorWay = dark ? colours.dark.standard : colours.light.standard;
		}	
		
		return colorWay;
	};
	
	/**
	* Some elements require colour setting to be made
	* in the data (trace) objects. This provides a way to 
	* theme and standardise 
	* @param {String} colour type e.g. "error_y"  for: error_y.color 
	* @param {String} theme - OE Theme setting "dark" || "light"?
	* @returns {String} colour for request element (or "pink" if fails)
	*/
	const getColorFor = (plotlyElement, dark) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		switch(plotlyElement){
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: 
				return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Can not just set layout to dark theme bases on oeTheme setting
	* layout may be used in "pro" area (such as patient popup)
	* @param {String} theme
	* @returns {Boolean}
	*/
	const isDarkTheme = ( theme ) => {
		return theme === "dark" ? true : false;	
	};
	
	/**
	* return settings for "line" style in data
	* @param {Number} optional
	* @returns {Object}
	*/
	const dashedLine = ( n ) => {
		return {
			dash: "2px,2px",
			width: 2,
		};
	};
	
	/**
	* Build an axis object IN layout lines 
	* @param {Object} customise - overwrite or add to default settings
	* @param {Boolean} dark - use dark theme options?
	*/
	const defaultAxis = ( customise, dark ) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		let axisDefaults = {
			// color: '#fff', // override base font
			linecolor: dark ? '#666' : '#999', // axis line colour
			linewidth:1,
			showgrid: true,
			gridcolor: dark ? '#292929' : '#e6e6e6',
			
			tickmode: "auto",
			nticks: 50, // number of ticks
			ticks: "outside",
			ticklen: 3, // px
			tickcolor: dark ? '#666' : '#ccc',
			automargin: true, //  long tick labels automatically grow the figure margins.
			
			mirror: true, //  ( true | "ticks" | false | "all" | "allticks" )
		};
		
		return Object.assign( axisDefaults, customise );
	};
	
	/**
	* set up to show all catorgies or just the ones with data
	* @param {Object} axis
	* @param {Array} categories (for axis)
	* @param {Boolean} all - show all categories (even if they don't have data)
	* @returns {Object} updated axis
	*/
	const makeCategoryAxis = ( axis, categories, all = true ) => {
		axis.type = "category";
		axis.categoryarray = categories;
		if(all) axis.range = [0, categories.length];
		return axis; 
	};
	
	/**
	* Change layout properties
	* Right and Left plot layouts are identical except for titles and colours, so ...
	*/
	const changeTitle = ( layout, newTitle ) => {
		if( layout.title.text ){
			layout.title.text = newTitle;
		}	
	};
	
	const changeColorSeries = ( layout, colorSeries, dark ) => {
		if( typeof dark === "string" ){
			dark = isDarkTheme( dark );
		}
		
		layout.colorway = getColorSeries( colorSeries, dark );
	};
	
	// public 
	return {
		isDarkTheme,
		getElectricBlue,
		getColorSeries, 
		getColorFor,
		dashedLine,
		defaultAxis,
		makeCategoryAxis, 
		changeTitle,
		changeColorSeries
	};

})( bluejay );
