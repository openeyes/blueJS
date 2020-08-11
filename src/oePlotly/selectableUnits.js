(function( oePlotly ) {
	
	'use strict';
	
	oePlotly.selectableUnits = () => {
		/*
		Either Right and Left Eye layouts
		Or just one eye.
		*/
		const traces = new Map();
		const axes = [];
		let updatePlotly;
		let selectedTraceIndex = 0;
		
		/**
		* Data traces are built first in templates
		* @param {String} eye - 'right' or 'left'
		* @param {Object} trace
		*/
		const addTrace = ( eye, trace ) => {
			if( traces.has( eye )){
				traces.get( eye ).push( trace );
			} else {
				traces.set( eye, [ trace ]);
			}
		};
		
		const getTrace = ( eye ) => {
			return traces.get( eye )[ selectedTraceIndex ];
		};
		
		const getAxis = () => {
			return axes[ selectedTraceIndex ];
		};
		
		
		/**
		* Controller for <select> changes
		* @param {Event} ev
		*/
		const handleUserChange = ( ev ) => {
			// update current selected
			selectedTraceIndex = ev.target.selectedIndex;	
			for (const eyeSide of traces.keys()) {
				updatePlotly( eyeSide );
			}
		};

		/**
		* Build <select> for user to choose units
		* @param {Array} options
		*/
		const buildDropDown = ( options ) => {
			// Mustache template
			const template = [
				'VA Scale ',
				'<select>',
				'{{#options}}',
				'<option>{{.}}</option>',
				'{{/options}}',
				'</select>'
			].join('');
		
			// build layout DOM
			const div = document.createElement('div');
			div.className = 'oesplotly-options'; // newblue provides styling for this class (but not positioning)
			div.innerHTML = Mustache.render( template, { 'options' : options });
			div.style.position = 'absolute';
			div.style.top = '1px';
			div.style.left = '50%';
			div.style.transform = 'translateX( -50% )';
			div.style.zIndex = 1;
			
			/*
			I think this is only used in OESscape so dump in 'oes-v2'
			note: if dropdown is for a single layout maybe use Plotly internal dropdown? 
			*/
			const oesV2 = document.querySelector('.oes-v2');
			oesV2.style.position = 'relative';
			oesV2.appendChild( div );
			
			
			/*
			Set <select> option and listen for changes
			*/
			let select = div.querySelector('select');
			select.options[ selectedTraceIndex ].selected = true;
			select.addEventListener('change', handleUserChange, false);
		};
		
		
		/**
		* init 
		* @param {Object} options e.g.
		* {
			plotlyUpdate: callback,
			axisDefaults: {
				type:'y',
				domain: [0.1, 0.46],
				title: 'VA', 
				spikes: true,
			}, 
			unitRanges: Object.values( json.yaxis.unitRanges )),
			dark
		}
		*/
		const init = ( options ) => {
			
			// callback for updating Plotly
			updatePlotly = options.plotlyUpdate; 

			const dark = options.dark;
			const axisDefault = options.axisDefaults;
			const title = axisDefault.title;
			const userOptions = [];
			
			/*
			loop through all unit ranges, build axes and options for <select>
			*/
			options.unitRanges.forEach(( unit, index ) => {
				// default units?
				if( unit.makeDefault ) selectedTraceIndex = index;
				
				// build options for <select> dropdown
				userOptions.push( unit.option );
				
				/*
				Build all the different Axes for the data traces	
				*/
				let newAxis;
				axisDefault.title = `${title} - ${unit.option}`;
				
				// the unit range will either be numerical or categories
				if( typeof unit.range[0] === 'number'){
					// numerical axis
					newAxis = Object.assign({}, axisDefault, {
						range: unit.range.reverse(), // e.g. [n1, n2];
						axisType: "linear", // set the axis.type explicitly here
					});
				} else {
					// category axis
					newAxis = Object.assign({}, axisDefault, {
						useCategories: {
							showAll: true, 
							categoryarray: unit.range.reverse()
						}
					});
				}
				
				// build axes array
				axes.push( oePlotly.getAxis( newAxis, dark ));
			});
	
			// now build dropdown
			buildDropDown( userOptions );	
		};
		
		/*
		public
		*/
		return {
			init,
			addTrace, 
			selectedTrace: getTrace,
			selectedAxis: getAxis,
		};
	};
	
		
})( oePlotly );