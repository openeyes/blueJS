(function ( bj ) {

	'use strict';
	
	/**
	* Data for IDG demo
	*/
	const dataTraces = ( eye ) => {
		
		const rightVA = {
			x: ['2013-12-07', '2014-05-06', '2014-06-03', '2014-07-01', '2014-07-29', '2014-09-19', '2015-02-24', '2015-05-12', '2020-08-05'],
			y: ['6/60', '1/60', '6/95', '6/95', '6/60', '6/95', '1/60', '2/60', '6/75'],
			yaxis: 'y2',
			name: 'VA',		
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const rightCRT = {
			x: ['2013-12-07', '2014-09-30', '2015-02-24', '2015-04-06'],
			y: [607, 437, 398, 248],
			name: 'CRT',
			line: oePlotly.dashedLine(),		
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const rightOCT = {
			x: ['2013-12-08', '2014-05-02', '2014-05-09', '2014-05-16', '2014-05-23', '2014-10-19', '2015-03-12', '2015-04-09'], 
			y: new Array(8).fill('OCT'), 
			name:'', 
			yaxis: 'y3',
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter', 
			mode: 'markers',
			marker: oePlotly.markerFor('image')
		};
		
		const rightLucentis = {
			x: ['2014-05-02', '2014-05-09', '2014-05-16'], 
			y: new Array(3).fill('Lucentis'), 
			name:'', 
			yaxis: 'y3',
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter', 
			mode: 'markers',
			marker: oePlotly.markerFor('drug')
		};
		
		const rightEylea = {
			x: ['2014-05-23', '2014-10-19', '2015-03-12', '2015-04-09'], 
			y: new Array(3).fill('Eylea'), 
			name:'', 
			yaxis: 'y3',
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter', 
			mode: 'markers',
			marker: oePlotly.markerFor('drug')
		};
		
		// Left 
		
		const leftVA = {
			x: ['2013-12-07', '2014-05-06', '2014-06-03', '2014-07-01', '2014-07-29', '2014-09-19', '2015-02-24', '2015-05-12', '2020-08-05'],
			y: ['6/9.5', '6/12', '6/12', '6/12', '6/12', '6/6', '6/9.5', '6/9.5', '6/7.5' ],
			yaxis: 'y2',
			name: 'VA',		
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter'
		};
		
		const leftCRT = {
			x: ['2013-12-07'],
			y: [248],
			name: 'CRT',
			line: oePlotly.dashedLine(),		
			hovertemplate: 'CRT: %{y}<br>%{x}',
			type: 'scatter'
		};
		
		const leftOCT = {
			x: ['2013-12-08', '2014-05-02', '2014-05-09', '2014-05-16', '2014-05-23', '2014-10-19', '2015-03-12', '2015-04-09'], 
			y: new Array(8).fill('OCT'), 
			name:'', 
			yaxis: 'y3',
			hovertemplate: '%{y}<br>%{x}',
			type: 'scatter', 
			mode: 'markers',
			marker: oePlotly.markerFor('image')
		};
		
		// return array depending on request
		if( eye == "right"){
			return [ rightVA, rightCRT, rightOCT, rightLucentis, rightEylea ];
		} else {
			return [ leftVA, leftCRT, leftOCT ];
		}		
	};
	
	/**
	* Build Layout object
	*/
	const buildRightLayout = ( title, colours ) => {
		// layout 
		return oePlotly.getLayout({
			theme: window.oeThemeMode, 
			legend: false,
			colors: colours,
			plotTitle: title,
			titleY: 'CRT (µm)', 
			numTicksX: 10,
			numTicksY: 20,
			rangeY: [200, 650],
			datesOnAxis: 'x', 
			y2: { 
				title: 'VA (Snellen Metre)',
				useCategories: {
					showAll: true, 
					categoryarray: ['6/3','6/4','6/5','6/6','6/7.5','6/9.5','6/12','6/15','6/18', '6/24','6/30','6/36','6/48','6/60','6/75','6/95','3/60','2/60', '1/60', 'CF', 'HM', 'PL', 'NPL'].reverse()
				},
			},
			rangeslider: true,
			subplot: true,
			domain: [0, 0.7], 
			spikes: true,
		});
	};
	
	/**
	* Build DIV
	*/
	const buildDiv = ( id ) => {
		const div = document.createElement('div');
		div.id = id;
		div.style.height = "calc(100vh - 150px)";
		div.style.minHeight = "450px";
		
		return div;
	};
	
	/**
	* init demo - needs to be called from the PHP page that needs it
	*/
	const init = () => {
		const rightEyeData = dataTraces('right');
		const leftEyeData = dataTraces('left');
		const rightEyeLayout = buildRightLayout( 'Right Eye', 'rightEye' );
		const leftEyeLayout = buildRightLayout( 'Left Eye', 'leftEye' );
		
		/*
		yAxis for subplot
		*/
		// build yaxis for subplot 
		let yaxis3 = { domain: [0.8, 1] };
		yaxis3 = oePlotly.makeCategoryAxis(yaxis3, ['OCT', 'Lucentis', 'Eylea', 'Letters lost'].reverse(), true);
		
		// add to the layouts
		rightEyeLayout.yaxis3 = oePlotly.defaultAxis( yaxis3, window.oeThemeMode);  
		leftEyeLayout.yaxis3 = oePlotly.defaultAxis( yaxis3, window.oeThemeMode);

		/*
		build <div> for Plotly
		*/
		const leftDiv = buildDiv('idgPlotlyLeft');		
		const rightDiv = buildDiv('idgPlotlyRight');	
		document.querySelector('.oes-left-side').appendChild( leftDiv );
		document.querySelector('.oes-right-side').appendChild( rightDiv );
		
		Plotly.newPlot(
			leftDiv, 
			rightEyeData, 
			rightEyeLayout, 
			{ displayModeBar: false, responsive: true }
		);
		
		Plotly.newPlot(
			rightDiv, 
			leftEyeData, 
			leftEyeLayout, 
			{ displayModeBar: false, responsive: true }
		);

		// bluejay custom event (user changes layout)
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout(leftDiv, rightEyeLayout);
			Plotly.relayout(rightDiv, leftEyeLayout);
		});
	};
	
	// PHP requests the demo
	bj.extend('demoOESMedicalRetina', init);	
		
})( bluejay ); 