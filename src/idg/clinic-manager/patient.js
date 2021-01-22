(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @returns {*} public methods
	*/
	const patient = ( props ) => {
		
		const tr = document.createElement('tr');
		const pathway =  bj.div('pathway');
		const assigned = document.createElement('td');
		const addIcon = document.createElement('td');
		const complete = document.createElement('td');
		
		/** 
		* Model
		* Extended with views
		*/
		const model = Object.assign({
			_uid: props.uid,
			_status: null, // "todo", "active", "complete"
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
		* GETTER / SETTER: App needs to get and set patient assigned from Adder
		*/
		const getAssigned = () => model.assigned;
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
			addIcon.innerHTML = model.status == "complete" ? 
				"" : 
				`<i class="oe-i plus-circle small-icon pad js-idg-clinic-icon-add" data-patient="${model._uid}"></i>`;
			
			waitDuration.render( model.status );
		};
		
		/**
		* VIEW: patient assignment
		*/
		const changeAssignment = () => {
			const fullText = clinic.fullShortCode( model.assigned );
			assigned.innerHTML = model.assigned == "unassigned" ?  
				`<small class="fade">${fullText}</small>` : 
				`<div>${fullText}</div>`;
		};
		
		/**
		* VIEW: complete (tick icon) / done
		*/
		const changeComplete = () => {
			complete.innerHTML = "";
			if( model.status == "complete"){
				complete.innerHTML = '<span class="fade">Done</span>';
			}
			if( model.status == "active"){
				complete.innerHTML = `<i class="oe-i save medium-icon pad js-has-tooltip js-idg-clinic-icon-complete" data-tt-type="basic" data-tooltip-content="Patient pathway finished" data-patient="${model._uid}"></i>`;
			}
		};
		
		model.views.add( changeStatus );
		model.views.add( changeAssignment );
		model.views.add( changeComplete );
		
		/**
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			if( step.type == "arrive" ) waitDuration.arrived( step.timestamp, model.status );
			if( step.type == "finish" ) waitDuration.finished( step.timestamp );
			// build pathStep
			step.info = bj.clock24(  new Date ( step.timestamp ));
			gui.pathStep( step, pathway );
		};
		
		/**
		* 'on' Handlers for Event delegation
		*/
		const onArrived = () => {
			addPathStep({
				shortcode: 'Arr',
				timestamp: Date.now(),
				status: 'done',
				type: 'arrive',
			});
			model.status = "active";
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
				shortcode: 'Fin',
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
			// completed?
			if(	filter == "completed" && 
				model.status == 'complete' ) return null;
			
			// assigned?
			if( filter !== "all" &&
				filter !== "completed" ){
				if( model.assigned !== filter) return null;
			}
			// ok! 	
			return tr;
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
			
			// build <tr>
			tr.setAttribute( 'data-timestamp', props.booked );
			tr.innerHTML = Mustache.render([
				'<td>{{time}}</td>',
				'<td>{{num}}</td>',
				'<td><div class="speciality">{{speciality}}</div><small class="type">{{specialityState}}</small></td>'
			].join(''), props );
			
			// slightly more complex Elements, but static content
			
			tr.append( clinic.patientQuickView( props ));
			tr.append( clinic.patientMeta( props ));
			tr.append( addIcon );
			
			const td = document.createElement('td');
			td.append( pathway );
			tr.append( td );	
				
			tr.append( assigned );
			tr.append( waitDuration.render( props.status ));
			tr.append( complete );
		})();
			
		/* 
		API
		*/
		return { onArrived, onDNA, onComplete, render, getAssigned, setAssigned, getTime, getLastname, addPathStep };
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 