(function (uiApp) {

	'use strict';
	
	uiApp.addModule('overlayPopup');
	
	/*
	Pretty simple. Click on something (by id), load in some PHP demo content, assign a selector to close
	*/
	const pops = [ 	
		{id:'#js-idg-popup-content-template',php:'_popup-content-template.php'}, // template (standardisation)
		{id:'#js-change-context-btn', php:'change-context.php' },	// change context (firm)
		{id:'#copy-edit-history-btn', php:'previous-history-elements.php' }, // duplicate history element
		{id:'#copy-edit-anterior-segment-btn', php:'previous-ed-anterior.php' }, // duplicate history element ED
		{id:'#js-virtual-clinic-btn', php:'virtual-clinic.php' }, // virtual clinic change:
		{id:'#js-delete-event-btn', php:'delete-event.php'}, // Delete Event generic example:
		{id:'#js-close-element-btn', php:'close-element.php' }, // Remove element confirmation
		{id:'#js-add-new-event', php:'add-new-event.php' }, // Add New Event in SEM view mode
		{id:'#js-idg-preview-correspondence', php:'letter-preview.php' }, // duplicate history element
		{id:'#js-idg-exam-complog', php:'exam-va-COMPlog.php' }, // Duplicate Event
		{id:'#js-duplicate-event-btn', php:'duplicate-event-warning.php' }, 
		{id:'#js-idg-worklist-ps-add', php:'worklist-PS.php' }, // Worklist PSD / PSG	
		{id:'#analytics-change-filters', php:'analytics-filters.php' }, // Analytics Custom Filters	
		{id:'#js-idg-add-new-contact-popup', php:'add-new-contact.php' }, // Add new contact
		{id:'#js-idg-admin-queset-demo',php:'admin-add-queue.php'},
		{id:'#js-idg-search-query-save',php:'query-save.php'}, // Search, manage Queries popup 
		{id:'#js-idg-search-all-searches',php:'query-all-searches.php'}, // Search, manage Queries popup 
	];

	const overlayPopup = (id,php) => {	
		const showPopup = () => {
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/' + php)
				.then( html => {
					const div = document.createElement('div');
					div.className = "oe-popup-wrap";
					div.innerHTML = html;
					div.querySelector('.close-icon-btn').addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.remove(div);
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',div);
				})
				.catch(e => console.log('OverlayPopup failed to load: Err msg -',e));  // maybe output this to UI at somepoint, but for now... 
		};
		
		// register Events
		uiApp.userDown(id,showPopup);
	};
	
	/*
	Init IDG popup overlay demos, if element is in the DOM
	*/
	
	for(let i=0,len=pops.length;i<len;i++){
		let p = pops[i];
		let el = document.querySelector(p.id);
		if(el !== null){
			overlayPopup(	p.id,
							p.php);
		}
	}
			
})(bluejay); 