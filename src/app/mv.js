/**
* Template structure for MV* patterns 
* Observer pattern
*/
(function( bj ) {
	
	'use strict';
	
	/**
	* Create an ObserverList for Models (Models)
	*/	
	const ObserverList = () => ({
		list: new Set(), // observer only needs (should) be added once
		add( item ){
			this.list.add( item );
			return this.list.has( item );
		}, 
		remove( item ){
			this.list.remove( item );
		}, 
		size(){
			return this.list.size;
		}, 
		notify(){
			let iterator = this.list.values();
			for ( let item of iterator ){
				item();
			}
		}
	});
	 
	/**
	* Basic Model with Observer Pattern for Views
	*/
	const Model = () => ({
		views: Object.create( ObserverList() )
	});
		
	bj.extend( 'ModelViews', Model );	

})( bluejay );