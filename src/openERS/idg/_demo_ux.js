(function( bj ) {

	'use strict';	
	
	/**
	iDG UIX prototype helpers
	**/
	
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
	
	const demoChoosePathway = ( args ) => {
		const href = '/ERS/';
		const btn = document.querySelector( args.btn );
		const group = `idg-radio-g-${args.group}`;
		const paths = args.paths; 		
		let location = "";

		btn.disabled = true;
		
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name === group ){
				btn.disabled = true;
				if( paths.has( elem.value) ){
					location = paths.get( elem.value );
					btn.disabled = false;
				}
			}
		});	
		
		// when user clicks on btn, go on correct pathway
		const next = () => window.location = href + location;
		return next;
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
	
	const otherRadioOption = ( groupName, otherVal, otherTextID ) => {
		const other = document.querySelector( otherTextID );
		const group = `idg-radio-g-${groupName}`;
		document.addEventListener('change', ( ev ) => {
			const elem = ev.target; 
			if( elem.name !== group ) return;
			
			other.style.display = 'none';
			if( elem.name === group && elem.value == otherVal ){
				other.style.display = 'block';
			}
		});		
	};
	
	const demoOtherText = ( args ) => {
		if( args.inputType == "checkbox" ){
			otherCheckBox( args.group, args.otherTextID );
		} else {
			otherRadioOption( args.group, args.value, args.otherTextID );
		}
		
	};
	
	
	/**
	* Extend API ... PHP will call with json when DOM is loaded
	*/
	bj.extend('demoPath', demoPath );
	bj.extend('demoCheckbox', demoCheckbox );
	bj.extend('demoChoosePathway', demoChoosePathway );
	bj.extend('demoOtherText', demoOtherText );
	

})( bluejay ); 