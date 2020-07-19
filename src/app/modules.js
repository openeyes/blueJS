/**
* Namespace controller within App for Modules
*/
(function (bj) {

	'use strict';
	
	/**
	JS Modules in Bluejay
	*/
	const modules = new Map();
	
	/**
	 * Get module namespace
	 * @param  {String} namespace
	 * @return {Object} 
	 */
	let get = (name) => {
		if(modules.has(name)){
			return modules.get(name);	
		}
		bj.log('Module does not exist?: '+name);
		return false;
	};
	
	/**
	 * Add a new module
	 * @param {String} name of module 
	 * @param {Object} public methods
	 * @returns {Boolean} 
	 */
	let add = (name, methods) => {
		// check for unique namespace
		if(!modules.has(name)){
			bj.log('[Module] ' + name);
			modules.set(name, {});
			return get(name);
		} else {
			bj.log('** Err: Module aleady added? ' + name);
			return false;
		}
	};

	
	// Extend App
	bj.extend('addModule', add);
	bj.extend('getModule', get);

})(bluejay);