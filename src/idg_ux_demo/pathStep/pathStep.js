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
				const css = [ selector ];
				css.push( this.status );
				css.push( this.type );
				console.log( this.span );
				this.span.className = css.join(' ');
				this.updateInfo();
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
					case 'config': newStatus = 'todo'; break;
					case 'todo': 
					case 'todo-later':
						newStatus = 'active'; break;
					case 'active': newStatus = 'done'; break;
				}
				this.setStatus( newStatus );
				gui.pathStepPopup.full( this, true );
			}, 
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {String} code
			*/
			setIdgPopupCode( val ){
				this.idgCode = val;
			}
			
		});
		
		
		const _setInfo = () => ({
			/** 
			* @params {String} - custom string or "clock" or false,
			* If it's false don't added it to the DOM as it increase height
			* "clock" - show a clock for each state change
			*/
			setInfo( info ){
				this.info = info;
				
				if( this.info ){
					this.infoSpan = bj.dom('span','info');
					this.span.append( this.infoSpan );
					this.render();
				} 
			}, 
			
			updateInfo(){
				if( !this.info  ) return; 
				
				this.infoSpan.innerHTML = this.info === "clock" ? 
					bj.clock24( new Date( Date.now())) :
					this.info;
				
				if( this.status == 'todo' || 
					this.status == 'todo-later' ||
					this.status == 'config' ){
					this.infoSpan.classList.add('invisible'); // need the DOM to keep the step height consistent
				} else {
					this.infoSpan.classList.remove('invisible');
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
				_setInfo(), 
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
		* @returns {PathStep}
		*/
		const addPathStep = ({ shortcode, status, type, info, idgPopupCode }, pathway ) => {
			
			// new DOM element, check for icons
			const name = shortcode.startsWith('i-') ? 
				`<span class="step ${shortcode}"></span>` :
				`<span class="step">${shortcode}</span>`;
		
			// create new PathStep & set up
			const ps = createPathStep( bj.dom('span', selector, name));
			ps.shortcode = shortcode;
			ps.setStatus( status );
			ps.setType( type );
			
			if( idgPopupCode ) ps.setIdgPopupCode( idgPopupCode );
			
			/*
			Adding info to a pathstep will increase the button height.
			For PSDs and for pathSteps in Orders elements the info isn't needed and is "false"
			It can be a custom String, but mostly it's shows the time ("clock")
			*/
			ps.setInfo( info );
			
			// update collection 	
			ps.setKey( collection.add( ps, ps.render()));
		
			// add to DOM?
			if( pathway ) pathway.append( ps.render());
			
			return ps; // return PathStep
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 