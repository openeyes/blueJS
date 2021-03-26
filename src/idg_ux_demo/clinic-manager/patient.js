(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @returns {*} public methods
	*/
	const patient = ( props ) => {
		
		/**
		* Patient UI is a table row <tr>
		* Hold DOM elements for easy usage
		*/
		const tr = document.createElement('tr');
		const td = {
			path: document.createElement('td'),
			addIcon: document.createElement('td'),
			flags: document.createElement('td'),
			owner: document.createElement('td'),
			complete: document.createElement('td'),
		};
		
		/**
		* Pathway 
		*/
		const pathway = clinic.pathway( td.path );
		
		/* 
		* Owner
		*/
		const psOwner = gui.pathStep({
			shortcode: '?',
			status: 'buff',
			type: 'owner',
			info: '&nbsp;'
		}, false );
		
		td.owner.append( psOwner.render());
		
		/** 
		* WaitDuration widget
		*/
		const waitDuration = clinic.waitDuration( props.uid );
		

		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			uid: props.uid,
			_status: null, // "todo", "active", "complete", etc!
			_assigned: false,
	
			get status(){
				return this._status;
			},
			set status( val ){
				// 'fake-done', allows iDG to set up a completed pathway
				// it's changed back to "done" when "i-Fin" is pathstep is added
				const validStatus = ['fake-done', 'done', 'waiting', 'long-wait', 'active', 'stuck', 'later'].find( test => test == val );
				if( !validStatus ) throw new Error(`Clinic: invaild Patient status: "${val}"`);
				
				this._status = val; 
				this.views.notify();
				bj.customEvent('onClinicPatientStatusChange', model.status ); // App is listening!
			},
			get assigned(){
				return this._assigned; 
			},	
			set assigned( val ){
				this._assigned = val;
				this.views.notify();	
			},
		}, bj.ModelViews());
		
		/**
		* VIEW: Status change
		* if patient is "complete" hide the specific + icon
		*/
		const onChangeStatus = () => {
			tr.className = model.status;
			pathway.setStatus( model.status );
			waitDuration.render( model.status );
			
			// show + icon to add pathSteps?
			td.addIcon.innerHTML = model.status == "done" ? 
				"<!-- complete -->" :
				`<label class="patient-checkbox"><input class="js-check-patient" value="${model.uid}" type="checkbox"><div class="checkbox-btn"></div></label>`;
				
				
				//`<i class="oe-i plus-circle small-icon pad js-idg-clinic-icon-add" data-patient="${model.uid}"></i>`;
		};
		
		model.views.add( onChangeStatus );
		
		/**
		* VIEW: Pathway Completed
		* complete (tick icon) / done?
		*/
		const onChangeComplete = () => {
			const completeHTML = model.status == "done" ?
				'<small class="fade">Done</small>' :
				`<i class="oe-i save medium-icon pad js-has-tooltip js-idg-clinic-icon-complete" data-tt-type="basic" data-tooltip-content="Patient pathway finished" data-patient="${model.uid}"></i>`;

			// update DOM
			td.complete.innerHTML = model.status == "later" ?  "" : completeHTML;					
		};
		
		model.views.add( onChangeComplete );
		
		/** 
		* VIEW: Update Buffer
		*/
		const onUpdateOwner = () => {
			if( model.assigned ) psOwner.setCode( model.assigned );
		};
		
		model.views.add( onUpdateOwner );
		
		/**
		* @callback for PathStep change
		* need to know if a pathStep changes state
		* @param {PathStep} pathStep - ps new status
		*/
		const onPathStepChange = ( pathStep ) => {
			console.log( pathStep );
			
			const status = pathStep.getStatus();
			
			switch( status ){
				case "active":
					model.status = "active"; 
					pathway.stopWaiting();
				break;
				case "done":
					// pathway returns status depending on it's state
					const pathwayStatus = pathway.addWaiting();
					if( pathwayStatus == "auto-finish"){
						onComplete();
					} else if( pathwayStatus ){
						model.status = pathwayStatus;
					}
				break;
				case "userRemoved":
					// User deleted through PathStepPopup
					pathway.deleteRemovedStep( pathStep.key ); 
				break;
				
			}
		};
		
		/**
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			
			if( model.status == "done") return;
			
			step.info = bj.clock24( new Date ( step.timestamp ));
			
			switch( step.shortcode ){
				case "i-Arr": 
					waitDuration.arrived( step.timestamp, model.status );
				break; 
				case "i-Fin": 
					waitDuration.finished( step.timestamp );
					model.status = "done";
				break;
				case 'i-Wait':
				case 'Waiting':
					step.info = step.mins ? step.mins : "0"; // inbetween needs to show there duration in mins
				break; 
			}

			
			// create a new Pathstep
			// step - {shortcode, status, type, info, idgPopupCode}
			pathway.addStep( gui.pathStep( step, null, onPathStepChange ));
		};
		
		
		/**
		* set Flags
		*/
		const flag = ( arr ) => {
			if( arr == undefined ) return; 
			const colors = ['grey','red','orange','green'];
			const icon = colors[arr[0]];
			const tip = arr[1];
			td.flags.innerHTML = `<i class="oe-i flag-${icon} small-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="${tip}"></i>`;
		};
		
		/**
		* 'on' Handlers for Event delegation
		*/
		const onArrived = () => {
			addPathStep({
				shortcode: 'i-Arr',
				timestamp: Date.now(),
				status: 'buff',
				type: 'arrive',
				idgPopupCode: 'arrive-basic',
			});
			addPathStep({
				shortcode: 'i-Wait',
				mins: 0,
				status: 'buff',
				type: 'wait',
			});
			
			model.status = "waiting";
		};
		
		const onDNA = () => {
			addPathStep({
				shortcode: 'DNA',
				timestamp: Date.now(),
				status: 'done',
				type: 'DNA',
			});
			model.status = "done";
		};
		
		const onComplete = () => {
			addPathStep({
				shortcode: 'i-Fin',
				timestamp: Date.now(), 
				status: 'buff',
				type: 'finish',
			});
			model.status = "done";
		};
		
		/**
		* Render Patient <tr>
		* @params {String} filter - filter buttons set this
		* @returns {Element} (if covered by filter option)	
		*/
		const render = ( filter ) => {
			const status = model.status;
			switch( filter ){
				case "all": return tr;
				case "hide-done": return status == 'done' ? null : tr;
				default:  return status == filter ? tr : null;
			}
		};
		
		/**
		* Initiate inital patient state from JSON	
		* and build the <tr> DOM
		*/
		(() => {
			// patient state 
			model.status = props.status; 
			model.assigned = props.assigned;
			model.nameAge = `${props.lastname} <span class="fade">${props.age}</span>`;
			
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));

			flag( props.f );
			
			// build <tr>
			tr.setAttribute( 'data-timestamp', props.bookedTimestamp );
			
			tr.insertAdjacentHTML('beforeend', `<td>${props.time}</td>`);
			tr.insertAdjacentHTML('beforeend', `<td><div class="speciality">${props.clinic[0]}</div><small class="type">${props.clinic[1]}</small></td>`);
			
			// slightly more complex Elements and dynamic areas...
			tr.append( clinic.patientMeta( props ));
			tr.append( clinic.patientQuickView( props ));
			tr.append( td.path );
			tr.append( td.addIcon );
			tr.append( td.owner );	
			tr.append( td.flags );
			tr.append( waitDuration.render( props.status )); // returns a <td>
			tr.append( td.complete );
			
		})();
			
		/**
		* API
		*/
		return { 
			onArrived, 
			onDNA, 
			onComplete, 
			getID: () => model.uid, 
			getStatus: () => model.status, 
			setAssigned: ( val ) => model.assigned = val, 
			getNameAge: () => model.nameAge, 
			render, 
			addPathStep, 
			removePathStep: ( code ) => pathway.removeStep( code), 
		};
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 