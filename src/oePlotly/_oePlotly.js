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
			greenSeries: ['#65d235', '#94d712', '#36be8d', '#099f18', '#9bd727'],
			red: '#ea2b34',
			redSeries: ['#ea2b34','#F65B20','#D41C81','#D4341C'],
			standard: ['#1451b3', '#175ece', '#1a69e5'],
			varied:  ['#0a83ea', '#18949f', '#781cea','#3f0aea'],
			dual: ['#3f0aea','#7b3131'],
		}, 
		light: {
			blue: '#00f',
			green: '#418c20',
			greenSeries: ['#418c20','#99991C','#1DA323','#74A31D','#1C9944'],
			red: '#da3e43',
			redSeries: ['#da3e43', '#F0379A', '#E66735', '#F05037'],
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
			
			default: return 'pink'; // no match, flag failure to match as pink!
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
	* return settings for "marker" style in data
	* @param {String} type: "Drugs", etc 
	* @returns {Object}
	*/
	const markerFor = ( type ) => {
		if( type == "image"){
			return {
				symbol: "triangle-down",
				size: 10
			};
		}
		if( type == "drug"){
			return {
				symbol: "star-diamond",
				size: 9
			};
		}
		
		return {}; // unknown type?
	};
	
	const buttonStyling = ( dark ) => ({
		font: {
			color: dark ? '#ccc' : '#666',
		},
		bgcolor: dark ? 'rgb(30,46,66)' : 'rgb(255,255,255)', 
		activecolor: dark ? 'rgb(7,69,152)' : 'rgb(205,205,255)',
		bordercolor: dark ? 'rgb(10,26,36))' : 'rgb(255,255,255)',
		borderwidth: 2,
	}); 
	

	/**
	* Add Plotly dropdown to layouta
	* @param {Objec} layout
	*/
	const addDropDown = ( layout ) => {
	
		let buttons = [];
			
		buttons.push({ 	
			method: 'update', // 'data' & 'layout'
			args: ['visible', [true, false, false, false]],
			label: 'Option 1'						
		});
		
		buttons.push({ 	
			method: 'update', // update args: [data, layout] 
			// 'args' is an 
			args: [ {}, {
			    title: 'some new title', // updates the title
			    colorway: oePlotly.getColorSeries( "default", true )
			}],
			//args2: layout,
			label: 'Options Title'						
		});
	
 		let menu = Object.assign({
			type: "dropdown",
			xanchor: 'left',
			yanchor: 'top',
			x: 0,
			y: 0.35,
			buttons: buttons, // add buttons to menu
 		}, oePlotly.buttonStyling() );
 		
		
		// could be multiple menus
		layout.updatemenus = [ menu ];	
	};
	

	// public 
	return {
		isDarkTheme,
		getBlue,
		getColorSeries, 
		getColorFor,
		dashedLine,
		markerFor,
		addDropDown,
		buttonStyling
	};

})( bluejay );
