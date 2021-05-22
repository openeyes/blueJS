(function( bj ) {

	'use strict';	
	
	bj.addModule('clinicPathway');	
	
	/**
	* Pathway pathway btn in all events to show current pathway
	*/
	
	let div = null;
	const sidebarBtn = document.getElementById('js-idg-clinic-pathway-btn');
	
	const buildDemoPathway = () => {
		// match times in the demo
		const now = Date.now();
		const arrive = bj.clock24( new Date( now - (155 * 60000)));
		
		const clinic = div.querySelector('.clinic-pathway');
		clinic.innerHTML = [
			`<table class="oec-patients in-event">`,
			`<tbody>`,
			`<tr>`,
			`<td>${arrive}</td>`,
			`<td><div class="list-name">Accident &amp; Emergency</div><div class="code">First Attendance</div></td>`,
			`<td><div class="pathway active"></div></td>`,
			`<td><label class="patient-checkbox"><input class="js-check-patient" type="checkbox" value="demoAdd"><div class="checkbox-btn"></div></label></td>`,
			`<td><i class="oe-i circle-amber medium-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="Priority: Urgent"></i></td>`,
			`<td></td>`,
			`<td>2:49</td>`,
			`<td><i class="oe-i no-permissions small-icon pad js-has-tooltip" data-tooltip-content="Patient still in attendence.<br>Steps incomplete."></i></td>`,
			`</tr>`,
			`</tbody>`,
			`</table>`,
		].join('');
		
		const pathway = clinic.querySelector('.pathway');
		const commentTD = clinic.querySelector('td:nth-child(6)');
		const gui = bluejay.namespace('gui');
		
		gui.pathStep({
			shortcode: 'i-comments',
			status: 'buff', 
			type: 'comments',
			info: '&nbsp;',
			idgPopupCode: 'i-comments-none',
		}, commentTD );
		
		
		// -155
		gui.pathStep({
			shortcode: 'i-arr',
			status: 'buff', 
			type: 'arrive',
			info: arrive,
		}, pathway );
		
		gui.pathStep({
			shortcode: 'Triage',
			status: 'done', 
			type: 'process',
			info: bj.clock24( new Date( now - (148 * 60000))),
		}, pathway );
		
		gui.pathStep({
			shortcode: 'i-redflag',
			status: 'buff', 
			type: 'red-flag',
			info:  bj.clock24( new Date( now - (119 * 60000))),
		}, pathway );
		
		gui.pathStep({
			shortcode: 'MM',
			status: 'active', 
			type: 'person',
			info:  bj.clock24( new Date( now - (99 * 60000))),
		}, pathway );
			
		gui.pathStep({
			shortcode: 'i-drug-admin',
			status: 'todo', 
			type: 'process',
			info: 'clock',
			idgPopupCode: 'PSD-B',
		}, pathway );
		
		gui.pathStep({
			shortcode: 'i-discharge',
			status: 'todo', 
			type: 'process',
			info: 'clock',
		}, pathway );
		
		gui.pathStep({
			shortcode: 'Letter',
			status: 'todo', 
			type: 'process',
			info: 'clock',
		}, pathway );
		
		gui.pathStep({
			shortcode: 'Blood',
			status: 'todo', 
			type: 'process',
			info: 'clock',
		}, pathway );
		
	}
	
	
	
		
	
	const show = () => {
		div = bj.div('pathway-in-event');
		div.innerHTML = [
			`<div class="close-icon-btn"><i class="oe-i remove-circle"></i></div>`,
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
	}
	
	
/*
	<tr class="active" data-timestamp="1621690262476"><td>14:31</td><td><div class="list-name">Accident &amp; Emergency</div><div class="code">First Attendance</div></td><td><div class="oe-patient-meta"><div class="patient-name"><a href="/v3-SEM/patient-overview"><span class="patient-surname">CHANNING</span>, <span class="patient-firstname">Neayvaeh (Mr)</span></a><div class="patient-icons"></div></div><div class="patient-details"><div class="nhs-number"><span>NHS</span>385 999 7566</div><div class="gender">Male</div><div class="patient-age"><em>dob</em> 4 Feb 1965 <span class="yrs">56y</span></div></div></div></td><td><i class="oe-i eye-circle medium pad js-patient-quick-overview" data-mode="side" data-php="patient/quick/overview.php" data-patient="{&quot;surname&quot;:&quot;CHANNING&quot;,&quot;first&quot;:&quot;Neayvaeh (Mr)&quot;,&quot;id&quot;:false,&quot;nhs&quot;:&quot;385 999 7566&quot;,&quot;gender&quot;:&quot;Male&quot;,&quot;age&quot;:&quot;56y&quot;}"></i></td><td><div class="pathway active"><span class="oe-pathstep-btn buff arrive" data-bjc="440"><span class="step i-arr"></span><span class="info">14:31</span></span><span class="oe-pathstep-btn done process" data-bjc="441"><span class="step">Triage</span><span class="info">14:38</span></span><span class="oe-pathstep-btn buff red-flag" data-bjc="442"><span class="step i-redflag"></span><span class="info">15:07</span></span><span class="oe-pathstep-btn active person" data-bjc="443"><span class="step">MM</span><span class="info">15:27</span></span><span class="oe-pathstep-btn todo process" data-bjc="444"><span class="step i-drug-admin"></span><span class="info invisible">17:06</span></span><span class="oe-pathstep-btn todo process" data-bjc="445"><span class="step i-discharge"></span><span class="info invisible">17:06</span></span><span class="oe-pathstep-btn todo process" data-bjc="446"><span class="step">Letter</span><span class="info invisible">17:06</span></span><span class="oe-pathstep-btn todo process" data-bjc="447"><span class="step">Blood</span><span class="info invisible">17:06</span></span></div></td><td><label class="patient-checkbox"><input class="js-check-patient" type="checkbox" value="bj64"><div class="checkbox-btn"></div></label></td><td><i class="oe-i circle-amber medium-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="Priority: Urgent"></i></td><td><span class="oe-pathstep-btn buff comments" data-bjc="448"><span class="step i-comments"></span><span class="info">&nbsp;</span></span></td><td><div class="wait-duration"><svg class="duration-graphic yellow" viewBox="0 0 48 12" height="12" width="48"><circle class="c0" cx="6" cy="6" r="6"></circle><circle class="c1" cx="18" cy="6" r="6"></circle><circle class="c2" cx="30" cy="6" r="6"></circle><circle class="c3" cx="42" cy="6" r="6"></circle></svg><div class="mins"><small>2:35</small></div></div></td><td><i class="oe-i no-permissions small-icon pad js-has-tooltip" data-tooltip-content="Patient still in attendence.<br>Steps incomplete."></i></td></tr>

	
*/
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

})( bluejay ); 