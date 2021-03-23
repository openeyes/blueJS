(function( bj, clinic ){

	'use strict';	
	
	const adder = () => {
		
		// hold in memory
		let multi; // 'single' or 'multiple' patients 
		let multiPatientCheckBoxes;
		
		const div = bj.div('oe-clinic-adder');
		const patients = bj.div('patients');
		const singlePatient = bj.div('single-patient'); 
		const selectedPatients = new Set(); 
		
		/**
		* Reset DOM and clear selectedPatients
		* @param {String} mode - 'single' or 'multiple'
		*/
		const reset = ( mode) => {
			multi = ( mode == 'multi'); // set Boolean
			bj.empty( patients )
			patients.remove();
			singlePatient.remove();
			selectedPatients.clear();
		}
		
		/**
		* Display uses CSS animation
		* Display default in CSS is: "none"
		* adding "fadein" starts the CSS animation AND sets display
		*/
		const fadein = () => {
			div.classList.remove('fadein');
			div.classList.add('fadein');
		};
		
		// removing "fadein" effectively equals: display:none
		const hide = () => {
			div.classList.remove('fadein');
			reset();
		}
		
		/**
		* @callback - App
		* when an insert step option is click, App needs to know 
		* which patients are select
		* @returns {Set} - Patient IDs
		*/
		const getSelectedPatients = () => {
			if( multi ){
				// update from checked patients
				selectedPatients.clear();
				multiPatientCheckBoxes.forEach( checkbox => {
					if( checkbox.checked ){
						selectedPatients.add( checkbox.value )
					}					
				});
			}
			
			return selectedPatients;
		};
		
		/**
		* Event: input check box (selected patients)
		* A quick hack to demo Selecting "All" patients
		*/
		patients.addEventListener('change', ev => {
			const input = ev.target;
			if( input.value == "select-all"){
				multiPatientCheckBoxes.forEach( checkbox => checkbox.checked = input.checked );
			} 
		});
		

		/**
		* @callback - list all patients in view
		* @param {Set} - set of the filtered patients
		*/
		const showAll = ( patientSet ) => {
			reset('multi');
			
			// Helper - build <li>
			const _li = ( val, text ) => {
				const li = document.createElement('li');
				li.innerHTML = `<label class="highlight"><input type="checkbox" value="${val}" checked/><span>${text}</span></label>`;
				return li;
			}
			
			// <ul>
			const ul = bj.dom('ul','row-list');
			
			// add patients
			patientSet.forEach( patient => {
				ul.append( _li( patient.getID(), patient.getNameAge() ));
			});	
			
			// update DOM
			patients.append( ul );
			div.prepend( patients );
			
			// store array of patient checkboxes
			multiPatientCheckBoxes = bj.nodeArray( patients.querySelectorAll('input[type=checkbox]'));
			
			// add a "select all" option
			ul.prepend( _li('select-all', 'All')); // add "All" - always first
			
			fadein();
		};
		
		/**
		* @callback - specific patient 
		*/
		const showSingle = ( id, nameAge ) => {
			reset('single');
			selectedPatients.add( id );
			singlePatient.innerHTML = `<span class="highlighter">${nameAge}</span>`;
			div.querySelector('.insert-steps').prepend( singlePatient );
			fadein();
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
			fullText.set('c-all', 'Clear all pathway steps');
				
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
			
			// processes 
			buildGroup('Steps', process, 'process' );
			buildGroup('People', people, 'person' );
			
			buildGroup('Remove "todo" steps from selected', ['c-last'], 'removeTodos' );

			// build div
			div.append( bj.div('close-btn'), inserts );
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		/* 
		API
		*/
		return { 
			showAll, 
			showSingle, 
			hide, 
			getSelectedPatients, 
		};	
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 