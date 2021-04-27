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
			risks: document.createElement('td'),
			notes: document.createElement('td'),
			complete: document.createElement('td'),
		};
		
		/**
		* Pathway 
		*/
		const pathway = clinic.pathway( td.path );
		
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
			risk: null, // "-r1", "-r3", "-r3" etc 
	
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
			}
		}, bj.ModelViews());
		
		/**
		* VIEW: Status change
		* if patient is "complete" hide the specific + icon
		*/
		const onChangeStatus = () => {
			tr.className = model.status;
			pathway.setStatus( model.status );
			waitDuration.render( model.status );
			
			if( model.status == "done" ){
				td.addIcon.innerHTML = "<!-- completed pathway -->";
			}
			
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
		* @callback for PathStep change
		* need to know if a pathStep changes state
		* @param {PathStep} pathStep - ps new status
		*/
		const onPathStepChange = ( pathStep ) => {
			switch( pathStep.getStatus()){
				case "active": 
					pathway.stopWaiting();
				break;
				case "done":
					/*
					Add a waiting step, however if pathway 
					hits an 'auto-finish', it returns False.
					*/
					if( pathway.addWaiting() == false ){
						onComplete( true ); // auto-finish!
					}
				break;
				case "userRemoved":
					pathway.deleteRemovedStep( pathStep.key ); // User deleted through PathStepPopup
				break;
			}
			
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		/**
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			if( model.status == "done") return; // not active
			
			/*
			From adder user can add "todo" or "config" or "auto-finish" steps. 
			Pathway state could be: "waiting", "long-wait", "stuck" or "active" 
			*/
			if( step.shortcode == 'i-Arr' ) waitDuration.arrived( step.timestamp );
			if( step.shortcode == 'i-Fin' ){
				waitDuration.finished( step.timestamp );
				pathway.completed();
			}
			
			// if it's a wait it's counting the mins
			if( step.shortcode == 'i-Wait' || 
				step.shortcode == 'Waiting' ){
				step.info = step.mins;	
			} else {
				step.info = bj.clock24( new Date ( step.timestamp ));
			}
			// add step to pathway, along with the callback
			pathway.addStep( gui.pathStep( step, null, onPathStepChange ));
			
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		/**
		* Remove last PathStep from pathway 
		* @param {Object} step
		*/
		const removePathStep = ( code ) => {
			pathway.removeStep( code ); 
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		
		/**
		* @callbacks from App - User Events
		* Update Pathway with appropriate steps
		* {shortcode, status, type, info = (timestamp or mins), idgPopupCode}
		*/
		const onArrived = () => {
			addPathStep({
				shortcode: 'i-Arr',
				status: 'buff',
				type: 'arrive',
				timestamp: Date.now(),
				idgPopupCode: 'arrive-basic',
			});
			addPathStep({
				shortcode: 'i-Wait',
				status: 'buff',
				type: 'wait',
				mins: 0,
			});
		};
		
		const onDNA = () => {
			addPathStep({
				shortcode: 'DNA',
				status: 'done',
				type: 'DNA',
				timestamp: Date.now(),
			});
		};
		
		const onComplete = ( autostop = false ) => {
			if( model.status == "active" && !autostop) return;
			
			addPathStep({
				shortcode: 'i-Fin',
				status: 'buff',
				type: 'finish',
				timestamp: Date.now(),
			});
		};
		
		/**
		* set Priority
		* MEH has "priority"
		*/
		const setRisk = ( num ) => {
			if( num == undefined ) return; 
			
			const colors = ['grey','red','amber','green'];
			const icon = colors[ num ];
			let tip = "Low";
			switch( num ){
				case 3: tip = 'Standard'; break;
				case 2: tip = 'Urgent'; break;
				case 1: tip = 'Immediate'; break;
			}
			
			td.risks.innerHTML = `<i class="oe-i triangle-${icon} small-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="${tip}"></i>`;
			model.risk = num;
		};
		
		/**
		* Render Patient <tr>
		* @params {String} filter - filter buttons set this
		* @returns {Element} (if covered by filter option)	
		*/
		const render = ( filter ) => {
			const status = model.status;
			
			if( filter == "all" ){
				return tr;
			}
			
			// "clinic" is code for "in clinic", which then became "arrived", 
			// conceptually it's any state that isn't "done" or "later"
			if( filter == "clinic"){
				return 	status == 'done' ? null : 
						status == 'later' ? null : tr;
			}
			
			// is the filter a risk?
			// this is a bit different: 
			if( filter.startsWith('-r')){
				const r = parseInt( filter.charAt(2), 10);
				return r == model.risk ? tr : null;
			}
			
			// default if it status matches filter
			return status == filter ? tr : null;
		};
		
		/**
		* Initiate inital patient state from JSON	
		* and build the <tr> DOM
		*/
		(() => {
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));
			
			// patient select checkbox
			td.addIcon.innerHTML = `<label class="patient-checkbox"><input class="js-check-patient" value="${model.uid}" type="checkbox"><div class="checkbox-btn"></div></label>`;
			
			// set Flag (if there is one)
			setRisk( props.risk );
			
			// notes
			const psOwner = gui.pathStep({
				shortcode: 'i-Comments',
				status: 'buff',
				type: props.notes ? 'comments added' : 'comments',
				info: props.notes ? 'clock' : '&nbsp;', 
				idgPopupCode: props.notes ? false : 'i-comments-none'
			}, false );
			
			td.notes.append( psOwner.render());
			
			// Set patient status this will trigger VIEW notifications (an iDG hack!)
			model.status = props.status == 'fake-done' ? 'done' : props.status; 
		
			// build <tr>
			tr.setAttribute( 'data-timestamp', props.bookedTimestamp );
			tr.insertAdjacentHTML('beforeend', `<td>${props.time}</td>`);
			tr.insertAdjacentHTML('beforeend', `<td><div class="speciality">${props.clinic[0]}</div><small class="type">${props.clinic[1]}</small></td>`);
			
			// slightly more complex Elements and dynamic areas...
			tr.append( clinic.patientMeta( props ));
			tr.append( clinic.patientQuickView( props ));
			tr.append( td.path );
			tr.append( td.addIcon );
			tr.append( td.risks );
			tr.append( td.notes );	
			tr.append( waitDuration.render( model.status )); // returns a <td>
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
			getRisk: () => model.risk, 
			render, 
			addPathStep, 
			removePathStep, 
		};
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 