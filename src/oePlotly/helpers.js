(function( oePlotly, bj ) {
	
	'use strict';
	
	/**
	* Build DIV
	* @param {String} id
	* @param {String} height (80vh)
	* @param {String} min-height (500px)
	* @returns {Element}
	*/
	oePlotly.buildDiv = ( id, height, minHeight ) => {
		const div = document.createElement('div');
		/*
		ID is just a regular string (Template type)
		*/
		let divID = id.toLowerCase();
		divID = divID.trim();
		divID = divID.replace(' ','-');
		// build <div>
		div.id = `oePlotly-${divID}`;
		div.style.height = height;
		div.style.minHeight = minHeight;
		return div;
	};
	
	/**
	* For use in layout templates
	* Helper to work out first and last dates
	* @returns {Object} 
	*/
	oePlotly.fullDateRange = () => ({
		all:[], 
		add( xArr ){
			this.all = this.all.concat( xArr );
			this.all.sort();
		}, 
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
	oePlotly.addClickEvent = ( div, eye ) => {
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
					
		    bj.customEvent('oePlotlyClick', obj );
		    bj.log('"oePlotlyClick" Event data: ' + JSON.stringify( obj ));
		});
	};
	
	/**
	* Hover events
	* @param {Element} Plot DOM element
	* @param {String} eye side
	*/
	oePlotly.addHoverEvent = ( div, eye ) => {
		bj.log('"oePlotlyHover" ('+eye+') Event available (click point to see data structure)');
		
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
					
		    bj.customEvent('oePlotlyHover', obj );
		});
	};
	
	
	/**
	* return setting for line in data
	* when multiple Eye data traces are added 
	* to a single plot they need to style themselves
	* @params {Object} args
	* @returns {Object} 'line'
	*/
	oePlotly.dataLine = ( args ) => {
		let line = {};
		if( args.color )	line.color = args.color;
		if( args.dashed )	line = Object.assign( line, oePlotly.dashedLine());
		return line;
	};
	
	/**
	* return settings for dashed "line" style in data
	* @returns {Object}
	*/
	oePlotly.dashedLine = () => {
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
	oePlotly.markerFor = ( type ) => {
		const marker = {};
		
		switch( type){
			case 'image':
				marker.symbol = "triangle-down";
				marker.size = 10;
			break;
			case 'drug':
				marker.symbol = "diamond";
				marker.size = 8;
			break;
			case 'injection':
				marker.symbol = "star-diamond";
				marker.size = 9;
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
	oePlotly.eventStyle = ( type, color=false ) => {
		const style = {
			marker: oePlotly.markerFor( type )
		};
		
		switch( type ){
			case 'image':
				style.mode = "markers";
			break;
			case 'drug':
				style.mode = "lines+markers";
				style.line = {
					width: 3,
				};
			break;
			case 'injection':
				style.mode = "markers";
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
	oePlotly.buttonStyling = ( dark ) => ({
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
	oePlotly.addDropDown = ( layout ) => {
	
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

	
})( oePlotly, bluejay );