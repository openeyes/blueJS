(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('userPIN');	
	
	/*
	Little PIN entry demo, see:
	Drugs Administered (User can only use PSD Sets)
	Clinic steps and Patient actions steps in WS
	*/
	
	const demoInput = (input) => {
		let pin = input.value;
		let div = input.parentNode;
		div.classList.remove('accepted-pin','wrong-pin');
		
		if(pin.length === 4){
			if (pin == '1234'){
				div.classList.add('accepted-pin');
			} else {
				div.classList.add('wrong-pin');
			} 	
		}
	};
	
	document.addEventListener('input', (ev) => {
		if(ev.target.matches('.user-pin-entry')){
			demoInput(ev.target);
		}
	},{capture:true});
	

})(bluejay); 