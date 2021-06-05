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
				// it's changed back to "done" when "i-fin" is pathstep is added
				const validStatus = ['fake-done', 'done', 'waiting', 'long-wait', 'active', 'stuck', 'later', 'break','discharged'].find( test => test == val );
				if( !validStatus ) throw new Error(`Clinic: invaild Patient status: "${val}"`);
				
				this._status = val; 
				this.views.notify();
				bj.customEvent('idg:PatientStatusChange', model.status ); // App is listening!
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
				td.addIcon.innerHTML = "<!-- pathway done -->";
			}
			
		};
		
		model.views.add( onChangeStatus );
		
		/**
		* VIEW: Pathway complete btn
		* Pathways can only be complete based on the pathway state
		* complete (tick icon)
		*/
		const onChangeComplete = () => {
			const buildIcon = ( i, size, hook, tip ) => {
				td.complete.innerHTML = [
					`<i class="oe-i ${i} ${size}-icon pad js-has-tooltip ${hook}"`,
					`data-tooltip-content="${tip}"`, 
					`data-patient="${model.uid}"></i>`
				].join(' ');
			};
			
			if( model.status == 'later' ){
				buildIcon('no-permissions', 'small', '', 'Pathway not started');
			} else if ( model.status == 'later' ){
				buildIcon('tick', 'small', '', 'Pathway not started');
			} else if( pathway.canComplete()){
				buildIcon('save', 'medium', 'js-idg-clinic-icon-complete', 'Pathway completed');
			} else if ( model.status == "discharged") {
				buildIcon('save-blue', 'medium', 'js-idg-clinic-icon-finish', 'Quick complete pathway');
			} else {
				buildIcon('finish', 'medium', 'js-idg-clinic-icon-finish', 'Patient has left<br/>Quick complete pathway');
			}				
		};
		
		model.views.add( onChangeComplete );
		
		/**
		* @method
		* Add PathStep to patient pathway
		* @param {Object} step
		*/
		const addPathStep = ( step ) => {
			if( model.status == "done") return; // not active
			
			if( step.shortcode == 'i-redflag'){
				model.redFlagged = true;
			}
			
			// check against "props" because arr block exists in "later"
			// pathways...
			if( step.shortcode == 'i-arr' && props.status != 'later'){
				waitDuration.arrived( step.timestamp );
			}
			
			if( step.shortcode == 'i-fin' ){
				waitDuration.finished( step.timestamp );
				pathway.completed();
			}
			
			if( step.shortcode == 'i-break'){
				pathway.stopWaiting();
			}
			
			// if it's a wait it's counting the mins
			if( step.shortcode == 'i-wait' || 
				step.shortcode == 'i-delayed' ){
				step.info = step.mins;	
			} else {
				step.info = bj.clock24( new Date ( step.timestamp ));
			}
			// add step to pathway, along with the callback
			pathway.addStep( gui.pathStep( step, null, model.uid ));
			
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
		* @listener: PathStep change
		* need to know if a pathStep changes state / or if the
		* user has shifted the position.
		*/
		document.addEventListener('idg:pathStepChange', ev => {
			const pathStep = ev.detail;
			
			// only interested in PathSteps events for my pathway!
			if( pathStep.pathwayID != model.uid ) return;
			
			switch( pathStep.getStatus()){
				case "active": 
					pathway.stopWaiting();
				break;
				case "done":
					/* 
					Patient is discharge. However, their pathway may 
					still have tasks to do. e.g. Letter, blood, ect
					*/
					if( pathStep.getCode() == "i-discharge"){
						waitDuration.finished( Date.now());
						pathway.discharged();
					} else {
						pathway.addWaiting();
					}
					
				break;
				case "buff": 
					// "break" is over?
					if( pathStep.getType() == "break-back"){
						pathway.addWaiting();
					}
				break;
				case "userRemoved":
					pathway.deleteRemovedStep( pathStep.key ); // User deleted through PathStepPopup
				break;
				
			}
			
			// update patient status based on pathway
			model.status = pathway.getStatus();
			
		}, { capture: true });
		
		/**
		* @listener: PathStep shift position in pathway
		* This comes directly from the PathStepPopup
		*/
		document.addEventListener('idg:pathStepShift', ev => {
			const pathStep = ev.detail.pathStep;
			const direction = ev.detail.shift;
			
			// only interested in PathSteps events for my pathway!
			if( pathStep.pathwayID != model.uid ) return;
			
			pathway.shiftStepPos( pathStep, direction );
			
		}, { capture: true });

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
			
			// set any discharged states: 
			if( props.status == "discharged" ){
				waitDuration.finished( Date.now());
				pathway.discharged();
			}
			
			
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
				shortcode: 'i-comments',
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
				shortcode: 'i-arr',
				status: 'buff',
				type: 'arrive',
				timestamp: Date.now(),
				idgPopupCode: 'arrive-basic',
			});
			addPathStep({
				shortcode: 'i-wait',
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
		
		const onComplete = () => {
			if( model.status == "active" ) return;
			
			addPathStep({
				shortcode: 'i-fin',
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
		* @method
		* Render Patient <tr> if it matches filter
		* @params {String} filter - header filter buttons set this
		* @returns {Element} (if covered by filter option)	
		*/
		const render = ( filter ) => {
			let renderDOM = false;
			
			switch( filter ){
				case "all": renderDOM = true;
				break; 
				case "clinic": 
					renderDOM = !( 
						model.status == 'done' || 
						model.status == 'later'
					);
				break;
				case "-f": renderDOM = model.redFlagged;
				break;
				case "waiting": 
					renderDOM = ( 
						model.status == 'waiting' || 
						model.status == 'long-wait' || 
						model.status == 'stuck' 
					);
				break;
				case "issues": 
					renderDOM = ( 
						model.status == 'break' || 
						model.status == 'long-wait' || 
						model.status == 'stuck' 
					);
				break;
				
				
				default: renderDOM = ( model.status == filter );
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
			isTicked(){ return tick.checked; } 
		};
	};
	
	// make component available to Clinic SPA	
	clinic.patient = patient;
	

})( bluejay, bluejay.namespace('clinic'), bluejay.namespace('gui')); 