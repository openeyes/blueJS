(function( bj, clinic ){

	'use strict';	
	
	const adder = () => {
		
		const div = bj.div('oe-clinic-adder');
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
			const full = new Map();	
			full.set('i-Stop', ['Auto-complete after last completed step', 'buff']);
			
			full.set('Mr MM', ['Mr Michael Morgan', 'todo', 'person']);
			full.set('Dr GJB', ['Dr Georg Joseph Beer', 'todo', 'person']);
			full.set('Dr GP', ['Dr George Bartischy', 'todo', 'person']);
			full.set('Su', ['Sushruta', 'todo', 'person']);
			full.set('Dr ZF', ['Dr Zofia Falkowska', 'todo', 'person']); 
			full.set('Nurse', ['Nurse', 'todo', 'person']);
			
			full.set('Dilate', ['Dilate', 'todo', 'process']);
			full.set('Colour', ['Colour', 'todo', 'process']);
			full.set('Img', ['Imaging', 'todo', 'process']);
			full.set('VisAcu', ['Visual Acuity', 'todo', 'process']);
			full.set('Orth', ['Orthoptics', 'todo', 'process']);
			full.set('Fields', ['Visual Fields', 'config', 'process']);
			full.set('Ref', ['Refraction', 'todo', 'process']);
			
			full.set('PSD', ['Patient Specific Directive', 'todo', 'process']);
			full.set('PGD', ['Patient Group Directive', 'todo', 'process']);
			
			full.set('c-last', ['Remove last pathway step']);
				
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
		
			buildGroup( 'Common', ['Colour','Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort());
			buildGroup('People', ['Mr MM', 'Dr GJB', 'Dr GP', 'Su', 'Dr ZF','Nurse'].sort());
			// remove button
			buildGroup('Remove "todo" steps from selected patient', ['c-last'], 'removeTodos' );

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