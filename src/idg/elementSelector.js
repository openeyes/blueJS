(function (uiApp) {

	'use strict';
	
	uiApp.addModule('elementSelector');
	
	/*
	Element Selector 2.0
	Manager & Sidebar Nav
	*/

	const _loadPHP = () => ({
		/**
		* Loads in PHP file into DOM wrapper
		*/
		loadPHP:function(){
			// xhr returns a Promise... 
			uiApp.xhr('/idg-php/v3/_load/sidebar/' + this.php)
				.then( html => {
					// in the meantime has the user clicked to close?
					if(this.open === false) return; 
					
					this.nav = document.createElement('nav');
					this.nav.className = this.wrapClass;
					this.nav.innerHTML = html;
					// reflow DOM
					this.btn.classList.add('selected');		
					uiApp.appendTo('body',this.nav);		
				})
				.catch(e => console.log('PHP failed to load',e));  // maybe output this to UI at somepoint, but for now...
		}
	});
	
	const _close = () => ({
		/**
		* Close overlay
		* @param {Object} Event
		*/
		close:function(){
			this.open = false;
			this.btn.classList.remove('selected');
			uiApp.removeElement(this.nav);	
		}
	});
	
	const _change = () => ({
		/**
		* Change state
		* @param {Object} Event
		*/
		change:function(ev){
			if(this.btn === null)	this.btn = ev.target;

			if(this.open){
				this.close();
			} else {
				this.open = true;
				this.loadPHP();
			}
		}
	});
	
	/**
	* @Class 
	* @param {Object} set up
	* @returns new Object
	*/	
	const ElementOverlay = (me) => {
		me.btn = null;
		me.open = false; 
		return Object.assign(	me, 
								_change(),
								_loadPHP(), 
								_close() );			
	};

	// Only set up if DOM needs it...
	if(document.querySelector('#js-manage-elements-btn') !== null){
		
		const manager = ElementOverlay({	wrapClass: 'oe-element-selector', 
											php: 'element-selector.php' });
												
		const sidebar = ElementOverlay({ 	wrapClass: 'sidebar element-overlay', 
											php: 'examination-elements.php' });
 	
		// register Events
		uiApp.registerForClick('#js-manage-elements-btn', (ev) => manager.change(ev) );
		uiApp.registerForClick('.oe-element-selector .close-icon-btn button', () => manager.close() );
		uiApp.registerForClick('#js-element-structure-btn', (ev) => sidebar.change(ev) );
	}

})(bluejay); 