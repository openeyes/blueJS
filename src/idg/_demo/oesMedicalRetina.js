(function ( bj ) {

	'use strict';
	
	const data = [
	{
		x: ['2014-01-10', '2014-02-14', '2014-03-14', '2014-04-06', '2014-06-06'    , '2020-07-10'],
		y: [470, 433, 450, 461, 410, 507],
		name: 'CRT',		
		hovertemplate: '%{y}<br>%{x}',
		type: 'scatter'
	},{
		x: ['2014-02-03', '2014-03-03', '2014-04-12', '2014-04-14', '2015-05-20', '2015-05-21'], 
		y: ['OCT','Lucentis','OCT','OCT','Lucentis','Lucentis'], 
		name:'', 
		yaxis: 'y3',
		hovertemplate: '%{y}<br>%{x}',
		type: 'scatter', 
		mode: 'markers'
	}];
	
	// layout 
	let layout = oePlotly.getLayout({
		theme: window.oeThemeMode, 
		colors: 'rightEye',
		plotTitle: 'Right Eye',
		legend: false,
		//titleX: 'Time',
		titleY: 'CRT (µm)', 
		numTicksX: 10,
		numTicksY: 20,
		//rangeX: [-20, 220],
		rangeY: [250, 600],
		datesOnAxis: 'x', 
		y2: {
			title:'OCT',
			range:['6/6', '6/5', '6/4', '6/3']
		},
		rangeslider: true,
		subplot: true,
		domain: [0, 0.7], 
		spikes: true,
	});
	
	
	layout.yaxis3 = oePlotly.defaultAxis({
		domain: [0.8, 1],
		type: 'category',
		range: ['OCT', 'Lucentis', "Letters lost"],
	}, window.oeThemeMode);

	
	const init = () => {
		// build <div> for Plotly
		const leftDiv1 = document.createElement('div');
		leftDiv1.id = 'idgPlotlyLeft1';
		leftDiv1.style.height = "calc(100vh - 150px)";
		
		document.querySelector('.oes-left-side').appendChild( leftDiv1 );
		
		Plotly.newPlot(
			leftDiv1, 
			data, 
			layout, 
			{displayModeBar: false, responsive: true}
		);
		
		
		// bluejay custom event
		document.addEventListener('oesLayoutChange', () => {
			Plotly.relayout(leftDiv1, layout);
		});
	};
	
	
	// delay initialising until everything is loaded
	document.addEventListener('DOMContentLoaded', init , { once: true});	
		
})( bluejay ); 