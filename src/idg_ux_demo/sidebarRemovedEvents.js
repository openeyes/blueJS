(function( bj ){

	'use strict';
	
	
	let loaded = false;
	
	const loadRemovedEvents = ( ev ) => {
		// demo the UIX for loading in RemoveEvents into the sidebar
		const btn = ev.target; 
		
		if( loaded ){
			document.getElementById('removed-event-list').textContent = "";
			btn.textContent = "Show removed (20)";
			loaded = false;
			return;
		}
		
		btn.innerHTML = `Loading... <i class="spinner as-icon"></i>`;
		
		// Fake a db request demo...
		
		const li = bj.dom('li', 'event');
		li.setAttribute('data-quick', `{"id":1004,"icon":"i-CiExamination","event":"Examination","speciality":"GL","date":"1 Mth 1975","type":"none","content":"Sorry, no preview is currently available"}`);
		li.innerHTML = `<div class="tooltip quicklook"><div class="event-name">Examination</div><div class="event-issue urgent">Deleted</div></div><a href="/" data-id="r1"><span class="event-type "><i class="oe-i-e i-CiExamination"></i></span><span class="event-extra"></span><span class="event-date"><span class="day">1</span><span class="mth">Mth</span><span class="yr">1975</span></span><span class="tag">GL</span></a>`;
		
		const frag = new DocumentFragment();
		
		for( let i = 0; i < 20; i++ ){
			const copy = li.cloneNode( true );
			copy.id = `r${i}`;
			frag.append( copy );
		}
		
		
		setTimeout(() => {
			document.getElementById('removed-event-list').append( frag );
			btn.innerHTML = `Hide removed`;
			loaded = true;
		}, 1000 );
		
			
	};
	
	/*
	Events 
	*/
	bj.userDown('div.removed-events div.removed-btn', loadRemovedEvents );
	
})( bluejay ); 