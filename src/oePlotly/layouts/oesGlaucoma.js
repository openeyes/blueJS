(function ( bj ) {

	'use strict';
	
	/**
	* Build data trace format for Glaucoma
	* @param { JSON } Eye data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( eye ) => {
		
		const VA_SnellenMetre = {
			x: eye.va.snellenMetre.x,
			y: eye.va.snellenMetre.y,
			name: eye.va.snellenMetre.name,		
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const IOP = {
			x: eye.IOP.x,
			y: eye.IOP.y,
			name: eye.IOP.name,		
			yaxis: 'y2',
			hovertemplate: 'IOP: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		/**
		Build Drugs data for right eye
		*/
		const drugs = [];
		const arr = Object.values( eye.drugs );
		// loop through array...
		arr.forEach(( drug ) => {
			drugs.push({
				x: drug.x, 
				y: drug.y, 
				customdata: drug.customdata,
				name:'', 
				yaxis: 'y3',
				hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
				type: 'scatter', 
				mode: 'lines+markers',
				marker: oePlotly.markerFor('drug')
			});
		});
		
		return [ VA_SnellenMetre, IOP ].concat( drugs );
				
	};
	
	/**
	* Build DIV
	* @param {String} id
	*/
	const buildDiv = ( id ) => {
		const div = document.createElement('div');
		div.id = `oePlotly-${id}`;
		div.style.height = "calc(100vh - 150px)";
		div.style.minHeight = "850px";
		return div;
	};
	
	/**
	* init demo - needs to be called from the PHP page that needs it
	*/
	const init = ( json = null ) => {
		
		if(json === null){
			bj.log('[oePlotly] - no JSON data provided for Plot.ly Glaucoma?');
			return false;
		} else {
			bj.log('[oePlotly] - building Plot.ly Glaucoma');
		}
		
		/**
		* Axis templates 
		*/
		
		const dark = oePlotly.isDarkTheme( window.oeThemeMode );
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			domain: false,
			title: false, 
			numTicks: 10,
			useDates: true, 
			fixZoom: false,
			range: false,
			useCategories: false,
			spikes: true,
		}, dark );
		
		// y1 - VA
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: [0, 0.35],
			title: 'VA', 
			useCategories: {
				showAll: true, 
				categoryarray: json.rightEye.va.snellenMetre.yaxis.reverse()
			},
			spikes: true,
		}, dark );
		
		// y2 - IOP
		const y2 = oePlotly.getAxis({
			type:'y',
			domain: [0.4, 0.75],
			title: 'IOP', 
			range: [0, 75],
			spikes: true,
		}, dark );
		
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: [0.8, 1],
			useCategories: {
				showAll: true, 
				categoryarray: json.drugTypes.reverse()
			},
			spikes: true,
		}, dark );
		
		/**
		* Data & Layout - Right Eye
		*/	
		if( json.rightEye ){
			
			const rightEye_data = dataTraces( json.rightEye );
			
			const rightEye_layout = oePlotly.getLayout({
				theme: window.oeThemeMode, 
				legend: false,
				colors: 'rightEye',
				plotTitle: 'Right Eye',
				xaxis: x1,
				yaxes: [ y1, y2, y3 ],
				subplot: 3,
				rangeSlider: true,
				vLineLabel: {
					x: Object.values( json.rightEye.procedures ),
					h: 0.75,
				},
				hLineLabel: {
					y: Object.values( json.rightEye.targetIOP ),
					axis: 'y2'
				}
			});
			
			const leftDiv = buildDiv('glaucomaRightEye');
			document.querySelector('.oes-left-side').appendChild( leftDiv );
			
			Plotly.newPlot(
				leftDiv, 
				rightEye_data, 
				rightEye_layout, 
				{ displayModeBar: false, responsive: true }
			);
			
			// bluejay custom event (user changes layout)
			document.addEventListener('oesLayoutChange', () => {
				Plotly.relayout( leftDiv, rightEye_layout );
			});	
		} 
		
		/**
		* Data & Layout - Left Eye
		*/
		if( json.leftEye ){
			
			const leftEye_data = dataTraces( json.leftEye );
			
			const leftEye_layout = oePlotly.getLayout({
				theme: window.oeThemeMode, 
				legend: false,
				colors: 'leftEye',
				plotTitle: 'Left Eye',
				subplot: 3,
				xaxis: x1,
				yaxes: [ y1, y2, y3 ],
				rangeSlider: true,
				vLineLabel: {
					x: Object.values( json.leftEye.procedures ),
					h: 0.75,
				},
				hLineLabel: {
					y: Object.values( json.leftEye.targetIOP ),
					axis: 'y2'
				}
			});
			
			const rightDiv = buildDiv('glaucomaLeftEye');
			document.querySelector('.oes-right-side').appendChild( rightDiv );
			
			Plotly.newPlot(
				rightDiv, 
				leftEye_data, 
				leftEye_layout, 
				{ displayModeBar: false, responsive: true }
			);
			
			// bluejay custom event (user changes layout)
			document.addEventListener('oesLayoutChange', () => {
				Plotly.relayout( rightDiv, leftEye_layout );
			});	
		}
	};
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('oesGlaucoma', init);	
		
})( bluejay ); 