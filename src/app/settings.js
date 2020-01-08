/**
* Settings (useful globals)
*/
(function (uiApp) {

	'use strict';

	const settings = {
		/*
		Newblue CSS contains some key
		media query widths, this are found in: config.all.scss
		Story the key ones for JS
		*/
		css : {
			extendedBrowserSize: 1440,
			browserHotlistFixSize: 1890,
		},
	};
	
	/**
	* Standardise data-attributes names
	* @param {String} suffix optional
	* @returns {Sting} 
	*/
	const domDataAttribute = (suffix = false) => {
		let attr = suffix === false ? 'oeui' : 'oeui-' + suffix;
		return attr;
	};
	
	/**
	 * Get settings
	 * @param  {String} key The setting key (optional)
	 * @return {*}          The setting
	 */
	var getSetting = function (key) {
		return settings[key];
	};
	
	// Extend App
	uiApp.extend('getSetting',getSetting);
	uiApp.extend('getDataAttributeName',domDataAttribute);

})(bluejay);