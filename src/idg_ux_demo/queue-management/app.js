(function( bj, queue ){

	'use strict';	

	const Qs = new Map();
	const Ps = new Map();
	
	/**
	* Patient 
	* Abstract holds reference to DOM Element (only need to build <div> once)
	* @param {Object} p - Data from JSON to build patient 'card'
	* @returns {Object} 
	*/
	const initPatient = ( p ) => {
		const id = bj.getToken(); // key for set
		const div = bj.div('patient');
		div.id = id; 
		div.setAttribute('draggable', true );
		
		let risk = p.risk ? 'urgent' : 'grey';
		
		
		div.innerHTML = `<i class="oe-i triangle-${risk} small pad-right selected"></i> ${p.lastname}, ${p.firstname}`;
		
		// API
		return {
			id, 
			div,
			queue: null, // patients queue
			queuePos: null, // if dropped on, I need to know list position
			queueChange( newQueue ){
				/*
				new queue? remove myself from old queue 	
				*/
				if( this.queue != newQueue ){
					if( this.queue ) this.queue.removePatient( this.queuePos );
					this.queue = newQueue;
				}
			}, 
			setQueuePos( n ){
				this.queuePos = n;
			}
		};
	};

	/**
	* Queue 
	* Abstract holds reference to DOM Element (only need to build <div> once)
	* @param {Object} - Destructured
	* @returns {Object} 
	*/
	const initQueue = ({ id, header, root }) => {
		
		const el = bj.div('queue');
		const patientList = bj.div('patient-list');
		el.id = id;
		el.innerHTML = id == 'q0' ? 
			`<header class="in-flow">${header}</header>`:
			`<header>${header}</header>`;
		el.append( patientList );
		
		// add a button in the sidebar to allow show/hide
		const btn = bj.div('side-queue-btn selected');
		btn.setAttribute('data-queue', id );
		btn.innerHTML = `${header}<div class="patients"></div>`;
		document.getElementById('idg-side-queue-clinicians').append( btn );
		
		
		// update DOM (sloppy, but should be OK for demo)
		root.append( el );
		
		// API
		return {
			id,
			div: el, 
			btn,
			capacity: 10,
			btnPatients: btn.querySelector('.patients'),
			patientList,
			list: [],
			/* 
			Every time there is change to the list
			let all the Patients know their new positions	
			*/
			updatePatients(){
				this.list.forEach(( p, index ) => p.setQueuePos( index ));
				const showIcons = this.list.length > 21 ? 21 : this.list.length;
				this.btnPatients.style.width = (showIcons * 11) + 'px';
				//this.btnCount.textContent = this.list.length ? `${percent}%`: 'No patients assigned';
			},
			
			/**
			* Update patient position in same queue	
			* have to do some Array juggling... 
			*/
			changePatientPos( patient, newPos ){
				this.list[ patient.queuePos ] = null; // need to find this later
				this.list.splice( newPos, 0, patient ); // move in list
				const oldPosIndex = this.list.findIndex( i => i === null );// find old index
				this.list.splice( oldPosIndex, 1 ); // remove it
				this.render();
			},
			
			/**
			* Add new patient and insert in position	
			* Let patient know it's new queue
			* @param {*} patient
			*/
			addPatientAndPos( patient, pos ){
				patient.queueChange( this );
				this.list.splice( pos, 0, patient ); // place in list
				this.render();
				
			},
			
			/**
			* Add new patient to end of the queue
			* Let patient know it's new queue
			* @param {*} patient
			*/
			addPatient( patient ){
				patient.queueChange( this );
				this.list.push( patient ); // add to the end of the list
				this.render();
			},
			
			/**
			* @callback from Patient, letting it's old list know it's moved on
			* @param {Number} indexPos
			*/
			removePatient( indexPos ){
				this.list.splice( indexPos, 1);
				this.render();
			},
			render(){
				// reflow Patient list
				const fragment = new DocumentFragment();
				this.list.forEach( p => fragment.append( p.div ));
				
				bj.empty( patientList );
				patientList.append( fragment );
				
				// update patients with their new position the queue
				this.updatePatients();
			}
		};
	};
	
	
	/**
	* Drag n Drop
	*/
	
	
	/**
	* Drag start - source element
	* @param {Event} e
	*/
	const handleStart = ( e ) => {
		e.target.classList.add('moving');
		e.dataTransfer.effectAllowed = 'move';
		/*
		Can only set Text in the data. Set the ID.
		(This allows for a list of elements)
		e.g.node can be moved: add-to-end.append( document.getElementByID( e.dataTransfer.getData("text/plain") ));
		*/
		e.dataTransfer.setData("text/plain", e.target.id );	
		
	};
	
	/**
	* Drag end - source element
	* @param {Event} e
	*/
	const handleEnd = ( e ) => {
		e.target.classList.remove('moving');
	};
	
	/**
	* Drag over - add-to-end element
	* @param {Event} e
	*/
	const handleOver = ( e ) => {
		e.preventDefault(); // required.
		e.dataTransfer.dropEffect = 'move';
		
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.add('add-to-end');
		}
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.add('add-above');
			e.target.classList.remove('over');
		}

		return false; // a good practice!
	};
	
	/**
	* Drag leave - add-to-end element
	* @param {Event} e
	*/
	const handleDragLeave = (e) => {
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.remove('add-to-end');
		}	
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.remove('add-above');
		}	
	}; 
	
	/**
	* Drag DROP - add-to-end element
	* @param {Event} e
	*/
	const handleDrop = ( e ) => {
		e.preventDefault(); // required.
		
		const dataID = e.dataTransfer.getData("text/plain");
		const p = Ps.get( dataID );
	
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.remove('add-to-end');
			
			// add to the end of a queue list
			const queue = Qs.get( e.target.id ); 
			queue.addPatient( p );
		}
		
		if( e.target.matches('.queue .patient-list .patient')){
			e.target.classList.remove('add-above');
			
			if( dataID == e.target.id ) return false; // dropping on self
			
			// dropping on a patient in a queue
			const dropP = Ps.get( e.target.id );
			const dropQ = dropP.queue;
			
			if( dropP.queue == p.queue ){
				// same queue, update patient card position
				dropQ.changePatientPos( p, dropP.queuePos );
				
			} else {
				// dropping in a new queue
				dropQ.addPatientAndPos( p, dropP.queuePos );
			}
			
		}

		return false;
	};
	

	/**
	* Init - SPA
	* @param {Array} json - patients from PHP
	*/
	const app = ( json ) => {
		const root = document.getElementById('js-queue-mgmt-app');
		
		/*
		For the purpose of the demo hard code queues
		*/
		const buildQueue = ( id, header ) => {
			Qs.set( id, initQueue({ id, header, root }));
		};
		
		buildQueue( 'q0', 'New referrals' );
		buildQueue( 'q1', 'Dr Amit Baum' );
		buildQueue( 'q2', 'Dr Angela Glasby' );
		buildQueue( 'q3', 'Dr Robin Baum' );
		
		
		/*
		Patient data is coming from the PHP JSON
		each patient has a qNum that relates to
		the queue key to start it in	
		*/
		json.forEach( p => {
			const newPatient = initPatient( p );
			Ps.set( newPatient.id, newPatient );
		
			const queue = Qs.get( 'q' + p.qNum );
			queue.addPatient( newPatient );
		});
		
		/*
		fake a patient referral in-flow	
		*/
		const fakeInFlow = () => {
			const surname = ['SMITH', 'JONES', 'TAYLOR', 'BROWN','WILLIAMS','JOHNSON','DAVIES'];
			const firstname = ['Jack (Mr)', 'David (Mr)', 'Sarah (Ms)', 'Lucy (Mrs)', 'Jane (Mrs)', 'Mark (Mr)', 'James (Mr)', 'Ian (Mr)'];
			//const randomRisk = Math.random() < 0.5;
			
			const newPatient = initPatient({
				lastname: surname[Math.floor(Math.random() * surname.length)],
				firstname:  firstname[Math.floor(Math.random() * firstname.length)],
				risk: Math.random() < 0.2, // 1 in 5 Urgent!
			});
			
			Ps.set( newPatient.id, newPatient );
			Qs.get('q0').addPatient( newPatient );
			
			const randomInterval = ((Math.floor(Math.random() * 3)) * 2000) + 4000;
			setTimeout( fakeInFlow, randomInterval );
		};
	
		setTimeout( fakeInFlow, 4000 );
		
		
		
		// Drag n Drop, listeners
		root.addEventListener('dragstart', handleStart, { useCapture: true });
		//root.addEventListener('dragenter', handleEnter, { useCapture: true });
		root.addEventListener('dragover', handleOver, { useCapture: true });
		root.addEventListener('dragleave', handleDragLeave, { useCapture: true });
		root.addEventListener('dragend', handleEnd, { useCapture: true });
		root.addEventListener('drop', handleDrop, { useCapture: true });
		
		// Can not do the hover effect with CSS. Need to use JS
		// and then clear the hover class with handleOver drag event
		bj.userEnter('.queue  .patient', ( e ) => e.target.classList.add('over'));
		bj.userLeave('.queue  .patient', ( e ) => e.target.classList.remove('over'));
		
		// side btns
		bj.userDown('.side-queue-btn', e => {
			const btn = e.target;
			const queue = Qs.get( e.target.dataset.queue );
			if( btn.classList.contains('selected')){
				btn.classList.remove('selected');
				bj.hide( queue.div );	
			} else {
				btn.classList.add('selected');
				bj.show( queue.div );	
			}
		});
		
	};
	
	// add to namespace
	queue.app = app;			

})( bluejay, bluejay.namespace('queue')); 