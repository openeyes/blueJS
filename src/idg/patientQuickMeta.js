(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('patientQuickMeta');	
	
	/*
	DOM check	
	*/
	let quickIconBtns = document.querySelectorAll('.js-patient-quick-overview');
	if( quickIconBtns.length == 0) return; 
	
	/*
	Vars	
	*/
	const iconBtns = Array.prototype.slice.call( quickIconBtns );
	const qBtns = {};
	
	let clickLock = false; 
	let currentQuickBtn = null; 
	

	/*
	Methods
	*/
	function reset(){
		clickLock = false;
		currentQuickBtn = null;
	}
	
	/*
	Constructors
	*/
	function QuickBtn( btn, id ){	
		this.id = id+1; // avoid 0
		
		function show(){
			quick.show( btn.dataset, btn.getBoundingClientRect() );
		}
	
		function userRequest(e) {
			e.stopPropagation();
			e.preventDefault();
			if(e.type == "mouseenter" 	&& !clickLock)		show();	 
			if(e.type == "mouseleave"	&& !clickLock)		quick.hide();
			if(e.type == "click"){
				if( currentQuickBtn === this) {
					// must be an unclick
					clickLock = false;
					quick.hide();
					currentQuickBtn = null;
				} else {
					// new click 
					clickLock = true; 
					show();
					currentQuickBtn = this;
				}
			}
		}
		
		/* Events */
		btn.addEventListener("click", 	 	userRequest.bind(this), false); // touch only
		btn.addEventListener("mouseenter", 	userRequest.bind(this), false); // mouse/trackpad enhancements
		btn.addEventListener("mouseleave", 	userRequest.bind(this), false);
		
	}
	
	function ShowQuick(){
		/*
		Vars
		*/
		const CSSwrap = "oe-patient-quick-overview";
		let lastPHP = null; 		// to avoid loading content twice
		let content = null;			// need to build the DOM then assign
		let spinnerID = null;		// spin loader is timed
		
		/*
		API
		*/
		this.show = ( dataSet, btnDomRect ) => {

			let mode = dataSet.mode;
			let php = dataSet.php;
			let patient = JSON.parse( dataSet.patient );
			
			/*
			set up patient meta
			*/
			div.querySelector('.patient-surname').textContent = patient.surname;
			div.querySelector('.patient-firstname').textContent = patient.first;
			div.querySelector('.hospital-number').innerHTML = '<span>ID</span> '+ patient.id;
			div.querySelector('.nhs-number').innerHTML = '<span>NHS</span> '+ patient.nhs;
			div.querySelector('.patient-gender').innerHTML = '<em>Gen</em> '+ patient.gender;
			div.querySelector('.patient-age').innerHTML = '<em>Age</em> '+ patient.age;
			
			
			/*
			CSS can handle a mode of "side"
			it will lock the panel to the RHS
			just "side-panel"...
			However, mode = "float" requires a 
			JS positioning relative to the icon.
			*/ 
			if( mode == "side"){
				div.style.top = div.style.left = null;
				div.className = CSSwrap + " side-panel"; 
			} else {
				/*
				floating fixed, calculate position
				in relation to the icon,
				*/
				div.className = CSSwrap; 
				
				let wh = document.documentElement.clientHeight;
				// quick position for testing... 
				div.style.top 	= (btnDomRect.y + btnDomRect.height + 5) + "px";
				div.style.left 	= (btnDomRect.x - 250 +  btnDomRect.width/2)  + "px";			
			}
					
			this.update(php);
			// now show. 
			div.style.display = "block";
		}	
		
		
		this.hide = () => {
			reset();
			div.style.top = div.style.left = null;
			div.style.display = "none";
		}
		
	
		this.update = ( php ) => {
			if(php == lastPHP) return; // ignore

			lastPHP = php;
			content.innerHTML = "";

			/*
			Load in IDG PHP file.
			*/
			clearTimeout( spinnerID );
			spinnerID = setTimeout( () => {
				content.innerHTML = '<i class="spinner"></i>'; // indicate loading
				clearTimeout( spinnerID );
			} , 500);			
			
			
			let xhr = new XMLHttpRequest();
			xhr.onreadystatechange = () => {
				if(xhr.readyState !== 4) return;
				if(xhr.status >= 200 && xhr.status < 300){
					clearTimeout( spinnerID );
					content.innerHTML = xhr.responseText; // dump in the PHP file ;)
				} 
			}
			
			xhr.open('GET',idg.paths.PHPLOAD + php);
			xhr.send();
		}
		
		/*
		Init & Events
		*/
		// build DOM template
		let template =  '<div class="close-icon-btn"><i class="oe-i remove-circle medium"></i></div>';
		template += '<div class="oe-patient-meta"><div class="patient-name"><a href="/v3-SEM/patient-overview"><span class="patient-surname">SURNAME</span>, <span class="patient-firstname">First (M.)</span></a></div><div class="patient-details"><div class="hospital-number"><span>ID</span>0000000</div><div class="nhs-number"><span>NHS</span>111 222 3333</div><div class="patient-gender"><em>Gen</em>Male</div><div class="patient-age"><em>Age</em>00y</div></div></div>';
		template += '<div class="quick-overview-content"></div>';
		
		
		const div = document.createElement('div');
		div.className = CSSwrap;
		div.innerHTML = template;
		div.style.display = "none";	
		document.querySelector('body').appendChild(div);
		
		// store reference to the content
		content = div.querySelector('.quick-overview-content');
		
		// Events
		div.querySelector(".close-icon-btn").addEventListener("click", this.hide, false);		
	}

	
	/*
	Init & Events	
	*/
	const quick = new ShowQuick( document.createElement('div') );
	iconBtns.forEach( ( item, index, array ) => {
		let qb = new QuickBtn( item, index );
		console.log(qb);
		qBtns[qb.id] = qb;
	});
	
	
	
	
})(bluejay); 