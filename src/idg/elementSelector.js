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
		loadPHP:function(demo){
			// xhr returns a Promise... 
			uiApp.xhr(demo)
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
				.catch(e => console.log('PHP failed to load', e));  // maybe output this to UI at somepoint, but for now...
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
			uiApp.remove(this.nav);	
		}
	});
	
	const _change = () => ({
		/**
		* Change state
		* @param {Object} Event
		*/
		change:function(ev){
			if(this.btn === null)	
				this.btn = ev.target;

			if(this.open){
				this.close();
			} else {
				this.open = true;
				let demoPHP = JSON.parse(this.btn.dataset.demophp);
				if(demoPHP !== false){
					this.loadPHP(demoPHP);
				} else {
					this.elementSideNav();
				}
				
			}
		}
	});
	
	const _elementSideNav = () => ({
		elementSideNav:function(){
			this.nav = document.createElement('nav');
			this.nav.className = this.wrapClass;
			
			const elementTitles = uiApp.nodeArray(document.querySelectorAll('.element .element-title'));
			const listItems = elementTitles.map((title) => {
				return '<li class="element" id="side-element-contacts"><a href="#" class="selected">' + title.textContent + '</a></li>';
			});
		
			this.nav.innerHTML = [
				'<div class="element-structure">',
				'<ul class="oe-element-list">',
				listItems.join(''),
				'</ul>',
				'</div>'].join('');	
				
			uiApp.appendTo('body',this.nav);
		}
	});
	
	/**
	* @Class 
	* @param {Object} set up
	* @returns new Object
	*/	
	const ElementOverlay = (wrap) => {
		return Object.assign({
			btn: null, 
			open: false,
			wrapClass: wrap
		}, 
		_change(),
		_loadPHP(), 
		_elementSideNav(),
		_close());			
	};

	/*
	Element manager is only required (currently) in Examination
	Only set up if DOM is available
	*/
	if(document.querySelector('#js-manage-elements-btn') !== null){
		const manager = ElementOverlay('oe-element-selector');
		// register Events
		uiApp.userDown('#js-manage-elements-btn', (ev) => manager.change(ev) );
		uiApp.userDown('.oe-element-selector .close-icon-btn button', () => manager.close() );
	}
		
	/*
	Sidebar Element view should be available in all Events
	Only set up if DOM is available
	*/
	if(document.querySelector('#js-element-structure-btn') !== null){
		const sidebar = ElementOverlay('sidebar element-overlay');
		// register Events
		uiApp.userDown('#js-element-structure-btn', (ev) => sidebar.change(ev) );
	}
	

})(bluejay); 