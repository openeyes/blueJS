/**
* Overlay Popup
*/
(function (uiApp) {

	'use strict';
	
	/*
	Pretty simple. Click on something (id), load in PHP content, selector to close
	*/
	const pops = [ 	{id:'#js-change-context-btn', php:'change-context.php', close:'.close-icon-btn' },	// change context (firm)
					{id:'#copy-edit-history-btn', php:'previous-history-elements.php', close:'.close-icon-btn' }, // duplicate history element
					{id:'#copy-edit-anterior-segment-btn', php:'previous-ed-anterior.php', close:'.close-icon-btn' }, // duplicate history element ED
					{id:'#js-virtual-clinic-btn', php:'virtual-clinic.php', close:'.close-icon-btn' }, // virtual clinic change:
					{id:'#js-delete-event-btn', php:'delete-event.php', close:'.js-demo-cancel-btn' }, // Delete Event generic example:
					{id:'#js-close-element-btn', php:'close-element.php', close:'.js-demo-cancel-btn' }, // Remove element confirmation
					{id:'#js-add-new-event', php:'add-new-event.php', close:'.close-icon-btn' }, // Add New Event in SEM view mode
					{id:'#js-idg-preview-correspondence', php:'letter-preview.php', close:'.close-icon-btn' }, // duplicate history element
					{id:'#js-idg-exam-complog', php:'exam-va-COMPlog.php', close:'.close-icon-btn' }, // Duplicate Event
					{id:'#js-duplicate-event-btn', php:'duplicate-event-warning.php', close:'.close-icon-btn' }, 
					{id:'#js-idg-worklist-ps-add', php:'worklist-PS.php', close:'.close-icon-btn' }, // Worklist PSD / PSG	
					{id:'#analytics-change-filters', php:'analytics-filters.php', close:'.close-icon-btn' }, // Analytics Custom Filters	
					{id:'#js-idg-add-new-contact-popup', php:'add-new-contact.php', close:'.close-icon-btn' }, // Add new contact
					];
	
	
	const overlayPopup = (id,php,closeSelector) => {
		
		const showPopup = () => {
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/' + php)
				.then( html => {
					const div = document.createElement('div');
					div.className = "oe-popup-wrap";
					div.innerHTML = html;
					div.querySelector(closeSelector).addEventListener("mousedown", (ev) => {
						ev.stopPropagation();
						uiApp.removeElement(div);
					}, {once:true} );
					
					// reflow DOM
					uiApp.appendTo('body',div);
				})
				.catch(e => console.log('overlay failed to load',e));
		};
		
		// register Events
		uiApp.registerForClick(id,showPopup);
	};
	
	/*
	Init IDG popup overlay demos
	*/
	
	for(let i=0,len=pops.length;i<len;i++){
		let p = pops[i];
		let el = document.querySelector(p.id);
		if(el !== null){
			overlayPopup(	p.id,
							p.php,
							p.close);
		}
	}
			
})(bluejay); 