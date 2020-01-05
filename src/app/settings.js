/**
* Settings
* Useful global settings
*/
(function () {

	'use strict';

	const settings = {
		/*
		Newblue CSS contains some key
		media query widths, this are found in: config.all.scss
		Capture the key ones, for JS
		*/
		css : {
			extendedBrowserSize: 1440,
			browserHotlistFixSize: 1890,
		},
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
	bluejay.extend('getSetting',getSetting);
})();