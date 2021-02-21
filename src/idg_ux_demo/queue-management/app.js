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
		
		let risk;
		switch( p.risk ){
			case 1: risk = `<i class="oe-i triangle-red small pad-right"></i>`;
			break;
			case 2: risk = `<i class="oe-i triangle-amber small pad-right"></i>`;
			break;
			case 3: risk = `<i class="oe-i triangle-green small pad-right"></i>`;
			break;
		}
		
		div.innerHTML = `${risk} ${p.lastname}, ${p.firstname}`;
		
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
		el.innerHTML =`<header>${header}</header>`;
		el.append( patientList );
		
		// update DOM (sloppy, but should be OK for demo)
		root.append( el );
		
		// API
		return {
			id, 
			patientList,
			list: [],
			/* 
			Every time there is change to the list
			let all the Patients know their new positions	
			*/
			updatePatients(){
				this.list.forEach(( p, index ) => p.setQueuePos( index ));
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
		
		const dataID = e.dataTransfer.getData("text/plain")
		const p = Ps.get( dataID );
	
		if( e.target.matches('.queue')){
			const list = bj.find('.patient-list', e.target );
			list.classList.remove('add-to-end');
			
			// add to the end of a queue list
			const queue = Qs.get( Number( e.target.id )); 
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
		For the purpose of the demo hard code 3 queues
		*/
		Qs.set( 1, initQueue({
			id: 1,
			header: 'Dr Amit Baum',
			root,
		}));
		
		Qs.set( 2, initQueue({
			id: 2,
			header: 'Dr Coral Woodhouse',
			root,
		}));
		
		Qs.set( 3, initQueue({
			id: 3,
			header: 'Dr Robin Baum',
			root,
		}));
		
		/*
		Patient data is coming from the PHP JSON
		each patient has a qNum that relates to
		the queue key to start it in	
		*/
		json.forEach( p => {
			const newPatient = initPatient( p );
			Ps.set( newPatient.id, newPatient );
		
			const queue = Qs.get( p.qNum );
			queue.addPatient( newPatient );
		});
		
		
		// Drag n Drop, listeners
		root.addEventListener('dragstart', handleStart, { useCapture: true });
		//root.addEventListener('dragenter', handleEnter, { useCapture: true });
		root.addEventListener('dragover', handleOver, { useCapture: true });
		root.addEventListener('dragleave', handleDragLeave, { useCapture: true });
		root.addEventListener('dragend', handleEnd, { useCapture: true });
		root.addEventListener('drop', handleDrop, { useCapture: true });
		
		// Can not do the hover effect with CSS. Need to use JS
		// and then clear the hover class with handleOver drag event
		bj.userEnter('.queue  .patient', ( e ) => e.target.classList.add('over'))
		bj.userLeave('.queue  .patient', ( e ) => e.target.classList.remove('over'));
		
	};
	
	// add to namespace
	queue.app = app;			

})( bluejay, bluejay.namespace('queue')); 