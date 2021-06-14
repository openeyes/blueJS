(function( bj, clinic ){

	'use strict';	
	
	const adder = () => {
		
		const div = bj.div('oec-adder');
		const addTo = bj.div('add-to');
		
		let open = false;
		
		/**
		* selectedPatients
		* When there is a long patient list it's possible that 
		* the selected + icon will be off screen!!
		* @param {Number} num
		*/
		const tickCount = ( num ) => {
			addTo.innerHTML = num ? 
				`<span class="num">${num}</span> selected`:
				`No patients selected`;
		}; 
		
		/**
		* addedToPatients
		* CSS small animation to provide feedback on sucessful action
		*/
		const addSuccess = () => {
			addTo.classList.add('success');		
			setTimeout(() => {
				addTo.classList.remove('success');
			}, 1200 );	
		};

		
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
			const btn = ( key, btn=false, shortcode=false, status='todo', type='process', idg=false ) => {
				btn = btn || key;
				shortcode = shortcode || key;
				full.set( key, { btn, shortcode, status, type, idg });
			};
			

			btn('Nurse');
			btn('Doctor');
			btn('HCA');
			
			btn('Gen', 'General task', false, 'todo', 'process', 'custom-step-select');
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
			btn('Dilate')
			btn('Dr Jones');
			
			
			btn('DrugAdmin', icon('drop') + 'Drug Administration Preset Order', 'i-drug-admin', 'popup' );
			btn('VisFields', 'Visual Fields', 'Fields', 'popup');
			
			btn('Letter');
			btn('Letter-discharge', 'Letter - discharge', 'Disc.letter');
			btn('Blood', 'Blood tests');
			btn('MRI', 'MRI tests');
			
			btn('preset-pathway', 'Add custom pathway', false, 'popup');
			
			btn('i-fork', icon('fork') + 'Decision / review', false, 'buff', 'fork');
			btn('i-break', icon('path-break') + 'Break in pathway', false, 'buff', 'break');
			btn('i-discharge', icon('stop') + 'Check out', false, 'todo', 'process');
			
			btn('c-last','Remove last "todo" pathway step' );
				
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
				const h4 = title ? `<h4>${title}</h4>` : "";
				const group = bj.dom('div','row', h4 );
				const ul = bj.dom('ul', 'btn-list');
				
				list.forEach( code => {
					// code is the key.
					const step = full.get( code );
					const li = document.createElement('li');
					li.innerHTML = `${step.btn}`;
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
		
			buildGroup( false, ['i-fork', 'i-break', 'i-discharge']);
			
			buildGroup('Preset pathways', ['preset-pathway']);	
			
			buildGroup('Standard', ['Bio','DrugAdmin','VisFields','Letter','Presc','Exam','Gen'].sort());
			
			buildGroup('Custom', ['Triage','Colour', 'Dr Jones', 'Letter-discharge', 'Dilate','Img','VA','Orth','Ref', 'CDU','Doctor','Nurse', 'HCA','Blood','MRI'].sort());
			
			
			// remove button
			buildGroup('Remove step from patient', ['c-last']);

			// build div
			div.append( bj.div('close-btn'), addTo, inserts );
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		// API 
		return { show, hide, isOpen, tickCount, addSuccess };	
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 