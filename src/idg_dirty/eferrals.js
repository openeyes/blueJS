(function( bj ) {

	'use strict';
	
	if( document.querySelector('.oe-worklists.eferral-manager') === null ) return;
	
	/**
	e-referral manaager demo
	see: https://idg.knowego.com/v3/eferral-manager
	demo shows UI/UX behaviour for setting Risk and Pathways
	for selected patient lists.	
	*/
	
	const collection = new bj.Collection();
	
	/** 
	* update Patient Risk icon
	* @params {Element} icon
	* @params {Number} level
	*/
	const updateRiskIcon = ( icon, level ) => {
		const colours = ['grey', 'red', 'amber', 'green'];
		icon.className = `oe-i triangle-${colours[level]} selected`; // selected to remove cursor pointer
	};
	
	/**
	* @Class 
	* Patient 
	*/
	const Patient = {
		accepted: null, // rejected is false, accepted = true, starts unknown 
		tr:null, 
		
		// icons in <tr>
		iEdit:null, // pencil icon
		iState:null, // tick / cross
		
		// Strings
		fullName: 'JONES, David (Mr)', 
		nhs: '000',
		age: '42',
		gender: 'Male',
		
		// states
		riskNum: 0,
		_pathway: null, 
		
		/**
		Active / Inactive <tr> state
		*/
		active(){
			this.iEdit.classList.replace('pencil', 'pencil-blue');
			this.iEdit.classList.add('selected');	
			this.tr.classList.add('active');
		},
		inactive(){
			this.iEdit.classList.replace('pencil-blue', 'pencil');
			this.iEdit.classList.remove('selected');	
			this.tr.classList.remove('active');
		},
		
		/**
		User can reject the referral, if so update UI <tr> state
		*/
		accept(){
			this.accepted = true;
			this.iState.classList.replace('status-query', 'tick-green');
			this.iState.classList.replace('cross-red', 'tick-green');
		},
		
		reject(){
			this.accepted = false;
			this.iState.classList.replace('status-query', 'cross-red');
			this.iState.classList.replace('tick-green', 'cross-red');
		},
		
		/**
		Patient info (quick hack to show this)
		*/
		name(){
			return this.fullName;
		},
		details(){
			return `${this.gender}, ${this.age}y`;
		}, 
		
		/**
		Risk state
		*/
		setRisk( icon ){
			this.iRisk = icon;
			this.riskNum = ['grey', 'red', 'amber', 'green'].findIndex( colour => icon.classList.contains( `triangle-${colour}` ));
		}, 
		get risk(){
			let dom = `<i class="oe-i triangle-grey small pad-right"></i><b>Moderate</b>&nbsp;(R2)`;
			switch( this.riskNum ){
				case 1: dom = `<i class="oe-i triangle-red small pad-right"></i><b>High</b>&nbsp;(R1)`;
				break;
				case 2: dom = `<i class="oe-i triangle-amber small pad-right"></i><b>Moderate</b>&nbsp;(R2)`;
				break;
				case 3: dom = `<i class="oe-i triangle-green small pad-right"></i><b>Low</b>&nbsp;(R3)`;
				break;
			}
			return dom;
		}, 
		set risk( val ){
			this.riskNum = parseInt(val, 10);
			updateRiskIcon( this.iRisk, val );
			if( this.accepted === null ) this.accept();
		}, 
		
		/**
		Clinical Pathway
		*/
		set pathway( val ){
			this._pathway = val;
		}, 
		get pathway(){
			return this._pathway;
		}

	};
	
	
	/**
	* Initalise Patients. 
	* This is done from the DOM. It's set up to show a selection of lists
	* There could be a few tables that need setting up.
	*/
	const tables = bj.nodeArray( document.querySelectorAll('table.eferrals'));
	
	// loop through all the tables...
	tables.forEach(( table ) => {
		
		// then loop through all <tr> ...
		let rows = Array.from( table.tBodies[0].rows );
		
		rows.forEach(( row ) => {
			
			if( row.classList.contains('js-locked')) return;
			
			// build Patient
			let patient = Object.create( Patient );
			patient.tr = row;
			
			patient.iEdit = row.querySelector('.oe-i.pencil');
			patient.iState = row.querySelector('.oe-i.js-referral-status-icon');
			
			patient.fullName = row.querySelector('.patient-name').textContent;
			patient.age = row.querySelector('.patient-age').textContent.substring(3);
			patient.gender = row.querySelector('.patient-gender').textContent.substring(3);
			patient.nhs = row.querySelector('.nhs-number').textContent.substring(3);
			
			patient.setRisk( row.querySelector('[class*="triangle-"]'));
			patient.pathway = ( row.querySelector('.js-pathway').textContent );
			
			patient.hasImage = Math.random() >= 0.5; // show randomly a thumbnail attachment
			
			// Quick hack to get group header to show when patient is selected
			let workGroup = bj.getParent( row, '.worklist-group' );
			patient.group = workGroup.querySelector('.worklist-summary h2').textContent;
			
			// build DOM collections, store 'key', need it for 'next' / 'previous'
			patient.myKey = collection.add( patient, patient.iEdit );
		});
	});

	/**
	* Sidebar functionality 
	* workhorse.
	*/
	const sidebar = (() => {
		
		let activePatient = null;

		/** 
		* sidebar UI
		*/
		const ui = {
			view: {
				overview: document.getElementById('sidebar-eferral-overview'), 
				patient: document.getElementById('sidebar-manage-patient'), 
				reject: document.getElementById('sidebar-reject-accept')
			},
			btn: {
				overview: document.getElementById('idg-js-sidebar-viewmode-1'),
				patient: document.getElementById('idg-js-sidebar-viewmode-2'),
			}, 
			patient: {
				fullName: document.getElementById('js-sidebar-patient-fullname'),
				details: document.getElementById('js-sidebar-patient-details'),
				group: document.getElementById('js-sidebar-referral-group'),
				attachment: document.getElementById('js-demo-attachment-image'), 
				
				// sidebar uses adder filters but these don't work.
				// just need to update the filters to show the current selected patient
				risk: document.getElementById('sidebar-eref-patient-risk'), 
				pathway: document.getElementById('sidebar-eref-pathway'),
				tests: document.getElementById('sidebar-eref-tests'),				
			}	
		};
		
		/**
		* Update sidebar Reject / Accept area
		* @param {Boolean} True or Null means 'accepted'
		*/
		const showAsAccepted = ( b ) => {
			if( b || b === null ){
				bj.show( ui.view.reject.querySelector('.js-reject'));
				bj.hide( ui.view.reject.querySelector('.js-accept'));
			} else {
				bj.hide( ui.view.reject.querySelector('.js-reject'));
				bj.show( ui.view.reject.querySelector('.js-accept'));
			}
		}; 
		
		
		/** 
		public API
		*/
		
		/**
		* Callback from either "Reject" or "Accept" btn
		* Updates Patient. See Events.
		* @param {EventTarget} btn 
		*/
		const rejectPatient = ( btn ) => {
			// check which button by it's colour
			if( btn.classList.contains('red') ){
				// reject
				showAsAccepted( false );
				activePatient.reject();
			} else {
				// re-accept
				showAsAccepted( true );
				activePatient.accept();
			}
		};
		
		
		/**
		* Callback from "Overview" or "Manage Patient" buttons
		* This updates the sidebar UI
		* @param {String} view 
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
		
		/**
		* Set up the Patient area in sidebar
		* Controller calls this with the selected 'Patient'
		* @param {Patient} custom Object. 
		*/
		const managePatient = ( patient ) => {
			// inactive last patient?
			if( activePatient !== null ) activePatient.inactive();
			
			ui.patient.fullName.innerHTML = `<span class="highlighter">${patient.fullName}</span>`;
			ui.patient.details.innerHTML = [
				`<small class="fade">NHS</small> ${patient.nhs}`,  
				`&nbsp;<small class="fade">Gen</small> ${patient.gender}`,
				`&nbsp;<small class="fade">Age</small> ${patient.age}`
			].join('');
			
			// show the <table> row info	
			ui.patient.group.textContent = patient.group;
			
			// show state
			ui.patient.risk.innerHTML = patient.risk;
			ui.patient.pathway.innerHTML = `<b>${patient.pathway}</b>`;
		
			// hacky demo of attachment
			ui.patient.attachment.style.display = patient.hasImage ? 'block' : 'none';
			
			showAsAccepted( patient.accepted ); // ?
			
			patient.active();
			activePatient = patient;
		};
		
		/**
		* User can step through the patients from the sidebar
		*/
		const nextPatient = ( dir ) => {
			const patientKey = dir === "next" ?
				collection.next( activePatient.myKey ):
				collection.prev( activePatient.myKey );
				
			// if a key exists, show the patient data for it
			if( patientKey ){
				sidebar.managePatient( collection.get( patientKey ));
			}
		};

		// reveal the public methods
		return { 
			change, 
			managePatient, 
			nextPatient, 
			rejectPatient 
		};
		
	})();
	
	
	/**
	* Initise: setup the first patient by default
	*/
	document.addEventListener('DOMContentLoaded', () => {
		sidebar.managePatient( collection.getFirst() ); // default to first patient
		//sidebar.change('patient');
	}, { once: true });


	/**
	* Call back for <tr> edit icon
	* @param {Event} ev - use target to get the right Patient Key.
	*/
	const editPatient = ( ev ) => {
		let icon = ev.target; 
		let key = collection.getKey( icon );
		// view Patient and pass Patient
		sidebar.managePatient( collection.get( key ) );
		sidebar.change('patient');
	};
	
	/*
	* Events	
	*/
	bj.userDown('.js-edit-patient-icon', editPatient );	 // pencil icon on <tr>
	
	bj.userDown('#idg-js-sidebar-viewmode-1', () => sidebar.change('overview'));
	bj.userDown('#idg-js-sidebar-viewmode-2', () => sidebar.change('patient'));
	
	// navigating the patient list 
	bj.userDown('#side-patient-next-btn', () =>  sidebar.nextPatient("next"));
	bj.userDown('#side-patient-previous-btn', () => sidebar.nextPatient("prev"));
	
	// rejecting (or accepting) buttons
	bj.userDown('#sidebar-reject-accept button', ( ev ) => sidebar.rejectPatient( ev.target ));
	
	/**
	Allow users to use Keys to navigate the patient list
	*/
	document.addEventListener("keydown", ( ev ) => {
		ev.stopPropagation();
		if( ev.key === "z" ){
			sidebar.nextPatient("next");
		}
		if( ev.key === "a" ){
			sidebar.nextPatient("prev");
		}
	}, false );
	
	
})( bluejay ); 