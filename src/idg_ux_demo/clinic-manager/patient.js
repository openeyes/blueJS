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
		* Hold elements for ease of access
		*/
		const pathway =  bj.div('pathway');
		const tr = document.createElement('tr');
		const td = {
			path: document.createElement('td'),
			addIcon: document.createElement('td'),
			flags: document.createElement('td'),
			risk: document.createElement('td'),
			complete: document.createElement('td'),
		};
		
		// DOM structure for pathway
		td.path.append( pathway );	 
		
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_uid: props.uid,
			_status: null, // "todo", "active", "complete"
			_assigned: false,
			_bufferStep: false, // buffer step tracks the last step until it's finished
			
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
		* GETTER / SETTER: App needs to get and set patient assigned from Adder
		*/
		const getStatus = () => model.status;
		
		const setAssigned = ( val ) => model.assigned = val;
		
		const getTime = () => model.time;
		const getLastname = () => model.lastname;
		
		/*
		WaitDuration is based on the Arrival time and rendered based on 
		patient state, when patient arrives start the clock
		*/
		const waitDuration = clinic.waitDuration( props.uid );
		
		/**
		* VIEW: status of patient
		* if patient is "complete" hide the specific + icon
		*/
		const changeStatus = () => {
			tr.className = model.status;
			pathway.className = `pathway ${model.status}`;
			td.addIcon.innerHTML = model.status == "complete" ? 
				"<!-- complete -->" : `<i class="oe-i plus-circle small-icon pad js-idg-clinic-icon-add" data-patient="${model._uid}"></i>`;
			
			waitDuration.render( model.status );
		};
		
		model.views.add( changeStatus );
		
		/**
		* VIEW: complete (tick icon) / done
		*/
		const changeComplete = () => {
			td.complete.innerHTML = "";
			switch( model.status ){
				case "complete": td.complete.innerHTML = '<span class="fade">Done</span>';
				break;
				case "active": td.complete.innerHTML = `<i class="oe-i save medium-icon pad js-has-tooltip js-idg-clinic-icon-complete" data-tt-type="basic" data-tooltip-content="Patient pathway finished" data-patient="${model._uid}"></i>`;
			}
		};
		
		model.views.add( changeComplete );
		
		/**
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			
			switch( step.type ){
				case "arrive": 
					waitDuration.arrived( step.timestamp, model.status );
					step.info = bj.clock24( new Date ( step.timestamp ));
				break; 
				case "finish": 
					waitDuration.finished( step.timestamp );
					step.info = bj.clock24( new Date ( step.timestamp ));
				break;
				default: 
					step.info = step.mins ? step.mins : "0"; // inbetween needs to show there duration in mins
			}
			
			gui.pathStep( step, pathway );
		};
		
		/**
		* Risks 
		*/
		const risk = ( r ) => {
			let icon = 'grey';
			let tip = 'Not assessed';
			switch( r ){
				case 3:	
					icon = 'green';
					tip = 'Patient Risk: 3 (Low).<br>Mild consequences from delayed appointment. <br>Previous Cancelled: 1';
				break;
				case 2:
					icon = 'orange';
					tip = 'Patient Risk: 2 (Medium).<br>Reversible harm from delayed appointment. <br>Previous Cancelled: 0';	
				break;
				case 1:	
					icon = 'red';
					tip = 'Patient Risk: 1 (High).<br>Irreversible harm from delayed appointment. Do NOT rescheduled patient. <br>Previous Cancelled: 0';
				break;
			}
			
			td.risk.innerHTML = `<i class="oe-i triangle-${icon} small-icon js-has-tooltip" data-tt-type="basic" data-tooltip-content="${tip}"></i>`;
		};
		
		/**
		* Flags
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
				status: 'done',
				type: 'arrive',
			});
			addPathStep({
				shortcode: 'Waiting',
				mins: 1,
				status: 'w-room',
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
			model.status = "complete";
		};
		
		const onComplete = () => {
			addPathStep({
				shortcode: 'i-Fin',
				timestamp: Date.now(), 
				status: 'done',
				type: 'finish',
			});
			model.status = "complete";
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
				case "hide-done": return status == 'complete' ? null : tr;
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
			model.time = props.time;
			model.lastname = props.lastname;
			
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));
			
			risk( props.r );
			flag( props.f );
			
			// build <tr>
			tr.setAttribute( 'data-timestamp', props.booked );
			
			tr.insertAdjacentHTML('beforeend', `<td>${props.time}</td>`);
			tr.insertAdjacentHTML('beforeend', `<td><div class="speciality">${props.clinic[0]}</div><small class="type">${props.clinic[1]}</small></td>`);
			tr.insertAdjacentHTML('beforeend', `<td>${props.dob}</td>`);
			
			// slightly more complex Elements and dynamic areas...
			tr.append( clinic.patientMeta( props ));
			tr.append( clinic.patientQuickView( props ));
			tr.append( td.path );
			tr.append( td.addIcon );
			tr.append( td.risk );	
			tr.append( td.flags );
			tr.append( waitDuration.render( props.status )); // returns a <td>
			tr.append( td.complete );
		})();
			
		/* 
		API
		*/
		return { onArrived, onDNA, onComplete, render, getStatus, setAssigned, getTime, getLastname, addPathStep };
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 