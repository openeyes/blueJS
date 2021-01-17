(function( bj, clinic, gui ){

	'use strict';	
	
	/**
	* Patient (<tr>)
	* @param {*} props
	* @returns {*} public methods
	*/
	const Patient = ( props ) => {
		/** 
		* Model
		* status:  "todo", "active", "complete"
		* Extended with views
		*/
		const model = Object.assign({
			_uid: props.uid,
			_status: null,
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
		
		/*
		Hold these Elements in memory, as they will need updating directly
		*/
		const tr = document.createElement('tr');
		const dom = {
			pathway: bj.div('pathway'),
			assigned: document.createElement('td'),
			addIcon: document.createElement('td'),
			complete: document.createElement('td'),
		};
		
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
			dom.pathway.className = `pathway ${model.status}`;
			dom.addIcon.innerHTML = model.status == "complete" ? "" : '<i class="oe-i plus-circle small pad"></i>';
			waitDuration.render( model.status );
		};
		
		/**
		* VIEW: patient assignment
		*/
		const changeAssignment = () => {
			if( model.assigned ){
				const fullText = clinic.fullShortCode( model.assigned );
				dom.assigned.innerHTML = `<div>${fullText}</div>`;
			} else {
				dom.assigned.innerHTML = '<small class="fade">Not asssigned</div>';
			}	
		};
		
		/**
		* VIEW: complete / done
		*/
		const changeComplete = () => {
			dom.complete.innerHTML = "";
			if( model.status == "complete"){
				dom.complete.innerHTML = '<span class="fade">Done</span>';
			}
			if( model.status == "active"){
				dom.complete.innerHTML = '<i class="oe-i save medium-icon pad js-has-tooltip" data-tt-type="basic" data-tooltip-content="Patient pathway finished"></i>';
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
			if( step.type == "arrive" )waitDuration.arrived( step.timestamp, model.status );
			if( step.type == "finish" ) waitDuration.finished( step.timestamp );
			// build pathStep
			gui.pathStep( step, dom.pathway, (step.type == "arrive"));
		};
		
		/*
		onArrived (Button: "Arrived")
		*/
		const onArrived = () => {
			// add Arrived Pathstep
			addPathStep({
				shortcode: 'Arr',
				timestamp: Date.now(),
				status: 'done',
				type: 'arrive',
			});
			model.status = "active";
		};
		
		/*
		onDNA (Button: "DNA")
		*/
		const onDNA = () => {
			// add Arrived Pathstep
			addPathStep({
				shortcode: 'DNA',
				timestamp: Date.now(),
				status: 'done',
				type: 'DNA',
			});
			model.status = "complete";
		};
		
	
		const render = ( filter ) => {
			
			console.log('render patient');
			
			/*
			Patients can be filtered by their assignment OR status 
			if filter is 'completed' check by status, else check assigned
			*/
			
/*
			if(	state == "hideComplete" && 
				this.props.status == 'complete' ) return null;
			
			if( this.props.clinicFilterState !== "showAll" &&
				this.props.clinicFilterState !== "hideComplete" ){
				
				if( this.props.assigned !== this.props.clinicFilterState ) return null;
			}
*/			
			
			return tr;
		};
		
		/*
		Initiate inital patient state from JSON	
		and build the <tr> DOM
		*/
		(() => {
			// patient state 
			model.status = props.status; 
			model.assigned = props.assigned;
			
			// build pathway steps
			props.pathway.forEach( step => addPathStep( step ));
			
			// convert to clock time
			props.time = bj.clock24( new Date( props.booked ));
			
			// build <tr>
			tr.setAttribute( 'date-timestamp', props.booked );
			tr.innerHTML = Mustache.render([
				'<td>{{time}}</td>',
				'<td>{{num}}</td>',
				'<td><div class="speciality">{{speciality}}</div><small class="type">{{specialityState}}</small></td>'
			].join(''), props );
			
			// slightly more complex Elements, but static content
			const td = document.createElement('td');
			tr.appendChild( clinic.patientQuickView( props ));
			tr.appendChild( clinic.patientMeta( props ));
			tr.appendChild( td.appendChild( dom.pathway ));		
			tr.appendChild( dom.assigned );
			tr.appendChild( dom.addIcon );
			tr.appendChild( waitDuration.render( props.status ));
			tr.appendChild( dom.complete );
		})();
		
		
		/* 
		API
		*/
		return { onArrived, onDNA, render };
	};
	
	// make component available to Clinic SPA	
	clinic.Patient = Patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 