(function( bj, clinic ){

	'use strict';	
	
	/**
	* @param {JSON} json
	*/
	const adder = ( json ) => {
		
		const div = bj.div('oe-clinic-adder');
		const patients = bj.div('patients'); 
		const arrived = new Map();
		const later = new Map();
		const selectedPatients = new Set(); 
		
		/**
		* GETTER: App
		*/
		const getSelectedPatients = () => selectedPatients;
		
		/**
		* <div> row with <h4> title 
		* @param {String} title
		* @returns {Element};
		*/
		const _row = ( title ) => {
			const row = bj.div('row');
			row.innerHTML = `<h4>${title}</h4>`;
			return row;
		};
		
		/**
		* <ul>
		* @param {String} class
		* @returns {Element};
		*/
		const _ul = ( css ) => {
			const ul = document.createElement('ul');
			ul.className = css;
			return ul;
		}; 

		/**
		* Patient list - update the DOM for Arrived and Later groups
		*/
		const updatePatientList = () => {
			
			const list = ( title, listMap ) => {
				const row = _row( title );
				const ul = _ul("row-list");
				listMap.forEach(( value, key ) => {
					const li = document.createElement('li');
					li.innerHTML = `<label class="highlight"><input type="checkbox" value="${key}" /><span>${value.time} - ${value.lastname}</span></label>`;
					ul.append( li );
				});
				row.append( ul );
				return row;
			}; 
			
			// update DOM
			patients.innerHTML = "";
			patients.append( list( "Arrived", arrived ));
			patients.append( list( "Later", later ));			
		};
		
		/**
		* Patient list - update who's selected
		*/
		const updateSelectPatients = () => {
			selectedPatients.clear();
			const inputs = bj.nodeArray( patients.querySelectorAll('input[type=checkbox]'));
			inputs.forEach( input => {
				if( input.checked ) selectedPatients.add( input.value );
			});
		};
		
		/**
		* Event delegation, just interested if a checkbox is changed
		*/
		patients.addEventListener('change', updateSelectPatients );
		
		/**
		* API patient arrived, need to update my lists
		* @param {String} id - patient key
		*/
		const onPatientArrived = ( id ) => {
			if( later.has( id )){
				arrived.set( id, later.get(id));
				later.delete( id );
			}	
			// update Arrived and Later patient groups
			updatePatientList();
		};

		/**
		* API: Show ALL patients
		*/
		const showAll = () => {
			patients.style.display = "";
			div.style.display = "";
			updateSelectPatients(); // reset the selected list
		};
		
		/**
		* API: Show for specific patient
		* specific patient 
		*/
		const showSingle = ( id ) => {
			patients.style.display = "none";
			div.style.display = "";
			selectedPatients.clear();
			selectedPatients.add( id );
		};
		
		/**
		* API: Hide adder
		*/
		const hide = () => {
			patients.style.display = "none";
			div.style.display = "none";
		};
		
		/**
		* Init Adder and build staic DOM elements	
		*/
		(() => {
			// split patients into arrived and later groups
			json.forEach( patient => {
				if( patient.status == "active"){
					arrived.set( patient.uid, {
						time: patient.time, 
						lastname: patient.lastname
					});
				} 
				if( patient.status === 'todo' ){
					later.set( patient.uid, {
						time: patient.time, 
						lastname: patient.lastname
					});
				}
			});
			
			updatePatientList();
			
			/*
			Update actions are static, build once
			*/
			const updates = bj.div('update-actions');
			
			const doctors = ['MM', 'AB', 'AG', 'RB', 'CW'].sort();
			const people = ['Nurse'];
			const process = ['Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort();
			
			// helper
			const _li = ( code, type, html ) => {
				const li = document.createElement('li');
				li.setAttribute('data-shortcode', code );
				li.setAttribute('data-type', type);
				li.innerHTML = html;
				return li;
			};
			
			/*
			assignment options
			*/
			let row = _row('Assign to');
			let ul = _ul('btn-list');
			
			['unassigned'].concat( doctors ).forEach( code => {
				ul.append( _li( code, 'assign', clinic.fullShortCode( code ))); 
			});
			
			row.append( ul );
			updates.append( row );
			
			/*
			people & processes pathsteps
			*/
			row = _row('Add to patient pathway');
			ul = _ul('btn-list');
			
			// people
			[].concat( doctors, people ).forEach( code => {
				const fullText = clinic.fullShortCode( code );
				ul.append( _li( code, 'people', `${code} <small>- ${fullText}</small>`)); 
			});
			
			// processes 
			process.forEach( code => {
				const fullText = clinic.fullShortCode( code );
				ul.append( _li( code, 'process', `${code} <small>- ${fullText}</small>`)); 
			});
			
			row.append( ul );
			updates.append( row );
			
			/*
			build structure & hide it
			*/
			div.append( bj.div('close-btn'), patients, updates );
			hide();
			
			// update DOM
			document.querySelector('.oe-clinic').append( div );
	
		})();
		
		/* 
		API
		*/
		return { showAll, showSingle, hide, onPatientArrived, getSelectedPatients };
		
	};
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 