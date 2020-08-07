(function ( bj ) {

	'use strict';
	
	/**
	* Data for IDG demo
	*/
	const dataTraces = ( eye ) => {
		
		const rightVA = {
			x: ['2010-06-07', '2011-06-13', '2011-09-03','2012-06-02','2015-02-04','2015-05-01','2016-10-10','2017-12-08'],
			y: ['6/9','6/9','6/9','6/18','6/6','6/6','HM','HM'],
			name: 'VA',		
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const rightIOP = {
			x: ['2003-01-07', '2003-06-03','2004-06-06','2004-12-21','2006-01-06','2007-07-21','2008-03-03','2008-09-14','2010-06-07','2010-09-01', '2011-03-11','2011-03-28','2011-05-30','2011-06-13','2011-06-14','2011-07-11','2011-09-03','2011-09-04','2012-03-17', '2012-09-03','2014-12-22','2015-02-04','2015-05-01','2016-01-07','2016-10-10','2017-12-08'],
			y: [30,17,15,18,14,32,32,32,20,12,13,14,26,18,17,22,22,22,20,24,19,18,19,50,10,10],
			name: 'IOP',		
			yaxis: 'y3',
			hovertemplate: 'IOP: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		const rightTimolol = {
			x: ['2003-01-10', '2003-06-12'], 
			y: ['Timolol', 'Timolol'], 
			customdata: ['Timolol 0.25% eye drops', 'Timolol 0.25% eye drops'],
			name:'', 
			yaxis: 'y4',
			hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
			type: 'scatter', 
			mode: 'lines+markers',
			marker: oePlotly.markerFor('drug')
		};
		
		const rightLatanoprostX = {
			x: ['2003-06-12', '2010-09-29'], 
			y: ['Latanoprost', 'Latanoprost'], 
			customdata: ['Latanoprost 0.005% eye drops (XALATAN)', 'Latanoprost 0.005% eye drops (XALATAN)'],
			name:'', 
			yaxis: 'y4',
			hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
			type: 'scatter', 
			mode: 'lines+markers',
			marker: oePlotly.markerFor('drug')
		};
		
		const rightLatanoprostY = {
			x: ['2010-09-29','2017-12-08'], 
			y: ['Latanoprost', 'Latanoprost'], 
			customdata: ['Latanoprost 0.005% eye drops (MONOPOST)', 'Latanoprost 0.005% eye drops (MONOPOST)'],
			name:'', 
			yaxis: 'y4',
			hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
			type: 'scatter', 
			mode: 'lines+markers',
			marker: oePlotly.markerFor('drug')
		};
		
		const dorzolamide = {
			x: ['2011-07-10','2017-12-08'], 
			y: ['Dorzolamide', 'Dorzolamide'], 
			customdata: ['Dorzolamide 2% single use eye drops (TRUSOPT)', 'Dorzolamide 2% single use eye drops (TRUSOPT)'],
			name:'', 
			yaxis: 'y4',
			hovertemplate: '%{y}<br>%{customdata}<br>%{x}',
			type: 'scatter', 
			mode: 'lines+markers',
			marker: oePlotly.markerFor('drug')
		};
		
		
		const leftVA = {
			x: ['2010-06-07', '2011-06-13', '2011-09-03','2012-06-02','2015-02-04','2015-05-01','2016-10-10','2017-12-08'],
			y: ['6/6','6/6','6/6','6/12','6/12','6/7.5','6/9','6/9'],
			name: 'VA',		
			hovertemplate: 'Snellen Metre: %{y}<br>%{x}',
			type: 'scatter',
			mode: 'lines+markers',
		};
		
		
		// return array depending on request
		if( eye == "right"){
			return [ rightVA, rightIOP, rightTimolol, rightLatanoprostX, rightLatanoprostY, dorzolamide ];
		} else {
			return [ leftVA ];
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
			titleY: 'VA (Snellen Metre)', 
			numTicksX: 10,
			numTicksY: 20,
			datesOnAxis: 'x', 
			useCategories: {
				showAll: true, 
				categoryarray: ['6/3','6/4','6/5','6/6','6/7.5','6/9','6/9.5','6/12','6/15','6/18', '6/24','6/30','6/36','6/48','6/60','6/75','6/95','3/60','2/60', '1/60', 'CF', 'HM', 'PL', 'NPL'].reverse()
			},
			rangeslider: true,
			subplot: true,
			domain: [0, 0.35], 
			spikes: true,
			vLineMarker: [
				{x:'2011-03-12', y:0.75, name: "SLT"},
				{x:'2011-05-06', y:0.75, name: "Traby, MMC"},
				{x:'2015-01-01', y:0.75, name: "Phaco + IOL"},
				{x:'2015-09-09', y:0.75, name: "PRP"},
				{x:'2015-09-10', y:0.75, name: "PRP"},
				{x:'2016-02-21', y:0.75, name: "Cycloablation"},
			],
			hLineMarker: [
				{ axis:'y3', y:15, name: "Target IOP"},
			],
		});
	};
	
	/**
	* Build DIV
	*/
	const buildDiv = ( id ) => {
		const div = document.createElement('div');
		div.id = id;
		div.style.height = "calc(100vh - 150px)";
		div.style.minHeight = "850px";
		
		return div;
	};
	
	/**
	* init demo - needs to be called from the PHP page that needs it
	*/
	const init = ( jsonData ) => {
		const rightEyeData = dataTraces('right');
		const leftEyeData = dataTraces('left');
		const rightEyeLayout = buildRightLayout( 'Right Eye', 'rightEye' );
		const leftEyeLayout = buildRightLayout( 'Left Eye', 'leftEye' );
		
		// build yaxis for subplot 
		let yaxis3 = { 
			domain: [0.4, 0.75],
			range: [0, 75],
			title: {
				text: "IOP",
			} 
		};
		
		oePlotly.addSpikes( yaxis3, window.oeThemeMode );
		
		// build yaxis for subplot 
		let yaxis4 = { 
			domain: [0.8, 1],
			range: [0,5],
		};
		
		yaxis4 = oePlotly.makeCategoryAxis(yaxis4, ['Timolol', 'Latanoprost','Dorzolamide'].reverse(), true);
				
		rightEyeLayout.yaxis3 = oePlotly.defaultAxis( yaxis3, window.oeThemeMode ); 
		rightEyeLayout.yaxis4 = oePlotly.defaultAxis( yaxis4, window.oeThemeMode );

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
	bj.extend('oesGlaucoma', init);	
	console.log( bj );
		
})( bluejay ); 