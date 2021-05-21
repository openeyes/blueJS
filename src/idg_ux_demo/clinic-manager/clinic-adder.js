(function( bj, clinic ){

	'use strict';	
	
	const adder = () => {
		
		const div = bj.div('oec-adder');
		let open = false;
		
		/**
		* Hide
		* removing "fadein" effectively equals: display:none
		*/
		const hide = () => {
			open = false;
			div.classList.remove('fadein');
		};
		
		/**
		* Show.
		* Every time a checkbox box is checked it will try
		* and show the adder.
		*/
		const show = () => {
			if( open ) return; else open = true;
			div.classList.remove('fadein');
			div.classList.add('fadein'); // CSS animation 
		};
		
		/**
		* App needs to know this
		*/
		const isOpen = () => open;

		/**
		* Init 
		* build all the steps that can be added
		* patients shown depend on filters	
		*/
		(() => {
			/*
			* Insert steps options are static, build once
			*
			* Each shortcode has a full title shown in the popup.
			* In iDG that is in the PHP, however we also have to show 
			* it here where the user has to select a step.
			*/
			const icon = i => `<i class="oe-i ${i} small pad-right"></i>`;
			
			const full = new Map();	
			full.set('i-Stop', ['Auto-complete after last completed step', 'buff']);
			
			full.set('Mr MM', [ icon('person') + 'Mr Michael Morgan', 'todo', 'person']);
			full.set('Dr GJB', [ icon('person') + 'Dr Georg Joseph Beer', 'todo', 'person']);
			full.set('Dr GP', [ icon('person') + 'Dr George Bartischy', 'todo', 'person']);
			full.set('Su', [ icon('person') + 'Sushruta', 'todo', 'person']);
			full.set('Dr ZF', [ icon('person') +'Dr Zofia Falkowska', 'todo', 'person']); 
			full.set('Nurse', [ icon('person') + 'Nurse', 'todo', 'person']);
			
			full.set('Dilate', ['Dilate', 'todo', 'process']);
			full.set('Colour', ['Colour', 'todo', 'process']);
			full.set('Img', ['Imaging', 'todo', 'process']);
			full.set('VisAcu', ['Visual Acuity', 'todo', 'process']);
			full.set('Orth', ['Orthoptics', 'todo', 'process']);
			full.set('Ref', ['Refraction', 'todo', 'process']);
			
			full.set('Letter', ['Send letter', 'todo', 'process']);
			full.set('Blood', ['Blood tests', 'todo', 'process']);
			full.set('MRI', ['MRI tests', 'todo', 'process']);
			
			full.set('Fields', ['Visual Fields', 'popup', 'process']);
			full.set('i-drug-admin', [ icon('drop') + 'Drug Administration Preset Order', 'popup', 'process']);
			
			full.set('Pathways', ['Preset pathways', 'popup', 'process']);
			
			full.set('i-fork', [ icon('fork') + 'Decision', 'buff', 'fork']);
			full.set('i-break', [ icon('path-break') + 'Break in pathway', 'buff', 'break']);
			full.set('i-discharge', [ icon('stop') + 'Patient can leave', 'todo', 'process']);
			
			full.set('c-last', [ 'Remove last pathway step']);
				
			/*
			* Element for all inserts
			* only need to build this once
			*/
			const inserts = bj.div('insert-steps');
			
			// helper build <li>
			const _li = ( code, type, html ) => {
				
				return li;
			};
			
			const buildGroup = ( title, list ) => {
				const group = bj.dom('div','row', `<h4>${title}</h4>`);
				const ul = bj.dom('ul', 'btn-list');
				
				list.forEach( code => {
					// code is the key.
					const step = full.get( code );
					const li = document.createElement('li');
					li.innerHTML = `${step[0]}`;
					li.setAttribute('data-idg', JSON.stringify({
						c: code,    // shortcode
						s: step[1], // status
						t: step[2], // type
						i: step[3] == undefined ? 0 : step[3] // optional idgPHPcode
					}));
					
					// Special remove button:
					if( code == "c-last") li.className = "red";
					
					ul.append( li );
				});
				
				group.append( ul );
				inserts.append( group );
			};
		
			buildGroup('Patient', ['i-fork', 'i-break', 'i-discharge']);
			buildGroup('Pathways', ['Pathways']);
			buildGroup('Common', ['Colour','Dilate', 'VisAcu', 'Orth', 'Ref', 'Img' ].sort());
			buildGroup('Configurable', ['i-drug-admin', 'Fields']);
			buildGroup('People', ['Mr MM', 'Dr GJB', 'Dr GP', 'Su', 'Dr ZF','Nurse'].sort());
			buildGroup('Post-discharge tasks', ['Letter','Blood','MRI'].sort());
			// remove button
			buildGroup('Remove "todo" steps from selected patient', ['c-last']);

			// build div
			div.append( bj.div('close-btn'), inserts );
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		// API 
		return { show, hide, isOpen };	
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 