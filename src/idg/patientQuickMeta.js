(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientQuickMeta');
	
	let open = false;
	let fixed = false; 
	let currentIcon = null; 
	let div = null;	
	const text = {};
	
	const buildDOM = () => {
		const div = document.createElement('div');
		div.className = "oe-patient-quick-overview";
		div.style.display = "none";
		div.innerHTML = [
			'<div class="close-icon-btn"><i class="oe-i remove-circle medium"></i></div>',
			'<div class="oe-patient-meta">',
			'<div class="patient-name">',
			'<a href="/v3-SEM/patient-overview"><span class="patient-surname">SURNAME</span>, <span class="patient-firstname">First (M.)</span></a>',
			'</div><div class="patient-details">',
			'<div class="hospital-number"><span>ID</span>0000000</div>',
			'<div class="nhs-number"><span>NHS</span>111 222 3333</div>',
			'<div class="patient-gender"><em>Gen</em>Male</div>',
			'<div class="patient-age"><em>Age</em>00y</div>',
			'<div class="quick-overview-content"></div>',
			'</div></div>'].join('');
			
		uiApp.appendTo('body',div);
		
		text.surname = div.querySelector('.patient-surname');
		text.first = div.querySelector('.patient-firstname');
		text.hospital = div.querySelector('.hospital-number');
		text.nhs = div.querySelector('.nhs-number');
		text.gender = div.querySelector('.patient-gender');
		text.age = div.querySelector('.patient-age');
		
		return div;
	};
	
	const hide = () => {
		div.style.display = "none";
		open = fixed = false;
		currentIcon = null;
	};
	
	
	const show = (dataSet,rect) => {
		div = div || buildDOM();
		
		let mode = dataSet.mode;
		let php = dataSet.php;
		let patient = JSON.parse( dataSet.patient );
		
		/*
		set up patient meta
		*/
		text.surname.textContent = patient.surname;
		text.first.textContent = patient.first;
		text.hospital.innerHTML = '<span>ID</span> '+ patient.id;
		text.nhs.innerHTML = '<span>NHS</span> '+ patient.nhs;
		text.gender.innerHTML = '<em>Gen</em> '+ patient.gender;
		text.age.innerHTML = '<em>Age</em> '+ patient.age;
		
		
		/*
		CSS can handle a mode of "side"
		it will lock the panel to the RHS
		just add "side-panel" class...
		However, mode = "float" requires a 
		JS positioning relative to the icon.
		*/ 
		if( mode == "side"){
			div.style.top = div.style.left = null;
			div.classList.add("side-panel"); 
		} else {
			/*
			floating fixed, calculate position
			in relation to the icon,
			*/
			div.classList.remove("side-panel");
			
			let wh = window.innerHeight;
			// quick position for testing... 
			div.style.top 	= (rect.y + rect.height + 5) + "px";
			div.style.left 	= (rect.x - 250 +  rect.width/2)  + "px";			
		}
		
		let content = div.querySelector('.quick-overview-content');
		content.innerHTML = "";
		
		// slow loading??
		let spinnerID = setTimeout( () => content.innerHTML = '<i class="spinner"></i>', 400);	
		
		// xhr returns a Promise... 
		uiApp.xhr('/idg-php/v3/_load/' + php)
			.then( html => {
				clearTimeout(spinnerID);
				content.innerHTML = html;
				div.style.display = "block";
			})
			.catch(e => console.log('ed3app php failed to load',e));  // maybe output this to UI at somepoint, but for now...
	};
	
	const userClick = (ev) => {
		let icon = ev.target;
		if(open){
			if(fixed && currentIcon === icon) {
				hide();
			} else {
				// new click OR hover
				fixed = true; 
				currentIcon = icon;
				show(icon.dataset, icon.getBoundingClientRect() );
			}
		} else {
			fixed = true;
			currentIcon = ev.target;
			show(currentIcon.dataset, currentIcon.getBoundingClientRect() );
		}
	};
	
	/**
	* Callback for 'Hover'
	* @param {event} event
	*/
	const userHover = (ev) => {
		if(fixed) return;
		currentIcon = ev.target;
		show(currentIcon.dataset, currentIcon.getBoundingClientRect() );
		open = true;
	};
	
	/**
	* Callback for 'Exit'
	* @param {event} event
	*/
	const userOut = (ev) => {
		if(fixed) return;
		hide();
	};
	

	uiApp.registerForClick('.js-patient-quick-overview',userClick);
	uiApp.registerForHover('.js-patient-quick-overview',userHover);
	uiApp.registerForExit('.js-patient-quick-overview',userOut);
	
})(bluejay); 