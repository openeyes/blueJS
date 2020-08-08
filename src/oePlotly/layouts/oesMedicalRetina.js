(function ( bj ) {

	'use strict';
	
	/**
	* Build data trace format for Glaucoma
	* @param { JSON } Eye data
	* @returns {Array} for Plol.ly data
	*/
	const dataTraces = ( eye ) => {
		
		const CRT = {
			x: eye.CRT.x,
			y: eye.CRT.y,
			name: eye.CRT.name,		
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
			line: oePlotly.dashedLine(),
		};
		
		const VA_SnellenMetre = {
			x: eye.va.snellenMetre.x,
			y: eye.va.snellenMetre.y,
			name: eye.va.snellenMetre.name,	
			yaxis: 'y2',	
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		/**
		Build Events data for right eye
		*/
		const events = [];
		const arr = Object.values( eye.events );
		// loop through array...
		arr.forEach(( event ) => {
			events.push({
				x: event.x, 
				y: event.y, 
				customdata: event.customdata,
				name:'', 
				yaxis: 'y3',
				hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
				type: 'scatter', 
				mode: 'markers',
				marker: oePlotly.markerFor( event.type )
			});
		});
		
		return [ CRT, VA_SnellenMetre ].concat( events );
				
	};
	
	/**
	* Build DIV
	* @param {String} id
	*/
	const buildDiv = ( id ) => {
		const div = document.createElement('div');
		div.id = `oePlotly-${id}`;
		div.style.height = "70vh";
		div.style.minHeight = "500px";
		return div;
	};
	
	/**
	* init demo - needs to be called from the PHP page that needs it
	*/
	const init = ( json = null ) => {
		
		const oesTemplateType = "Medical Retina";
		
		if(json === null){
			bj.log(`[oePlotly] - no JSON data provided for Plot.ly ${oesTemplateType} ??`);
			return false;
		} else {
			bj.log(`[oePlotly] - building Plot.ly ${oesTemplateType}`);
		}
		
		/**
		* Axis templates 
		*/
		
		const dark = oePlotly.isDarkTheme( window.oeThemeMode );
		
		// x1
		const x1 = oePlotly.getAxis({
			type:'x',
			numTicks: 10,
			useDates: true, 
			spikes: true,
		}, dark );
		
		// y1 - CRT
		const y1 = oePlotly.getAxis({
			type:'y',
			domain: [0, 0.7],
			title: 'CRT', 
			range: [200, 650],
			spikes: true,
		}, dark );
		
		// y2 - VA
		const y2 = oePlotly.getAxis({
			type:'y',
			rightSide: true,
			domain: [0, 0.7],
			title: 'VA', 
			useCategories: {
				showAll: true, 
				categoryarray: json.rightEye.va.snellenMetre.yaxis.reverse()
			},
			spikes: true,
		}, dark );
	
		// y3 - Drugs
		const y3 = oePlotly.getAxis({
			type:'y',
			domain: [0.8, 1],
			useCategories: {
				showAll: true, 
				categoryarray: json.events.reverse()
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
				subplot: 2,
				rangeSlider: true,
			});
			
			const leftDiv = buildDiv(`${oesTemplateType}RightEye`);
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
				subplot: 2,
				xaxis: x1,
				yaxes: [ y1, y2, y3 ],
				rangeSlider: true,
			});
			
			const rightDiv = buildDiv(`${oesTemplateType}LeftEye`);
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
	bj.extend('oesMedicalRetina', init);	
		
})( bluejay ); 