(function( bj, oePlot ) {
	
	'use strict';
	
	/**
	* Build DIV
	* @param {String} hook - CSS hook for plot (just in case it's needed)
	* @returns {Element} <div>;
	*/
	oePlot.buildDiv = ( hook, width=false ) => {
		const div = bj.div('oeplot-wrap');
		div.classList.add( hook.toLowerCase());
		// force plotly to layout it's SVG container at the right width?
		if( width ) div.style.width = width;
		return div;
	};
	
	/**
	* Helper to work out first and last dates.
	* There is (was?) a bug in Plot.ly (known!) to do with the Navigator range
	* this helps fix that that issue, but it seems fixed in latest version 
	* @returns {Object} 
	*/
	oePlot.fullDateRange = () => ({
		all:[], 
		// pass in array of dates
		add( xArr ){
			this.all = this.all.concat( xArr );
			this.all.sort();
		}, 
		// used in the layout e.g: rangeSlider: helpers.dateRange.firstLast()
		// used on the xaxis e.g. range: helpers.dateRange.firstLast(),
		firstLast(){
			// watch out for null values
			let noNulls = this.all.filter(( i ) => i !== null );
			return [ noNulls[0], noNulls.pop() ];	
		},
	});
	
	/**
	* Click events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/ 
	oePlot.addClickEvent = ( div, eye ) => {
		div.on('plotly_click', function( data ){
			const point = data.points[0];
			// pass back the JSON data relavant to the data clicked
			let obj = {
				eye,
				name: point.data.name,
				index: point.pointIndex,
				x: point.x,
				y: point.y 
			};
					
		    bj.customEvent('oePlotClick', obj );
		    bj.log('"oePlotClick" Event data: ' + JSON.stringify( obj ));
		});
	};
	
	/**
	* Hover events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/
	oePlot.addHoverEvent = ( div, eye ) => {
		div.on('plotly_hover', function( data ){
			const point = data.points[0];
			// pass back the JSON data relavant to the data clicked
			let obj = {
				eye,
				name: point.data.name,
				index: point.pointIndex,
				x: point.x,
				y: point.y 
			};
					
		    bj.customEvent('oePlotHover', obj );
		});
	};
	
	
	/**
	* return setting for line in data
	* when multiple Eye data traces are added 
	* to a single plot they need to style themselves
	* @params {Object} args
	* @returns {Object} 'line'
	*/
	oePlot.dataLine = ( args ) => {
		let line = {};
		if( args.color )	line.color = args.color;
		if( args.dashed )	line = Object.assign( line, oePlot.dashedLine());
		return line;
	};
	
	/**
	* return settings for dashed "line" style in data
	* @returns {Object}
	*/
	oePlot.dashedLine = () => {
		return {
			dash: "2px,2px",
			width: 2,
		};
	};

	/**
	* return settings for "marker" style in data
	* @param {String} Event type: "Drugs", etc 
	* @returns {Object}
	*/
	oePlot.markerFor = ( type ) => {
		const marker = {};
		
		switch( type){
			case 'managment':
				marker.symbol = "square";
				marker.size = 9;
			break;
			case 'image':
				marker.symbol = "triangle-down";
				marker.size = 11;
			break;
			case 'drug':
				marker.symbol = "diamond";
				marker.size = 9;
			break;
			case 'injection':
				marker.symbol = "star-diamond";
				marker.size = 10;
			break; 
		}
		
		return marker;
	};
	
	
	/**
	* Consistent buttons styling
	* @param {String} type - 'image', 'drug', 'injection'  
	* @param {String} color - if data is styling itself
	* @returns {Object}
	*/
	oePlot.eventStyle = ( type, color=false ) => {
		const style = {
			marker: oePlot.markerFor( type )
		};
		
		switch( type ){
			case 'managment':
			case 'image':
			case 'injection':
				style.mode = "markers";
			break;
			case 'drug':
				style.mode = "lines+markers";
				style.line = {
					width: 3,
				};
			break; 
		}
		
		// add color, but preserve other properties
		if( color ){
			if( style.marker ) style.marker.color = color;
			if( style.line ) style.line.color = color;
		}
		
		return style;
	}; 
	
	/**
	* Consistent buttons styling
	* @param {Boolean} dark  
	* @returns {Object}
	*/
	oePlot.buttonStyling = ( dark ) => ({
		font: {
			color: dark ? '#ccc' : '#666',
		},
		bgcolor: dark ? 'rgb(30,46,66)' : 'rgb(255,255,255)', 
		activecolor: dark ? 'rgb(7,69,152)' : 'rgb(225,225,225)',
		bordercolor: dark ? 'rgb(10,26,36))' : 'rgb(255,255,255)',
		borderwidth: 2,
	}); 
	

	/**
	* Add Plotly dropdown to layouta
	* @param {Objec} layout
	*/
	oePlot.addDropDown = ( layout ) => {
	
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
			    colorway: oePlot.getColorSeries( "default", true )
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
 		}, oePlot.buttonStyling() );
 		
		
		// could be multiple menus
		layout.updatemenus = [ menu ];	
	};

	
})( bluejay, bluejay.namespace('oePlot'));