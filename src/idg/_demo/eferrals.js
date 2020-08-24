(function( bj ) {

	'use strict';
	
	if( document.querySelector('.oe-worklists.eferral-manager') === null ) return;
	
	const collection = new bj.Collection();
	
	// MUST match array in PHP.
	const pathways = ['DRSS', 'Cataract', 'Glaucoma', 'Uveitis', 'Lucentis', 'Glaucoma ODTC', 'Laser/YAG', 'General', 'Ocular Motility', 'Oculoplastic', 'Neuro', 'Botox', 'Corneal', 'VR', 'Paediatric Ophthalmology', 'Paediatric Neuro-Ophthalmology'];
	
	/**
	* Work out Risk number from CSS class
	* @param {String} classes
	* @returns {Number} risk
	*/
	const riskLevelFromClass = ( cssStr ) => {
		if( cssStr.includes('green')) return 3;
		if( cssStr.includes('amber')) return 2;
		if( cssStr.includes('red')) return 1;
		return 0;
	};
	
	/** 
	* update patient risk icon
	* @params {Element} icon
	* @params {Number} level
	*/
	const updateRiskIcon = ( icon, level ) => {
		const colours = ['grey', 'red', 'amber', 'green'];
		icon.className = `oe-i triangle-${colours[level]}`;
	};
	
	const getPathywayNum = ( str ) => {
		let pathIndex = 99;
		pathways.forEach(( path, index ) => {
			if( str == path ) pathIndex = index;
		});
		return pathIndex; // No pathway
	};
	
	/**
	* @Class 
	* Patient 
	*/
	const Patient = {
		tr:null,
		editIcon: "dom", 
		fullName: 'JONES, David (Mr)', 
		age: '42',
		gender: 'Male',
		riskIcon: null,
		riskNum: 0,
		pathElem: null,
		pathNum: 99, 
		
		active(){
			this.editIcon.classList.replace('pencil', 'direction-right');
			this.editIcon.classList.replace('small-icon', 'large');
			this.editIcon.classList.add('selected');	
			this.tr.classList.add('active');
		},
		inactive(){
			this.editIcon.classList.replace('direction-right', 'pencil');
			this.editIcon.classList.replace('large', 'small-icon');
			this.editIcon.classList.remove('selected');	
			this.tr.classList.remove('active');
		},
		
		name(){
			return this.fullName;
		},
		details(){
			return `${this.gender}, ${this.age}y`;
		}, 
		setRisk( icon ){
			this.riskIcon = icon;
			this.riskNum = riskLevelFromClass( icon.className );
		}, 
		get risk(){
			return this.riskNum;
		}, 
		set risk( val ){
			this.riskNum = parseInt(val, 10);
			updateRiskIcon( this.riskIcon, val );
		}, 
		setPathway( elem ){
			this.pathElem = elem;
			this.pathNum = getPathywayNum( elem.textContent );
		}, 
		set pathway( val ){
			this.pathNum = parseInt(val, 10);
			this.pathElem.textContent = pathways[ this.pathNum ];
		}, 
		get pathway(){
			return this.pathNum;
		}
	};
	
	/**
	Could be a few tables that need setting up.
	*/
	const tables = bj.nodeArray( document.querySelectorAll('table.eferrals'));
	// loop through tables
	tables.forEach(( table ) => {
		// loop through all <tr>
		let rows = Array.from( table.tBodies[0].rows );
		rows.forEach(( row ) => {
			// build Patient
			let patient = Object.create( Patient );
			patient.tr = row;
			patient.editIcon = row.querySelector('.oe-i.pencil');
			patient.fullName = row.querySelector('.patient-name').textContent;
			patient.age = row.querySelector('.patient-age').textContent.substring(3);
			patient.gender = row.querySelector('.patient-gender').textContent.substring(3);
			patient.setRisk( row.querySelector('[class*="triangle-"]'));
			patient.setPathway( row.querySelector('.js-pathway') );
			
			// build DOM collections
			patient.myKey = collection.add( patient, patient.editIcon );
		});
	});

	/**
	* Sidebar functionality 
	* workhorse.
	*/
	const sidebar = (() => {
		
		let activePatient = null;
	
		const radioRisks = bj.nodeArray( document.querySelectorAll('#sidebar-patient-risk-settings input')); 
		const radioPathways = bj.nodeArray( document.querySelectorAll('#sidebar-pathway-settings input'));
	
		/** 
		* sidebar UI
		*/
		const ui = {
			view: {
				overview: document.getElementById('sidebar-eferral-overview'), 
				patient: document.getElementById('sidebar-manage-patient'), 
			},
			btn: {
				overview: document.getElementById('idg-js-sidebar-viewmode-1'),
				patient: document.getElementById('idg-js-sidebar-viewmode-2'),
			}, 
			patient: {
				fullName: document.getElementById('js-sidebar-patient-fullname'),
				details: document.getElementById('js-sidebar-patient-details'),
			}	
		};
		
		// Set the radio selection
		const setRadio = ( arr, num ) => {
			arr.forEach(( radio ) => {
				radio.checked = ( num == radio.value );
			});
		};
		
		/** 
		* public API
		*/
		
		const change = ( view ) => {
			if( view == "overview" ){
				bj.show( ui.view.overview );
				bj.hide( ui.view.patient );
				ui.btn.overview.classList.add('selected');
				ui.btn.patient.classList.remove('selected');
			} else {
				bj.hide( ui.view.overview );
				bj.show( ui.view.patient );
				ui.btn.overview.classList.remove('selected');
				ui.btn.patient.classList.add('selected');
			}
		};
		
		const managePatient = ( patient ) => {
			// inactive last patient?
			if( activePatient !== null ) activePatient.inactive();
			
			ui.patient.fullName.textContent = patient.fullName;
			ui.patient.details.textContent = `${patient.gender}, ${patient.age}`;
			
			setRadio( radioRisks, patient.riskNum );
			setRadio( radioPathways, patient.pathNum );
			
			patient.active();
			activePatient = patient;
		};
		
		const nextPatient = ( dir ) => {
			let patientKey;
			
			if( dir == "next" ){
				patientKey  = collection.next( activePatient.myKey );
			} else {
				patientKey  = collection.prev( activePatient.myKey );
			}
			
			// if a key was found, show the patient data for it
			if( patientKey ){
				sidebar.managePatient( collection.get( patientKey ));
			}
		};
		
		// User updates the settings
		document.addEventListener('change', ( ev ) => {
			let input = ev.target; 
			if( input.name === 'idg-radio-g-patient-risk' ){
				activePatient.risk = input.value;
			}	
			
			if( input.name === 'idg-radio-g-patient-pathway' ){
				activePatient.pathway = input.value;
			}
		});
		
		// public
		return { change, managePatient, nextPatient };
		
	})();
	
	
	/**
	Setup first patient 
	*/
	document.addEventListener('DOMContentLoaded', () => {
		sidebar.managePatient( collection.getFirst() ); // default to first patient
		sidebar.change('patient');
	}, { once: true });
	
	
	/**
	* User events
	*/
	const editPatient = ( ev ) => {
		let icon = ev.target; 
		let key = collection.getKey( icon );
		// view Patient and pass Patient
		sidebar.managePatient( collection.get( key ) );
		sidebar.change('patient');
	};
	/*
	Events	
	*/
	bj.userDown('#idg-js-sidebar-viewmode-1', () => sidebar.change('overview'));
	bj.userDown('#idg-js-sidebar-viewmode-2', () => sidebar.change('patient'));
	
	// navigating the patient list
	bj.userDown('#side-patient-next-btn', () =>  sidebar.nextPatient("next"));
	bj.userDown('#side-patient-previous-btn', () => sidebar.nextPatient("prev"));
	
	// use arrow keys
	document.addEventListener("keydown", ( ev ) => {
		ev.stopPropagation();
		if( ev.key === "ArrowDown" ){
			sidebar.nextPatient("next");
		}
		if( ev.key === "ArrowUp" ){
			sidebar.nextPatient("prev");
		}
	}, false );
	
	
	bj.userDown('.js-edit-patient-icon', editPatient );	
	
})( bluejay ); 