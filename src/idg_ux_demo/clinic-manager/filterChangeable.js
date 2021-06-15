(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filter Chnageable
	*/
	const inner = ( name, count='' ) =>  `<div class="name">${name}</div><div class="count">${count}</div>`; 
	
	const filterChangeable = ( name, prefix="" ) => {
		const selected = null;
		const div = bj.div('changeable-filter');
		const nav = bj.dom('nav', 'options');
		bj.hide( nav );
		
		// button in the header (opens the options)
		const headerBtn = bj.div('filter-btn');
		headerBtn.innerHTML = inner( name );
		
		// intitate DOM: 
		div.append( headerBtn, nav );
		
		const reset = () => {
			headerBtn.classList.remove('selected');
			headerBtn.innerHTML = inner( name );
		};
		
		
		/**
		* @method - callback on any pathway change
		* @params {Map} map - key:shortcode, value: Set of patiend ids
		*/
		const updateOptions = ( map ) => {
			const filters = new DocumentFragment();
			map.forEach(( set, key ) => {
				let name = key; 
				let selectName = key;
				
				switch( key ){
					case "i-discharge": selectName = name = `Check out`;
					break;
					case "i-drug-admin": selectName = name = `Drug Admin`;
					break;
					case 'DH': name = "David Haider (DH)";
					break;
					case 'CK': name = "Caroline Kilduff (CK)";
					break;
					case 'JM': name = "James Morgan (JM)";
					break;
					case 'IR': name = "Ian Rodrigues (IR)";
					break;
					case 'PT': name = "Peter Thomas (PT)";
					break;
					case 'TB': name = "Toby Bisco (TB)";
					break;
					case 'TF': name = "Toby Fisher (TF)";
					break;
				}
			
				const opt = bj.div('filter-btn js-filter-option');
				opt.innerHTML = inner( `${prefix} ${name}`, set.size );
				opt.setAttribute('data-patients', JSON.stringify([ ...set.values() ]));
				opt.setAttribute('data-display', JSON.stringify({ 
					name: `${prefix}${selectName}`,
					count: set.size 
				}));
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
				const display = JSON.parse( btn.dataset.display );
				headerBtn.innerHTML = inner( display.name, display.count );
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