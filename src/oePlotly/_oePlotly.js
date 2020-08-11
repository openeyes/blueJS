/**
* Using "oePloyly" as namespace
* @namespace
*/
const oePlotly = (function ( bj ) {

	'use strict';
	
	bj.log('Plot.ly version: ' + Plotly.version );
	bj.log('oePlotly - Plot.ly layout builder');
	
	const colours = {
		dark: {
			blue:'#63d7d6',
			green: '#65d235',
			greenSeries: ['#65d235', '#A5D712', '#36be8d', '#02B546'],
			red: '#ea2b34',
			redSeries: ['#ea2b34','#F65B20','#D41C50','#D44304'],
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#3f0aea','#7b3131'],
		}, 
		light: {
			blue: '#00f',
			green: '#418c20',
			greenSeries: ['#418c20','#708017','#147019','#667D3C'],
			red: '#da3e43',
			redSeries: ['#da3e43', '#AB274A', '#BA4B2B', '#AB2C22'],
			standard: ['#0a4198', '#1451b3', '#175ece'],
			varied: ['#0a2aea', '#ea0a8e', '#00b827','#890aea'],
			dual: ['#0a4198','#874e4e'],
		}
	};
	
	/**
	* Get oe "blue"
	* @param {Boolean} dark 
	* @returns {Array} of colour series
	*/
	const getBlue = ( dark ) => {
		return dark ? colours.dark.blue : colours.light.blue ;
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
	* @param {Boolean} dark
	* @returns {String} colour for request element (or "pink" if fails)
	*/
	const getColorFor = ( plotlyElement, dark ) => {
		switch(plotlyElement){
			case 'rightEye': return dark ? colours.dark.green : colours.light.green;
			case 'leftEye': return dark ? colours.dark.red : colours.light.red;	
			case 'error_y': return dark ? '#5b6c77' : '#7da7cb';
			
			default: return 'pink'; // no match, flag failure to match as pink!
		}
	};
	
	/**
	* Can not just set layout to dark theme bases on oeTheme setting
	* layout may be used in "pro" area (such as patient popup)
	* @returns {Boolean}
	*/
	const isDarkTheme = () => {
		return window.oeThemeMode === "dark" ? true : false;	
	};
	
	// public 
	return {
		isDarkTheme,
		getBlue,
		getColorSeries, 
		getColorFor
	};

})( bluejay );
