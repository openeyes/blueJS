(function( bj, clinic ){

	'use strict';	
	
	/**
	* @param {JSON} json
	* @parm {Function} handlePatientUpdates - hard link to app function
	*/
	const adder = ( json, handlePatientUpdates ) => {
		
		// hold in memory
		const patients = bj.div('patients'); 
		const arrived = new Map();
		const later = new Map();
		
		/**
		* <div> row with <h4> title 
		* @param {String} title
		* @returns {Element};
		*/
		const _row = ( title ) => {
			const row = bj.div('row');
			row.innerHTML = `<h4>${title}</h4>`;
			return row;
		}
		
		/**
		* <ul>
		* @param {String} class
		* @returns {Element};
		*/
		const _ul = ( css ) => {
			const ul = document.createElement('ul');
			ul.className = css;
			return ul;
		} 
		
		
		/**
		* Every time a patient arrives this needs updating
		*/
		const showPatientList = () => {
			const list = ( title, listMap ) => {
				
				const row = _row( title );
				const ul = _ul("row-list");
				
				listMap.forEach(( value, key ) => {
					const li = document.createElement('li');
					li.innerHTML = `<label class="highlight"><input type="checkbox" value="${key}" /><span>${value.time} - ${value.lastname}</span></label>`;
					ul.appendChild( li );
				});
				
				row.append( ul );
				return row;
			} 
			
			// update DOM
			patients.innerHTML = "";
			patients.appendChild( list( "Arrived", arrived ));
			patients.appendChild( list( "Later", later ));			
		}
		

		const checkedPatientList = () => {
			const selectedPatients = new Set();
				
			const checkPatients = bj.nodeArray( document.querySelectorAll('.oe-clinic-adder .patients input'));
			checkPatients.forEach( patient => {
				if( patient.checked ) selectedPatients.add( patient.value );
			});
		}
				
		
		/*
		Init Clinic Adder	
		*/
		(() => {

			const div = bj.div('oe-clinic-adder'); 
			
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
			
			showPatientList();
			
			/*
			Update actions are static, build once
			*/
			const doctors = ['MM', 'AB', 'AG', 'RB', 'CW'].sort();
			const people = ['Nurse'];
			const process = ['Dilate', 'VisAcu', 'Orth', 'Ref', 'Img', 'Fields' ].sort();
			
			const updates = bj.div('update-actions');
			
			// assignment options
			let row = _row('Assign to');
			let ul = _ul('btn-list');
			
			const assignTo = ['unassigned'].concat( doctors );
			assignTo.forEach( code => {
				const li = document.createElement('li');
				li.setAttribute('data-shortcode', code );
				li.setAttribute('data-type', 'assign');
				li.textContent = clinic.fullShortCode( code );
				ul.appendChild( li ); 
			});
			
			row.append( ul );
			updates.appendChild( row );
			
			
			// people & processes pathsteps
			row = _row('Add to patient pathway');
			ul = _ul('btn-list');
			
			// people
			const peopleSteps = [].concat( doctors, people );
			peopleSteps.forEach( code => {
				const fullText = clinic.fullShortCode( code );
				const li = document.createElement('li');
				li.setAttribute('data-shortcode', code );
				li.setAttribute('data-type', 'people');
				li.innerHTML = `${code} <small>- ${fullText}</small>`;
				ul.appendChild( li ); 
			});
			
			// processes 
			process.forEach( code => {
				const fullText = clinic.fullShortCode( code );
				const li = document.createElement('li');
				li.setAttribute('data-shortcode', code );
				li.setAttribute('data-type', 'process');
				li.innerHTML = `${code} <small>- ${fullText}</small>`;
				ul.appendChild( li ); 
			});
			
			row.append( ul );
			updates.appendChild( row );
			
			// build structure.
			div.append( bj.div('close-btn'), patients, updates );
			
			// update DOM
			document.querySelector('.oe-clinic').appendChild( div );
	
		})();
		
		/**
		* API patient arrived, need to update my lists
		* @param {String} id - patient key
		*/
		const onPatientArrived = ( id ) => {
			if( later.has( id )){
				arrived.set( id, later.get(id));
				later.delete( id );
			}	
		};	
		
		return { onPatientArrived }
		
	}
	
	clinic.adder = adder;
		


})( bluejay, bluejay.namespace('clinic') ); 