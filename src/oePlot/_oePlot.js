/**
* oePlot - a "black box" to correctly and consistently display
* all plot.ly charts. All required data for a chart is passed
* in to the appropriate blueJS template (in agreed JSON format) and 
* oePlotly will style and theme it correctly for plot.ly
* 
* This replaces a previous, simpler oePlotly helper in "newblue" 
* see: newblue/plotlyJS/oePlotly_v1.js
*
* https://plot.ly/javascript/reference/
* @namespace "oeplot"
* Note: this approach completely replaces the old "oePlotly" layout helper
*/
(function( bj, oePlot ){

	'use strict';
	
	bj.log('Plot.ly version: ' + Plotly.version );
	
	/**
	* oePlot styles plotly based on OE theme mode
	* However, I can not just style based on this, as oePlot might
	* be used in "pro" area (such as patient popup)
	* @returns {Boolean}
	*/
	oePlot.isDarkTheme = () => window.oeThemeMode === "dark" ? true : false;	
	
	/**
	* Theme colours
	*/
	const colours = {
		dark: {
			blue:'#63d7d6',
			highlight:'#fff',
			green: '#65d235',
			red: '#ea2b34',
			greenSeries: ['#65d235', '#A5D712','#02B546'],
			redSeries: ['#ea2b34','#F64A2D','#C92845'],
			yellowSeries: ['#FAD94B','#E8B131','#F1F555'], // BEO (Both Eyes Open)
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#1472DE','#2E4259'],
		}, 
		light: {
			blue: '#00f',
			highlight:'#000',
			green: '#418c20',
			red: '#da3e43',
			greenSeries: ['#418c20','#598617','#139149'],
			redSeries: ['#da3e43', '#E64C02', '#E64562'],
			yellowSeries: ['#FCCE14','#E69812','#FCBB21'], // BEO
			standard: ['#0a4198', '#1451b3', '#175ece'],
			varied: ['#0a2aea', '#ea0a8e', '#00b827','#890aea'],
			dual: ['#2126C2','#8FAEC2'],
		}
	};
	
	/**
	* Get oe "blue"
	* @param {Boolean} dark 
	* @returns {Array} of colour series
	*/
	oePlot.getBlue = ( dark ) => dark ? colours.dark.blue : colours.light.blue;
	
	/**
	* Get color series
	* @param {String} colour name
	* @param {Boolean} darkTheme 
	* @returns {Array} of colour series
	*/
	oePlot.getColorSeries = ( colorName, darkTheme ) => {
		let colorWay = null;
		const dark = colours.dark;
		const light = colours.light; 
		
		switch( colorName ){
			case "varied": 
				colorWay = darkTheme ? dark.varied : light.varied;
			break;	
			case "posNeg": 
				colorWay = darkTheme ? dark.dual : light.dual;   // assumes Postive trace is first! 
			break;
			case "rightEyeSeries": 
				colorWay = darkTheme ? dark.greenSeries : light.greenSeries;
			break; 
			case "leftEyeSeries": 
				colorWay = darkTheme ? dark.redSeries : light.redSeries;
			break; 
			case "BEOSeries": 
				colorWay = darkTheme ? dark.yellowSeries : light.yellowSeries;
			break; 
			
			default: 
				colorWay = darkTheme ? dark.standard : light.standard;
		}	
		
		return colorWay;
	};
	
	/**
	* Some elements require colour setting to be made
	* in the data (trace) objects. This provides a way to 
	* theme and standardise 
	* @param {String} colour type e.g. "error_y"  for: error_y.color 
	* @param {Boolean} dark
	* @returns {String} colour for request element (or "pink" if fails)
	*/
	oePlot.getColor = ( colour, dark ) => {
		switch( colour ){
			case 'highlight': return dark ? colours.dark.highlight : colours.light.highlight; 
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			//case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Temporary support added for IDG Glaucoma Visual Fields Demo which is still
	* using oePlot directly (until I have time to rebuild it!) 
	*/ 
	oePlot.getColorFor = ( color, dark ) => getColor( color, dark );
	

})( bluejay, bluejay.namespace('oePlot'));
