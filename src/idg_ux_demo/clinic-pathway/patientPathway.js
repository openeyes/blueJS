(function( bj, gui ) {

	'use strict';	
	
	bj.addModule('clinicPathway');	
	
	/**
	* Pathway pathway btn in all events to show current pathway
	*/
	
	let div = null;
	const now = Date.now();
	
	// big button in the Event sidebar
	const sidebarBtn = document.getElementById('js-idg-clinic-pathway-btn');
	
	/**
	* Need to show this demo pathway in 2 places
	* in the popup in any Event and in the Next Steps Element
	* Pathway matches the idg Clinic manager demo
	*/
	const pathwaySteps = ( parentDiv ) => {
		bj.empty( parentDiv ); // make sure it's empty
		
		[
			['i-arr', 155, 'done', 'process'],
			['Triage', 148, 'done', 'process'],
			['i-redflag', 119, 'buff','red-flag'],
			['Doctor', 99, 'active', 'process'],
			['i-drug-admin', 0, 'todo', 'process', 'PSD-B'],
			['i-discharge', 0, 'todo','process'],
			['Letter', 0, 'todo', 'process'],
			['Blood', 0, 'todo', 'process']
		].forEach( newStep => { 
			gui.pathStep({
				shortcode: newStep[0],
				status: newStep[2], 
				type: newStep[3],
				info: newStep[1] ? bj.clock24( new Date( now - (newStep[1] * 60000))) : 0,
				idgPopupCode: newStep[4],
			}, parentDiv );
		});
	}; 
	
	const pathwayComments = ( parentDiv ) => {
		// comments "step"
		gui.pathStep({
			shortcode: 'i-comments',
			status: 'buff', 
			type: 'comments',
			idgPopupCode: 'i-comments-none', 
		}, parentDiv );
	};
	
	/*
	Expose these 2 to use directly in Next Steps elements
	*/
	bj.extend('demoPathwaySteps', pathwaySteps );
	bj.extend('demoPathwayComments', pathwayComments );

	
	const buildDemoPathway = () => {		
		// match times in the demo
		const arrive = bj.clock24( new Date( now - (155 * 60000)));
		const pathwayDuration = () => '<div class="wait-duration"><svg class="duration-graphic yellow" viewBox="0 0 48 12" height="12" width="48"><circle class="c0" cx="6" cy="6" r="6"></circle><circle class="c1" cx="18" cy="6" r="6"></circle><circle class="c2" cx="30" cy="6" r="6"></circle><circle class="c3" cx="42" cy="6" r="6"></circle></svg><div class="mins"><small>2:35</small></div></div>';
		
		const clinic = div.querySelector('.clinic-pathway');
		clinic.innerHTML = [
			`<table class="oec-patients in-event">`,
			`<tbody>`,
			`<tr>`,
			`<td>${arrive}</td>`,
			`<td><div class="list-name">Accident &amp; Emergency</div><div class="code">First Attendance</div></td>`,
			`<td><div class="pathway active"><!-- JS --></div></td>`,
			`<td><div class="flex"><i class="oe-i person no-click small"></i> PT</div></td>`,
			`<td><i class="oe-i circle-amber medium-icon js-has-tooltip" data-tooltip-content="Priority: Urgent"></i></td>`,
			`<td></td>`, // comments
			`<td>${ pathwayDuration() }</td>`,
			`<td><button class="add-pathstep"></button></td>`,
			`</tr>`,
			`</tbody>`,
			`</table>`,
		].join('');

		pathwaySteps( clinic.querySelector('.pathway'));
		pathwayComments( clinic.querySelector('td:nth-child(6)'));
	
	};
	
	
	const show = () => {
		div = bj.div('pathway-in-event');
		div.innerHTML = [
			`<div class="close-icon-btn"><i class="oe-i remove-circle small-icon"></i></div>`,
			`<div class="clinic-pathway"><i class="spinner as-icon"></i></div>`
		].join('');
		
		
		// make space for the popup pathway
		document.querySelector('main').classList.add('allow-for-pathway');
		document.body.append( div );
		
		// this will clear the fake loader.
		setTimeout(() => buildDemoPathway(), 500);
		
		// update sidebar btn
		sidebarBtn.classList.add('active');
	}; 
	
	const remove = () => {
		div.remove();
		document.querySelector('main').classList.remove('allow-for-pathway');
		
		// update sidebar btn
		sidebarBtn.classList.remove('active');
	};
	
	/*
	Events
	*/
	bj.userDown('#js-idg-clinic-pathway-btn', () => {
		if( sidebarBtn.classList.contains('active')){
			remove();
		} else {
			show();	
		}
		sidebarBtn.blur();
	});
	
	bj.userDown('.pathway-in-event .close-icon-btn i', remove );

})( bluejay, bluejay.namespace('gui')); 