(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filter Chnageable
	*/
	const inner = ( name, count='' ) =>  `<div class="name">${name}</div><div class="count">${count}</div>`; 
	
	const filterChangeable = ( prefix ) => {
		const selected = null;
		const div = bj.div('changeable-filter');
		const nav = bj.dom('nav', 'options');
		bj.hide( nav );
		
		// button in the header (opens the options)
		const headerBtn = bj.div('filter-btn');
		headerBtn.innerHTML = inner( prefix );
		
		// intitate DOM: 
		div.append( headerBtn, nav );
		
		const reset = () => {
			headerBtn.classList.remove('selected');
			headerBtn.innerHTML = inner( prefix );
		};
		
		
		/**
		* @method - callback on any pathway change
		* @params {Map} map - key:shortcode, value: Set of patiend ids
		*/
		const updateOptions = ( map ) => {
			const filters = new DocumentFragment();
			map.forEach(( set, key ) => {
				const opt = bj.div('filter-btn js-filter-option');
				
				// the key is the PS shortcode might not work for the button name
				const name = key == 'i-discharge' ? 'Check out' : key;
				opt.innerHTML = inner( `&hellip; ${name}`, set.size );
				opt.setAttribute('data-patients', JSON.stringify([ ...set.values() ]));
				filters.append( opt );
			});
			
			// rebuild the options
			bj.empty( nav );
			nav.append( filters );
		};
		
		/**
		* @Event, keep this internal for easy demo-ing
		*/
		div.addEventListener('mousedown', ev => {
			const btn = ev.target;
			if( ev.target.matches('nav .js-filter-option')){
				headerBtn.innerHTML = inner(
					btn.childNodes[0].textContent,
					btn.childNodes[1].textContent
				);
				
				headerBtn.classList.add('selected');
			}		
		});
		
		div.addEventListener('mouseenter', () => {
			bj.show( nav );
		});
		
		div.addEventListener('mouseleave', () => {
			bj.hide( nav );
		});
		
		// API
		return { 
			render(){ return div; },  
			updateOptions, 
			reset
		};	
	};
	
	// make component available to Clinic SPA	
	clinic.filterChangeable = filterChangeable;			
  
})( bluejay, bluejay.namespace('clinic')); 