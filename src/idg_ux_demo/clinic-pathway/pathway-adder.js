(function( bj ){

	'use strict';	
	
	let div = null;
	let open = false;
	
	/**
	* Hide
	* removing "fadein" effectively equals: display:none
	*/
	const hide = () => {
		open = false;
		div.classList.remove('fadein');
		div.remove();
	};
	
	/**
	* Show.
	* Every time a checkbox box is checked it will try
	* and show the adder.
	*/
	const show = () => {
		if( open ) return; else open = true;
		if( div == null ) build();
		// update DOM
		document.querySelector('main').append( div );
		div.classList.remove('fadein');
		div.classList.add('fadein'); // CSS animation 
	};

	/**
	* Build on request	
	*/
	const build = () => {
		/*
		* Insert steps options are static, build once
		*
		* Each shortcode has a full title shown in the popup.
		* In iDG that is in the PHP, however we also have to show 
		* it here where the user has to select a step.
		*/
		
		div = bj.div('oec-adder');
		
		const icon = i => `<i class="oe-i ${i} small pad-right"></i>`;
		
		const full = new Map();	
		
		const btn = ( key, btn=false, shortcode=false, status='todo', type='process', idg=false ) => {
			btn = btn || key;
			shortcode = shortcode || key;
			full.set( key, { btn, shortcode, status, type, idg });
		};
		
		btn('Nurse');
		btn('Doctor');
		btn('HCA');
		
		btn('Gen', 'General task', false, 'editable');
		btn('Exam', 'Examination');
		btn('Triage');
		btn('Bio', 'Biometry');
		btn('Colour');
		btn('Img', 'Imaging');
		btn('VA', 'Visual Acuity');
		btn('Orth', 'Orthoptics');
		btn('Ref', 'Refraction');
		btn('CDU', 'Clinical decision unit');
		btn('Presc', 'Prescription', 'Rx');
		btn('Dilate');
		btn('Dr Jones');
		
		btn('DrugAdmin', icon('drop') + 'Drug Administration Preset Order', 'i-drug-admin', 'popup' );
		btn('VisFields', 'Visual Fields', 'Fields', 'popup');
		
		btn('Letter');
		btn('Letter-discharge', 'Letter - discharge', 'Disc.letter');
		btn('Blood', 'Blood tests');
		btn('MRI', 'MRI tests');
		
		btn('preset-pathway', 'Add common pathway', false, 'popup');
		
		btn('i-fork', icon('fork') + 'Decision / review', false, 'buff', 'fork');
		btn('i-break', icon('path-break') + 'Break in pathway', false, 'buff', 'break');
		btn('i-discharge', icon('stop') + 'Check out', false, 'todo', 'process');
		btn('on-hold', icon('time') + 'Hold timer (mins)', false, 'editable');
		
		btn('c-last','Remove last "todo" pathway step' );
			
		/*
		* Element for all inserts
		* only need to build this once
		*/
		const inserts = bj.div('insert-steps');
		
		// fake assignments (works in the Clinic Manager)
		inserts.insertAdjacentHTML('afterbegin', `<div class="row"><input class="assign-to search" type="text" placeholder="Assign to..."><ul class="btn-list"></ul></div>`);
		
		const buildGroup = ( title, list ) => {
			const h4 = title ? `<h4>${title}</h4>` : "";
			const group = bj.dom('div','row', h4 );
			const ul = bj.dom('ul', 'btn-list');
			
			list.forEach( code => {
				// code is the key.
				const step = full.get( code );
				const li = bj.dom('li', false, `${step.btn}`);
				li.setAttribute('data-idg', JSON.stringify({
					c: step.shortcode,    // shortcode
					s: step.status, // status
					t: step.type, // type
					i: step.idg
				}));
				
				// Special remove button:
				if( code == "c-last") li.className = "red";
				
				ul.append( li );
			});
			
			group.append( ul );
			inserts.append( group );
		};
	
		buildGroup('Path', ['i-fork', 'i-break', 'i-discharge', 'on-hold']);
		buildGroup('Preset pathways', ['preset-pathway']);	
		buildGroup('Standard', ['Bio','DrugAdmin','VisFields','Letter','Presc','Exam','Gen'].sort());
		buildGroup('Custom', ['Triage','Colour', 'Dr Jones', 'Letter-discharge', 'Dilate','Img','VA','Orth','Ref', 'CDU','Doctor','Nurse', 'HCA','Blood','MRI'].sort());

		// build div
		div.append( bj.div('close-btn'), inserts );
		
		// add a direct listener (otherwise it breaks clinic manager)
		div.addEventListener('mousedown', ev => {
			if( ev.target.matches('div.oec-adder .close-btn')){
				hide();
			}
		});
		
	};
		
	// Events
	bj.userClick('button.add-pathstep',() => show());		

	
})( bluejay ); 