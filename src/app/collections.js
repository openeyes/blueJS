/**
* Handle DOM collections
* Modules tend to handle DOM collections. 
* this should be of help... 
*/
(function( bj ) {
	'use strict';
	/**
	* Generator to create unique ids 
	* Used as Keys and in DOM data-bjk 
	*/
	function* IdGenerator(){
		let id = 10;
		while( true ){
			yield ++id;
		}
	}
	
	const iterator = IdGenerator();
	const getKey = () => iterator.next().value;
	
	bj.extend( 'getKey', getKey );
	
	/**
	* Handle DOM collections in modules
	* Create a Facade to Map to link the DOM data attribute
	* with the Map Key
	*/ 
	function Collection(){
		this.map = new Map();
		this.dataAttr =  'data-oebjk';
	}
	
	/**
	* Add new Key / Value 
	* this is the reason behind the Facade: Link Key to DOM element.
	* @param {Object} value (anything)
	* @param {HTMLElement} el - linked DOM element
	* @returns {String} Key
	*/
	Collection.prototype.add = function( value, el ){
		const key = getKey(); // from Generator (see above)
		this.map.set( key, value );
		el.setAttribute( this.dataAttr, key );	 
		return key;
	};
	
	/**
	* Get Key from DOM element data attribute
	* @param {HTMLElement} el - DOM Element to check
	* @returns Key || False
	*/
	Collection.prototype.getKey = function( el ){
		let key = el.getAttribute( this.dataAttr );
		if( key === null || key == ""){
			return false;
		} else {
			return key;
		}
	};
	
	Collection.prototype.get = function( key ){
		if( typeof key === "string") key = parseInt(key, 10);
		return this.map.get( key );
	};
	
	Collection.prototype.getFirst = function(){
		const iterator = this.map.values();
		return iterator.next().value;
	};
	
	Collection.prototype.next = function( startKey ){
		const it = this.map.keys();
		let key = it.next();
		while( !key.done ){
			if( key.value === startKey ){
				return it.next().value;
			}
			key = it.next();
		}
	};
	
	Collection.prototype.prev = function( startKey ){
		let prevKey = false;
		const keys = this.map.keys();
		for (const key of keys) {
		  if(key === startKey){
			  return prevKey
		  }
		  prevKey = key;
		}
	};
	
	Collection.prototype.has = function( key ){
		return this.map.has( key );
	};
	
	bj.extend( 'Collection', Collection );	

})( bluejay );