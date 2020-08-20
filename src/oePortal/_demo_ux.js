(function( bj ) {

	'use strict';	
	
	const demoPath = ( btnID, groupName, pathChoice ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;
		
		const group = `idg-radio-g-${groupName}`;
		const radios = bj.nodeArray( document.getElementsByName( groupName ));
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === group ){
				btn.disabled = ( elem.value === pathChoice ) ? false : true;
			}
		});
	};
	
	const demoCheckbox = ( btnID, checkboxName ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;	
		
		const checkbox = bj.nodeArray( document.getElementsByName( checkboxName ))[0]; // only 1
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === checkboxName ){
				btn.disabled = elem.checked ? false : true;
			}
		});
		
	};
	
	const demoMultiPath = ( btnID, groupName, callBack ) => {
		const btn = document.querySelector( btnID );
		btn.disabled = true;
		
		const group = `idg-radio-g-${groupName}`;
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === group ){
				callBack( btn, elem.value );
			}
		});	
	};
	
	
	
	const otherCheckBox = ( groupName, otherTextID ) => {
		const other = document.querySelector( otherTextID );
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === groupName ){
				let displayOther = elem.checked ? 'block' : 'none';
				other.style.display = displayOther;
			}
		});		
	};
	
	const demoOtherText = ( args ) => {
		if( args.inputType ){
			otherCheckBox( args.group, args.otherTextID );
		}
	};
	
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('demoPath', demoPath );
	bj.extend('demoCheckbox', demoCheckbox );
	bj.extend('demoMultiPath', demoMultiPath );
	bj.extend('demoOtherText', demoOtherText );
	

})( bluejay ); 