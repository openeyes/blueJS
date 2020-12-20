(function( bj ) {

	'use strict';
	
	/*
	IDG DEMO of adding pathSteps to pathway in Orders element
	*/
	
	const pathwayDemo = document.getElementById('js-idg-demo-orders-pathway');
	if( pathwayDemo === null) return;
	
	
	const addPathStep = ( ev ) => {
		const stepName = ev.target.dataset.idgDemo;
		const span = document.createElement('span');
		span.className = "oe-pathstep-btn process";
		span.innerHTML = `<span class="step">${ stepName }</span><span class="time invisible">Todo</span>`;
		pathwayDemo.appendChild( span );
	};
	
	const showPopup = ( ev ) => {
		
		// position popup on button
		const rect = ev.target.getBoundingClientRect();

		const template = [
			'<div class="close-icon-btn"></div>',	
			'{{#pathSteps}}',
			'<span class="oe-pathstep-btn no-popup process" data-idg-demo="{{.}}">',
			'<span class="step">{{.}}</span><span class="time invisible">Todo</span>',
			'</span>',
			'{{/pathSteps}}',
		].join('');
		
		const div = bj.div('oe-pathstep-adder');
		div.innerHTML = Mustache.render( template, {
			pathSteps: ['Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort(), // copied from Clinic Manager
		});
		
		div.style.bottom = ( bj.getWinH() - rect.bottom ) + 'px';
		div.style.right = ( bj.getWinW() - rect.right ) + 'px';
		
		document.body.appendChild( div );
		
		// close icon
		div.querySelector('.close-icon-btn').addEventListener( 'mousedown', () => div.remove(), { once: true });
	};
	
		
	bj.userDown('button#js-idg-demo-orders-btn-adder', showPopup );
	bj.userDown('.oe-pathstep-adder > .oe-pathstep-btn', addPathStep );
			
})( bluejay ); 