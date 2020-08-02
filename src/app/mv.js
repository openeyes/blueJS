/**
* Template structure for MV* patterns 
* Observer pattern
*/
(function( bj ) {
	
	'use strict';
	
	/**
	* Create an ObserverList for Models (Models)
	*/	
	const ObserverList = {
		list: new Set(), // observer only needs (should) be added once
		add( obj ){
			this.list.add( obj );
			return this.list.has( obj );
		}, 
		remove(){
			this.list.remove( obj );
		}, 
		getAll(){
			return this.list.values( obj );
		}, 
		size(){
			return this.list.size;
		}, 
		notify(){
			let iterator = this.getAll();
			for ( let obj of iterator ){
				// could be a callback or an object
				if( typeof obj === 'function'){
					obj();
				} else {
					obj.update();
				}
			}
		}
	};
	 
	/**
	* Basic Model with Observer Pattern for Views
	*/
	const Model = () => ({
		views: Object.create( ObserverList )
	});
		
	bj.extend( 'ModelViews', Model );	

})( bluejay );