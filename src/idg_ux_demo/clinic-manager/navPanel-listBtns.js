(function( bj, clinic ){

	'use strict';	
	
	/**
	* Nav worklist panel
	* Link up the buttons to the actual lists in the DOM
	* Also demo switching to "No context"
	*/
	
	const listPanel = document.getElementById('js-worklists-panel');
	if( listPanel === null ) return;
	
	/**
	* @param {Method} appViewChange - callback 
	*/
	const setup = ( appViewChange ) => {
		const listManager = listPanel.querySelector('.list-manager');
		const worklists = listManager.querySelector('.worklists');
		/*
		Build the button list from DOM
		*/
		const fieldset = bj.dom('fieldset');
		const frag = new DocumentFragment();
		document.querySelectorAll('.oec-group').forEach( group => {
			const label = bj.dom('label');
			label.innerHTML = `<input type="checkbox" value="${group.dataset.id}" checked><span class="btn">${group.dataset.title}</span>`;
			frag.append( label );
		});
		
		// build the button DOMs
		bj.empty( worklists );
		fieldset.append( frag );
		worklists.append( fieldset );
		
		/*
		Set up list mode. 
		And show/hide lists based on user selection
		*/
		
		const checkBoxes = bj.nodeArray( worklists.querySelectorAll('input[type=checkbox]'));
		const allBtn = listManager.querySelector('button[name=all]');
		
		// lists always start as "All" selected
		allBtn.classList.add('selected');
	
	
		const updateClinicView = () => {
			const ids = new Set();
			checkBoxes.forEach( btn => {
				if( btn.checked ){
					ids.add( btn.value );
				} 
			});
			
			const lists = ids.size > 1 ? 'lists' : 'list';
			const text = ids.size ? 
				`<b>${ ids.size }</b> ${ lists }` : 
				'<b>0</b>';

			document.querySelector('.clinic-context .lists').innerHTML = text;
			
			// App will listen for this
			appViewChange( ids );
		};	
			
		// init	
		updateClinicView();
		
		// list to the input checkboxes (only thing that changes)
		worklists.addEventListener('change', ev => {
			allBtn.classList.remove('selected');
			updateClinicView();
		});
		
		// set checked state for all worklists
		const checkAll = ( b ) => {
			checkBoxes.forEach( input => input.checked = b );
			updateClinicView();
		};
		
		// select or deselect all lists
		allBtn.addEventListener('mousedown', ev => {
			if( allBtn.classList.contains("selected")){
				checkAll( false );
				allBtn.classList.remove('selected');
				setTimeout(() => allBtn.blur(), 100);
			} else {
				checkAll( true ); 
				allBtn.classList.add('selected');
			}
		});
	};

	clinic.navPanelListBtns = setup;
				
  
})( bluejay, bluejay.namespace('clinic')); 