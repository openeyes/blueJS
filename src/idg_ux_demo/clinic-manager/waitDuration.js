(function( bj, clinic ){

	'use strict';	
	
	/**
	* waitDuration
	* @param {String} patientID - Patient uid
	* @returns {*} API;	
	*/
	const waitDuration = ( patientID ) => {
		
		const td = document.createElement('td');
		
		let timestamp = null;
		let mins = 0;
		let timerID = null;				
	
		/**
		* Calculate wait minutes from arrival time
		* @returns {Number} minutes
		*/
		const calcWaitMins = ( finishTime = false ) => {
			const endTime = finishTime == false ? Date.now() : finishTime;
			mins = Math.floor(( endTime - timestamp ) / 60000 );
		};
		
		/**
		* @callback from patient when the "Arrive" step is added to the pathway
		* @param {Number} arriveTime - timestamp
		* @param {String} patientStatus - only looking for "active"
		*/
		const arrived = ( arriveTime, patientStatus ) => {	
			if( timestamp !== null ) return;
			timestamp = arriveTime;
			calcWaitMins();
			timerID = setInterval(() => {
				calcWaitMins();
				render("active");
			}, 15000 ); 				
		};
		
		/**
		* @callback from patient when the "Finished" step is added to the pathway
		* @param {Number} finishedTime - timestamp
		*/
		const finished = ( finishTime ) => {
			clearInterval( timerID );
			calcWaitMins( finishTime );
		};
					
		/**
		* SVG Circles to represent time waiting
		* @param {String} color (based on wait mins)
		* @returns {React Element}
		*/
		const svgCircles = () => {
			let color = 'green';			
			if( mins > 120 ) color = 'yellow';
			if( mins > 180 ) color = 'orange';
			if( mins > 240 ) color = 'red';
			
			const r = 6;
			const d = r * 2;
			const w = d * 4;
			
			const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
			svg.setAttribute('class', `duration-graphic ${color}`);
			svg.setAttribute('viewBox', `0 0 ${w} ${d}`);
			svg.setAttribute('height', d );
			svg.setAttribute('width', w );

			for( let i=0; i<4; i++ ){
				const cx = ((i + 1) * (r * 2)) - r;
				const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
				circle.setAttribute('class',`c${i}`);
				circle.setAttribute('cx',`${cx}`);
				circle.setAttribute('cy',`${r}`);
				circle.setAttribute('r',`${r}`);
				svg.appendChild( circle );
			}
			
			return svg;
		};	

		/**
		* Render Mins DOM
		* @returns {Element}
		*/
		const waitMins = ( active ) => {
			const div = bj.div('mins');
			// turns mins into hours 
			const hours = Math.floor( mins / 60 );
			const clockMins = (mins % 60).toString().padStart(2,'0');
			
			// const suffix = mins > 1 ? 'mins' : 'min';
			div.innerHTML = active ? 
				`<small>${hours}:${clockMins}</small>`: 
				`${hours}:${clockMins}`;
				
			return div;
		};
		
		/**
		* Render depends on status
		* @param {String} status - could be: "complete", "active", "todo"
		* @returns {Element} - appropriate element based on status
		*/
		const render = ( status ) => {
			const div = bj.div();
			
			switch( status ){
				case "done": 
					div.className = 'wait-duration';
					div.appendChild( waitMins( false ));
				break;
				case "later":
					div.className = 'flex';
					div.innerHTML = [
						`<button class="cols-7 blue hint js-idg-clinic-btn-arrived" data-patient="${patientID}">Arrived</button>`,
						`<button class="cols-4 js-idg-clinic-btn-DNA" data-patient="${patientID}">DNA</button>`
					].join('');
				break;
				default: 
					div.className = 'wait-duration';
					div.appendChild( svgCircles());
					div.appendChild( waitMins( true ));
			}
			
			bj.empty( td );
			td.append( div );
			
			return td;
		};
		
		// API
		return { arrived, finished, render };
	};
	
	// make component available	
	clinic.waitDuration = waitDuration;	
	

})( bluejay, bluejay.namespace('clinic') ); 