(function( oePlotly ) {
	
	'use strict';
	
	/**
	* Build DIV
	* @param {String} id
	* @param {String} height (80vh)
	* @param {String} min-height (500px)
	*/
	oePlotly.buildDiv = ( id, height, minHeight ) => {
		const div = document.createElement('div');
		div.id = `oePlotly-${id}`;
		div.style.height = height;
		div.style.minHeight = minHeight;
		return div;
	};
	
	/**
	* For use in layout templates
	* Helper to work out first and last dates
	* @returns {Object} 
	*/
	oePlotly.fullDateRange = () => ({
		all:[], 
		add( xArr ){
			this.all = this.all.concat( xArr );
			this.all.sort();
		}, 
		firstLast(){
			// watch out for null values
			let noNulls = this.all.filter(( i ) => i !== null );
			return [ noNulls[0], noNulls.pop() ];	
		},
	});
	
})( oePlotly );