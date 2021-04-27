(function( bj, clinic ){

	'use strict';	
	
	/**
	* Filter Btn <li>
	* @param {Object} props 
	* @param {parentNode} ul - <ul>
	* @return {Element} 
	*/
	const filterBtn = ( props, ul ) => {
		
		const filter = props.filter; 
		const count = bj.div('count');
		
		const li = document.createElement('li');
		li.className = "filter-btn js-idg-clinic-btn-filter"; 
		li.setAttribute('data-filter', filter );
		
		// build btn and add to <ul> header
		(() => {
			const div = bj.div('filter');
			// risk icon?
			if( props.name.startsWith('-r')){
				// string pattern is '-rN'
				const num = parseInt( props.name.charAt(2), 10);
				const colors = ['grey','red','amber','green'];
				div.innerHTML = `<div class="name"><i class="oe-i triangle-${colors[ num ]} medium no-click"></div>`;
			} else {
				div.innerHTML = `<div class="name">${props.name}</div>`;
			}
			
			
			div.append( count );	
			li.append( div );
			ul.append( li );
		})();
		
		/**
		* Update
		* On any updates to clinic need to update the filter count
		* @param {Array} status - Patient row status
		* @param {Array} risks - Patient risk num
		* @param {String} currentFilter - current filter for the clinic list
		*/	
		const update = ( status, risks, currentFilter ) => {
			let num = 0;
			
			if( filter == "all"){
				num = status.length;
			} else if ( filter == "clinic"){
				// work out the counts per filter.
				num = status.reduce(( acc, val ) => {
					if( val != "done" && val != 'later' ) return acc + 1; 
					return acc;
				}, 0 );
			} else if ( filter.startsWith('-r')){
				// work out the counts per filter.
				num = risks.reduce(( acc, val ) => {
					if( val == filter ) return acc + 1; 
					return acc;
				}, 0 );
			} else {
				// work out the counts per filter.
				num = status.reduce(( acc, val ) => {
					if( val == filter ) return acc + 1; 
					return acc;
				}, 0 );
			}
			
			// update DOM
			count.textContent = num;
			
			if( currentFilter === filter ){
				li.classList.add('selected');	
			} else {
				li.classList.remove('selected');
			}
		};
		
		return { update };	
	};
	
	// make component available to Clinic SPA	
	clinic.filterBtn = filterBtn;			
  
})( bluejay, bluejay.namespace('clinic')); 