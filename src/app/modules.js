/**
* Modules in bluejay.
* Manage namespacing for modules in blueajay
*/
(function( bj ){
	'use strict';
	
	/* 
	Keep a note of added Modules for debugging
	2 version of Bluejay are created: 
	1) IDG all modules.
	2) OE UI: selected modules.
	*/
	const modules = [];
	const registerModule = ( name ) => modules.push( name );
	const listModules = () => {
		modules.sort();
		return modules.join(', ');
	};
	
	/**
	Manage namespace in Bluejay
	*/
	const namespace = new Map();
	/**
	 * Get/Set Namespace
	 * @param  {String} namespace
	 * @return {Object} (namespace)
	 */
	const appNameSpace = ( name ) => {
		if( !namespace.has( name )) namespace.set( name, {} );
		return namespace.get( name );	
	};
	
	// Extend API
	bj.extend( 'addModule', registerModule );
	bj.extend( 'registeredModules', listModules );
	bj.extend( 'namespace', appNameSpace );

})( bluejay );