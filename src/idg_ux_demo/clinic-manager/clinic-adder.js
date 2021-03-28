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
			
			full.set('Mr MM', ['Mr Michael Morgan', 'person']);
			full.set('Dr GJB', ['Dr Georg Joseph Beer', 'person']);
			full.set('Dr GP', ['Dr George Bartischy', 'person']);
			full.set('Su', ['Sushruta', 'person']);
			full.set('Dr ZF', ['Dr Zofia Falkowska', 'person']); 
			full.set('Nurse', ['Nurse', 'person']);
			
			full.set('Dilate', ['Dilate', 'process']);
			full.set('Colour', ['Colour', 'process']);
			full.set('Img', ['Imaging', 'process']);
			full.set('VisAcu', ['Visual Acuity', 'process']);
			full.set('Orth', ['Orthoptics', 'process']);
			full.set('Fields', ['Visual Fields', 'process']);
			full.set('Ref', ['Refraction', 'process']);
			
			full.set('PSD', ['Patient Specific Directive', 'process']);
			full.set('PGD', ['Patient Group Directive', 'process']);
			
			full.set('c-last', ['Remove last pathway step', null ]);
				
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
					const fullName = step[0];
					const type = step[1];
					const idgPHP = step[2] == undefined ? false : step[2];
					
					const li = document.createElement('li');
					li.setAttribute('data-code', code );
					li.setAttribute('data-type', type);
					li.setAttribute('data-idg', idgPHP);
					li.innerHTML = `${fullName}`;
					
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