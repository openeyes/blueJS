(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @param {Boolean} usesPriority - Risk icon is triangle / Priority is circle
	* @returns {*} public methods
	*/
	const patient = ( props, usesPriority = false ) => {
		
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
		* input[type=checkbox] ( UI is "+" icon)
		*/
		const tick = bj.dom('input', 'js-check-patient');
		tick.setAttribute('type', 'checkbox');
		

		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			uid: props.uid,
			isRendered: false,
			_status: null, // "todo", "active", "complete", etc!
			risk: null, // "-r1", "-r3", "-r3" etc 
			redFlagged: false,
			
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
		* @method
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			if( model.status == "done") return; // not active
			
			if( step.shortcode == 'i-RedFlag'){
				model.redFlagged = true;
			}
			
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
		* @method
		* Remove last PathStep from pathway 
		* @param {Object} step
		*/
		const removePathStep = ( code ) => {
			pathway.removeStep( code ); 
			// update patient status based on pathway
			model.status = pathway.getStatus();
		};
		
		
		/**
		* Set Priority (A&E has priority)
		* uses "circle" icons
		* @param {Number} num - level
		*/
		const setRisk = ( num ) => {
			if( num == undefined ) return; 
			
			const icon = usesPriority ? 'circle' : 'triangle';
			const size = usesPriority ? 'medium-icon' : '';
			const color = ['grey','red','amber','green'][ num ];
			
			let tip = "{{tip}}";
			switch( num ){
				case 3: tip = usesPriority ? 'Priority: Standard' : 'Patient Risk: 2 (Low)'; break;
				case 2: tip = usesPriority ? 'Priority: Urgent' : 'Patient Risk: 2 (Medium)'; break;
				case 1: tip = usesPriority ? 'Priority: Immediate' : 'Patient Risk: 1 (High)'; break;
			}
			
			td.risks.innerHTML = `<i class="oe-i ${icon}-${color} ${size} js-has-tooltip" data-tt-type="basic" data-tooltip-content="${tip}"></i>`;
			model.risk = num;
		};

		
		/**
		* Initiate inital patient state from JSON	
		* and build the <tr> DOM
		*/
		(() => {
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));
			
			// Add patient select checkbox ("tick")
			// CSS styles this to look like a "+" icon
			// build node tree
			tick.setAttribute('value', `${model.uid}`);
			
			const label = bj.dom('label', 'patient-checkbox');
			const checkboxBtn = bj.div('checkbox-btn');
			label.append( tick, checkboxBtn );
			td.addIcon.append( label );
			
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
			tr.insertAdjacentHTML('beforeend', `<td><div class="list-name">${props.clinic[0]}</div><div class="code">${props.clinic[1]}</div></td>`);
			
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
		* @methods
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
		* @method 
		* Users can select all or none of currently viewed patients
		* @param {Boolean} b 
		*/
		const setTicked = ( b ) => {
			if( model.status == "done") return;
			if( !model.isRendered && b ) return;
			tick.checked = b;	
		}; 
		
		/**
		* @returns {Boolean} - checkbox state
		*/
		const isTicked = () => tick.checked;
		
		/**
		* @method
		* Render Patient <tr> if it matches filter
		* @params {String} filter - header filter buttons set this
		* @returns {Element} (if covered by filter option)	
		*/
		const render = ( filter ) => {
			let renderDOM = false;
	
			if( filter == "all" ){
				renderDOM = true;
			} else if( filter == "clinic") {
				renderDOM = !( model.status == 'done' || model.status == 'later');
			} else {
				// red flagged? 
				if( filter.startsWith('-f')){
					renderDOM = model.redFlagged;
				} else {
					renderDOM = ( model.status == filter );
				}
			}
			
			model.isRendered = renderDOM;
			return renderDOM ? tr : null;
		};	
			
		/* API */
		return { 
			onArrived, 
			onDNA, 
			onComplete, 
			getID(){ return model.uid; }, 
			getStatus(){ return model.status; },
			//getRisk(){ return model.risk; },
			getRedFlagged(){ return model.redFlagged; },
			render, 
			addPathStep, 
			removePathStep,
			setTicked,
			isTicked 
		};
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 