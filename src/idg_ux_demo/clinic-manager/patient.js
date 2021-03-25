(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @param {Func} updateAppFilters - callback for App
	* @returns {*} public methods
	*/
	const patient = ( props, updateAppFilters ) => {
		
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
				this._status = val; 
				this.views.notify();
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
				`<i class="oe-i plus-circle small-icon pad js-idg-clinic-icon-add" data-patient="${model.uid}"></i>`;
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
			psOwner.setCode( model.assigned );
		};
		
		model.views.add( onUpdateOwner );
		
		/**
		* @callback for PathStep change
		* need to know if a pathStep changes state
		* @param {String} newStepStatus - ps new status
		*/
		const onPathStepChange = ( newStepStatus ) => {
			switch( newStepStatus ){
				case "active":
					model.status = "active"; 
					pathway.stopWaiting();
					updateAppFilters(); // let the App know to update Filters
				break;
				case "done":
					// although a step is completed there may be another one still active
					if( pathway.addWaiting()) model.status = "waiting";
					updateAppFilters();
					
				break;
			}
		}
		
		/**
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			
			if( model.status == "done") return;
			
			switch( step.type ){
				case "arrive": 
					waitDuration.arrived( step.timestamp, model.status );
					step.info = bj.clock24( new Date ( step.timestamp ));
				break; 
				case "finish": 
					waitDuration.finished( step.timestamp );
					step.info = bj.clock24( new Date ( step.timestamp ));
					model.status = "done";
				break;
				default: 
					step.info = step.mins ? step.mins : "0"; // inbetween needs to show there duration in mins
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