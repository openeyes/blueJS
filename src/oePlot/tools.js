(function( bj, oePlot ) {
	
	'use strict';
	
	oePlot.tools = () => {
		
		const darkTheme = oePlot.isDarkTheme();  // which CSS theme is running?
		const toolbar = bj.div('oeplot-toolbar');
		let callback;
	
		const updatePlot = ( renderCallback ) => {
			callback = renderCallback;
		}
	
		/**
		* showToolbar (update DOM)
		* In OES the toolbar is fullwidth and fixed, requires "with-toolbar"
		* to add margin-bottom to not cover the plots
		*/
		const showToolbar = () => {
			const parent = document.querySelector('.oeplot');
			parent.classList.add('with-toolbar');
			parent.append( toolbar ); // reflow!
		};
		
		
		/**
		* Build <select> for user to choose units
		* @param {Array} options { key, option }
		* @param {String} prefix
		*/
		const showSelectableUnitsDropdown = ( options, prefix ) => {
			// Mustache template
			const template = [
				'<label>{{prefix}}</label>',
				'<select>',
				'{{#options}}',
				'<option value="{{key}}" {{#selected}}selected{{/selected}}>{{option}}</option>',
				'{{/options}}',
				'</select>'
			].join('');
			

			// build layout DOM
			const div = bj.div('plot-tool');
			div.innerHTML = Mustache.render( template, { options, prefix });
			toolbar.append( div );
			
			/*
			Set <select> option and listen for changes
			*/
			div.querySelector('select').addEventListener('change',  ( ev ) => {
				// update current selected
				const select = ev.target;
				selectableUnits.activeKey = select.options[ select.selectedIndex ].value
				callback('leftEye');
				callback('rightEye');
			}, { capture: true });
		};
		
		const selectableUnits = {
			traces: new Map(),
			axes: new Map(),
			activeKey: null,

			addAxes({ axisDefaults, yaxes:json, prefix }){
				const userOptions = [];
				
				for (const [ key, unit ] of Object.entries( json )) {
					
					if( unit.makeDefault ) this.activeKey = key;
					let axis; 
					
					userOptions.push({ key, option: unit.option, selected: unit.makeDefault }); // build options for <select> user dropdown
					
					axisDefaults.title = `${prefix} - ${unit.option}`;
					
					// based on the unit range type build axis, 
					// it's either numerical or categorical
					if( typeof unit.range[0] === 'number'){
						
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							range: unit.range.reverse(), 	// e.g. [n1, n2];
							axisType: "linear", 			// set the axis.type explicitly here
						}), darkTheme); 
						
					} else {
						// category axis
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							useCategories: {
								showAll: true, 
								categoryarray: unit.range.reverse()
							}
						}), darkTheme); 
					}
					
					// add the axis to unit axes
					this.axes.set( key, axis );
				}
				
				// provide user access to change the selectedable units
				showSelectableUnitsDropdown( userOptions, prefix );
			}, 
			
			addTrace( eye, key, trace ){
				if( !this.traces.has( eye )) this.traces.set( eye, new Map());
				this.traces.get( eye ).set( key, trace );
			}, 
			
			getTrace( eye, key ){
				return this.traces.get( eye ).get( this.activeKey );
			},
			getAxis( key ){
				return this.axes.get( this.activeKey );
			}			
		};
	
		/*
		API
		*/
		return {
			updatePlot,
			showToolbar,
			selectableUnits,
		};
	};

	
		
})( bluejay, bluejay.namespace('oePlot'));