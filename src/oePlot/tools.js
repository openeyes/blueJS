(function( bj, oePlot ) {
	
	'use strict';
	
	oePlot.tools = () => {
		
		const toolbar = bj.div('oeplot-toolbar');
	
		/**
		* Update the associated oePlot
		* User changes to the tools require a re-rendering of the plot
		* There may be 2 plots. e.g. "rightEye", "leftEye".
		*/
		const plot = {
			_render: null, 
			_plots: null,
			setReacts( plotlyReacts, names = false ){
				this._render = plotlyReacts;
				this._plots = names;
			},
			update(){
				this._plots.forEach( plot => this._render( plot ));
			}
		};	
		
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
		* Tabular data is provide by the PHP. It adds a <table> hidden
		* in the DOM. It's ID is passed into oePlot with the JSON
		* Here it's moved into a proper popup
		*/
		const tabularData = {
			_popup: null,
			/**
			* Move the <table> into popup DOM and build a button in the toolbar
			* @param {String} tableID
			*/
			add( tableID ){
				const popup = bj.div('oe-popup-wrap');
				this._popup = popup;
				
				popup.innerHTML = [
					'<div class="oe-popup">',
					'<div class="title">Tabular Data of plots</div>',
					'<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>',
					'<div class="oe-popup-content max"></div>',
					'</div>',
				].join('');
				
				const table = document.getElementById( tableID );
				popup.querySelector('.oe-popup-content').append( table ); // move <table> out of DOM and into the popup:
				bj.show( table );	
				
				// add a button to the toolbar
				const div = bj.div('plot-tool');
				const button = document.createElement('button');
				button.textContent = "View tabular data of plots";
				div.append( button );
				
				button.addEventListener('click', ( ev ) => {
					ev.preventDefault();
					ev.stopPropagation();
					this.show(); // all it can do it show. popup-wrap covers it
 				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}, 
			show(){
				document.body.append( this._popup );
				this._popup.querySelector('.close-icon-btn').addEventListener("mousedown", ( ev ) => {
					ev.stopPropagation();
					this.hide();
				}, {once:true} );
			}, 
			hide(){
				this._popup.remove();
			}
		};
		
		/**
		* Expose the plotly API for hoverMode options
		* Allows users to choose, but defaults to DA preferred option
		*/
		const hoverMode = {
			_mode: 'closest', // 'closest', // "x" | "y" | "closest" | false | "x unified" | "y unified"
			getMode(){
				return this._mode;	
			},
			add(){
				const div = bj.div('plot-tool');
				div.innerHTML = Mustache.render([
					'<label>Labels</label>',
					'<select>{{#options}}',
					'<option value="{{key}}" {{#selected}}selected{{/selected}}>{{option}}</option>',
					'{{/options}}</select>'
				].join(''), {
					options: [
						{ key: 'closest', option: 'Single', selected: true },
						{ key: 'x', option: 'Closest', selected: false },
						{ key: 'x unified', option: 'Grouped', selected: false },
					],
				});
				
				div.querySelector('select').addEventListener('change',  ( ev ) => {
					const select = ev.target;
					this._mode = select.options[ select.selectedIndex ].value;
					plot.update();
				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}
		};
		
		/**
		* User selectable units
		* Need to store the traces and the axies to update plotly
		*/
		const selectableUnits = {
			traces: new Map(),
			axes: new Map(),
			activeKey: null, // store the current activeKey
			
			/**
			Getters
			Traces will depend on the eye side
			Axis is the same for each eye side
			*/
			getTrace( eye, key ){
				return this.traces.get( eye ).get( this.activeKey );
			},
			getAxis( key ){
				return this.axes.get( this.activeKey );
			},
			
			/**
			* Setters
			*
			* addTrace, the trace object is built in the template
			* @param {String} eye - e.g. "rightEye" or "leftEye"
			* @param {String} key - the array 'key' from the JSON
			* @param {Object} trace - plotly trace object
			*/
			addTrace( eye, key, trace ){
				if( !this.traces.has( eye )) this.traces.set( eye, new Map());
				this.traces.get( eye ).set( key, trace );
			}, 

			/**
			* addAxes (same for both eye side)
			* @param {Object} deconstructed:
			* - axisDefaults are the defaults needed
			* - yaxes: the JSON from PHP
			* - prefix: e.g. "VA"
			*/
			addAxes({ axisDefaults, yaxes:json, prefix }){
				// store the user options for the dropdown UI
				const selectOptions = [];
				
				// loop through the JSON
				for( const [ key, unit ] of Object.entries( json )){
					
					// default unit?
					if( unit.makeDefault ) this.activeKey = key;
					
					// axis title
					axisDefaults.title = `${prefix} - ${unit.option}`;
					
					// based on the unit range type build axis:
					let axis; 
					if( typeof unit.range[0] === 'number'){
						// number range
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							range: unit.range, 	// e.g. [n1, n2];
							axisType: "linear", 			// set the axis.type explicitly here
						}), oePlot.isDarkTheme()); 
						
					} else {
						// category axis
						axis = oePlot.getAxis( Object.assign({}, axisDefaults, {
							useCategories: {
								showAll: true, 
								categoryarray: unit.range
							}
						}), oePlot.isDarkTheme()); 
					}
					
					// add the axis to unit axes
					this.axes.set( key, axis );
					// add to user options
					selectOptions.push({ key, option: unit.option, selected: unit.makeDefault });
				}
				
				this.buildDropDown( selectOptions, prefix );
			}, 
			
			/**
			* Build <select> for user to choose units
			* @param {Array} options { key, option }
			* @param {String} prefix
			*/
			buildDropDown( options, prefix ){
				const div = bj.div('plot-tool');
				div.innerHTML = Mustache.render([
					'<label>{{prefix}}</label>',
					'<select>{{#options}}',
					'<option value="{{key}}" {{#selected}}selected{{/selected}}>{{option}}</option>',
					'{{/options}}</select>'
				].join(''), { options, prefix });
				
				div.querySelector('select').addEventListener('change',  ( ev ) => {
					const select = ev.target;
					this.activeKey = select.options[ select.selectedIndex ].value;
					plot.update();
				}, { capture: true });
				
				// add to the toolbar
				toolbar.append( div );
			}, 
			
			/**
			* If there is a theme change these colours in the Axes need changing
			*/
			updateAxesColors(){
				const axesIterator = this.axes.values();
				for( const axis of axesIterator ){
					axis.gridcolor = oePlot.axisGridColor( oePlot.isDarkTheme());
					axis.tickcolor = oePlot.axisTickColor( oePlot.isDarkTheme());
				}
			},
			
			/**
			* If there is a theme change traces are rebuilt
			*/
			clearTraces(){
				this.traces.clear();
			}			
		};
	
		/*
		API
		*/
		return {
			plot,
			tabularData,
			hoverMode,
			selectableUnits,
			showToolbar,
		};
	};

	
		
})( bluejay, bluejay.namespace('oePlot'));