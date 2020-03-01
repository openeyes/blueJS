/**
* Namespace controller within App for Modules
*/
(function (uiApp) {

	'use strict';
	
	/**
	Manage Modules 
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
		uiApp.log('Module does not exist?: '+name);
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
			uiApp.log('[Module] ' + name);
			modules.set(name, {});
			return get(name);
		} else {
			uiApp.log('** Err: Module aleady added? ' + name);
			return false;
		}
	};

	
	// Extend App
	uiApp.extend('addModule', add);
	uiApp.extend('getModule', get);
	
})(bluejay);