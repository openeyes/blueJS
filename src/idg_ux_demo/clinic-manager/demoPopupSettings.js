(function( bj ){

	'use strict';	
	
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	// demo some quick and dirty popup content 
	
	// Fields custom settinsg
	
	document.addEventListener('change', (ev) => {
		if( ev.target.matches('input[name="idg-radio-g-fields-custom"]')){
			const custom = document.querySelector('.js-idg-ps-field-custom');
			if( ev.target.value == 3 ){
				bj.show( custom );
			} else {
				bj.hide( custom );
			}
		}
	}); 


	

})( bluejay ); 