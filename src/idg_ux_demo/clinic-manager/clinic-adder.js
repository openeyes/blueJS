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
			const fullText = new Map();	
			fullText.set('i-Arr', 'Arrived');
			fullText.set('i-Wait', 'Waiting');
			fullText.set('i-Stop', 'Auto-complete after last completed step');
			fullText.set('i-Fin', 'Finished Pathway - Patient discharged');
			fullText.set('DNA', 'Did Not Attend');
			fullText.set('unassigned', 'Not assigned');
			
			fullText.set('MM', 'Mr Michael Morgan');
			fullText.set('GJB', 'Dr Georg Joseph Beer ');
			fullText.set('GP', 'Dr George Bartischy');
			fullText.set('Su', 'Sushruta');
			fullText.set('ZF', 'Dr Zofia Falkowska'); 
			fullText.set('Nurse', 'Nurse');
			
			fullText.set('Dilate', 'Dilate');
			fullText.set('Colour', 'Colour');
			fullText.set('Img', 'Imaging');
			fullText.set('VisAcu', 'Visual Acuity');
			fullText.set('Orth', 'Orthoptics');
			fullText.set('Fields', 'Visual Fields');
			fullText.set('Ref', 'Refraction');
			
			fullText.set('PSD', 'Patient Specific Directive');
			fullText.set('PGD', 'Patient Group Directive');
			
			fullText.set('c-last', 'remove last pathway step');
				
			/*
			* Element for all inserts
			* only need to build this once
			*/
			const inserts = bj.div('insert-steps');
			
			// helper build <li>
			const _li = ( code, type, html ) => {
				
				return li;
			};
			
			const buildGroup = ( title, list, type ) => {
				const group = bj.dom('div','row', `<h4>${title}</h4>`);
				const ul = bj.dom('ul', 'btn-list');
				
				list.forEach( code => {
					let shortcode = code;
					if( code == "c-all") code = "Clear all";
					if( code == "c-last") code = "Remove last";
					
					
					const li = document.createElement('li');
					li.setAttribute('data-code', shortcode );
					li.setAttribute('data-type', type);
					li.innerHTML = `${code} <small>- ${fullText.get(shortcode)}</small>`;
					
					if( shortcode == "c-last"){
						li.className = "red";
					}
					
					ul.append( li );
				});
				
				group.append( ul );
				inserts.append( group );
			};
		
			// Step groups
			const process = ['Colour','Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort();
			const people = ['MM', 'GJB', 'GP', 'Su', 'ZF','Nurse'].sort();
			
			// buttons
			buildGroup('Steps', process, 'process' );
			buildGroup('People', people, 'person' );
			// remove button
			buildGroup('Remove "todo" steps from selected', ['c-last'], 'removeTodos' );

			// build div
			div.append( bj.div('close-btn'), inserts );
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		// API 
		return { show, hide };	
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 