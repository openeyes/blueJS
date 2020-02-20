/**
* Settings (useful globals)
*/
(function (uiApp) {

	'use strict';

	const settings = {
		/*
		For newblue CSS media query widths see: config.all.scss
		*/
		get cssTopBarHeight(){ return 60; },
		get cssExtendBrowserSize(){ return 1890; },
		get cssBrowserHotlistFixSize(){ return 1440; },
		get PHPLOAD(){ return '/idg-php/v3/_load/'; }
	};
	
	/**
	* Standardise data-attributes names
	* @param {String} suffix optional
	* @returns {Sting} 
	*/
	const domDataAttribute = (suffix = false) => {
		let attr = !suffix ? 'bluejay' : 'bluejay-' + suffix;
		return 'data-' + attr;
	};
	
	/**
	* set Data Attribute on DOM 
	* @param {HTMLElement} el - el to store on
	* @param {String} value
	*/
	const setDataAttr = (el,value) => {
		el.setAttribute(domDataAttribute(), value); 
	};
	
	/**
	* get Data Attribute on DOM 
	* @param {HTMLElement} el - el to check
	* @returns {String||null} 
	*/
	const getDataAttr = (el) => {
		const dataAttr = domDataAttribute();
		if(el.hasAttribute(dataAttr)){
			return el.getAttribute(dataAttr);
		} else { 
			return null;
		}
	};

	// Extend App
	uiApp.extend('settings',settings);
	uiApp.extend('getDataAttributeName',domDataAttribute);
	uiApp.extend('setDataAttr',setDataAttr);
	uiApp.extend('getDataAttr',getDataAttr);

})(bluejay);