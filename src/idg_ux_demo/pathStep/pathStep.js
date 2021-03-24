(function( bj, gui ){

	'use strict';	
	
	bj.addModule('gui.pathStep');	
	
	/**
	* Manage all pathSteps
	* Note, for this to work PathSteps must be added through JS (not PHP)
	*/
	const pathSteps = () => {
		
		const selector = 'oe-pathstep-btn';
		const collection = new bj.Collection();
		
		/*
		Methods	
		*/
		const _events= () => ({
			userDown(){
				gui.pathStepPopup.full( this, false );
			}, 
			userOver(){
				gui.pathStepPopup.quick( this );
			}, 
			userOut(){
				gui.pathStepPopup.hide();
			}
		});
		
		const _render = () => ({
			/**
			* Update the DOM CSS
			* @returns <span> Element
			*/
			render(){
				this.span.className = [ selector, this.status, this.type ].join(' ');
				this.displayInfo();
				return this.span;
			}
		});
		
		const _setters = () => ({
			/**
			* @param {String} val - change shortcode (from initial value)
			*/
			setCode( val ){
				this.shortcode = val;
				this.span.querySelector('.step').textContent = val;
				this.render();
			},
			
			getCode(){
				return this.shortcode;
			},
			
			/**
			* @param {String} - config, todo, todo-later, done, (buff)
			*/
			setStatus( val ){
				this.status = val;
				this.render();
			}, 
			
			getStatus(){
				return this.status;	
			},
						
			/**
			* @param {String} - person, process (arrive, finish, wait, auto-finish)
			*/
			setType( val ){
				this.type = val;
				this.render();
			},
			
			/**
			* pathStepPopup move pathStep on to next state
			* @param {String} status - next is default
			*/
			nextState(){
				let newStatus;
				switch( this.status ){
					case 'config': newStatus = 'todo'; 
					break;
					case 'todo': 
					case 'todo-later': newStatus = 'active'; 
					break;
					case 'active': 
						newStatus = 'done';
						this.info.textContent = '15'; // set fake duration
					break;
				}
				this.setStatus( newStatus );
				if( this.callback ) this.callback( newStatus );
				gui.pathStepPopup.full( this, true );
			},
			
			prevState(){
				let newStatus;
				switch( this.status ){
					case 'active': newStatus = 'todo'; 
					break;
				}
				this.setStatus( newStatus );
				if( this.callback ) this.callback( newStatus );
				gui.pathStepPopup.full( this, true );
			},
			 
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {String} val
			*/
			setIdgPopupCode( val ){
				this.idgCode = val;
			},
			
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {Function} func
			*/
			setCallback( func ){
				this.callback = func;
			}
			
		});
		
		
		const _stepInfo = () => ({
			/** 
			* PathStep height depends on the "info".Height is not fixed, 
			* this allows the pathStep to fit in a standard table row. (This may change)
			* @params {String} info
			* info - A custom DOMstring (could be "&nbsp;") or "clock" or false,
			* If it's false don't add to the DOM as this affects the height.
			*/
			setInfo( info ){
				if( info !== false ){
					this.info = bj.dom('span','info');
					
					// set content
					this.info.innerHTML = info === "clock" ? 
						bj.clock24( new Date( Date.now())) :
						info;
					
					// append
					this.span.append( this.info );
				} 
			}, 
			
			/**
			* When state changes and PathStep is rendered
			* check info display state.
			*/  
			displayInfo(){
				if( !this.info  ) return; 
				if( this.status == 'todo' || 
					this.status == 'todo-later' ||
					this.status == 'config' ){
					this.info.classList.add('invisible'); // need the DOM to keep the height consistent
				} else {
					this.info.classList.remove('invisible');
				}
			}
		});
		
		const _remove = () => ({
			remove(){
				this.span.remove();
				collection.delete( this.key );
			}
		});
		
		/**
		* @Class
		* @param {Element} span - initialise with new DOM element
		* @returns {*} new PathStep
		*/
		const createPathStep = ( span ) => {
			return Object.assign( 
				{ span },
				{ setKey( k ){ this.key = k; }},
				_render(),
				_setters(),
				_stepInfo(), 
				_events(), 
				_remove()
			);
		};
		
		const getPathStep = ( target ) => {
			const key = collection.getKey( target );
			return collection.get( key );
		};
		
		/*
		Event delegation for PathSteps
		*/
		bj.userLeave(`.${selector}`, ev => getPathStep( ev.target ).userOut());
		bj.userEnter(`.${selector}`,  ev => getPathStep( ev.target ).userOver());
		bj.userDown(`.${selector}`, ev => getPathStep( ev.target ).userDown());

		/**
		* API - add new PathStep to DOM
		* @param {Object} step properties
		* @param {DOM parentNode} pathway 
		* @param {Function} cb - Callback - CM Patient needs to know of any changes
		* @returns {PathStep}
		*/
		const addPathStep = ({ shortcode, status, type, info, idgPopupCode }, pathway, cb = false ) => {
			
			// new DOM element, check for icons
			const name = shortcode.startsWith('i-') ? 
				`<span class="step ${shortcode}"></span>` :
				`<span class="step">${shortcode}</span>`;
		
			// create new PathStep & set up
			const ps = createPathStep( bj.dom('span', selector, name));
			ps.shortcode = shortcode;
			ps.status = status;
			ps.type = type;
			ps.setInfo( info );
			
			// render DOM
			const spanDOM = ps.render();
			
			// iDG code to show specific content in popup
			if( idgPopupCode ) ps.setIdgPopupCode( idgPopupCode );
			
			// update collection 	
			ps.setKey( collection.add( ps, spanDOM ));
		
			// add to a pathway DOM?
			if( pathway ) pathway.append( spanDOM );
			
			// patient callback?
			if( cb ) ps.setCallback( cb );
			
			return ps; // return new PathStep
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 