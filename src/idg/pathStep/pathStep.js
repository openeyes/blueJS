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
			*/
			render(){
				const css = [ selector ];
				css.push( this.status );
				css.push( this.type );
				this.span.className = css.join(' ');
				this.updateInfo();
			}
		});
		
		const _setters = () => ({
			/**
			* @param {String} type - e.g. arrive, finish, process, person, config
			*/
			setType( type ){
				this.type = type;
				this.render();
			},
			/**
			* @param {String} status - next is default
			*/
			setStatus( status ){
				this.status = status;
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
					case 'todo': newStatus = 'active'; break;
					case 'active': newStatus = 'done'; break;
				}
				this.setStatus( newStatus );
				gui.pathStepPopup.full( this, true );
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
					const el = bj.dom('span','info');
					this.span.append( el );
					this.iSpan = el;
					this.render();
				} 
			}, 
			
			updateInfo(){
				if( !this.info  ) return; 
				
				this.iSpan.textContent = this.info === "clock" ? 
					bj.clock24( new Date( Date.now())):
					this.info;
				
				if( this.status == 'todo' || this.status == 'config' ){
					this.iSpan.classList.add('invisible'); // need the DOM to keep the step height consistent
				} else {
					this.iSpan.classList.remove('invisible');
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
		* @param {Object} me - initialise
		* @returns {*} new PathStep
		*/
		const createPathStep = ( newPS ) => {
			return Object.assign( 
				newPS, 
				{ type:null },
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
		*/
		const addPathStep = ({ shortcode, status, type, info }, pathway ) => {
			
			// new DOM element
			const span = bj.dom('span', selector, `<span class="step">${shortcode}</span>`);
						
			// create new PathStep & set up
			const ps = createPathStep({ shortcode, span });
			ps.setStatus( status );
			ps.setType( type );
			
			/*
			Adding info to a pathstep will increase the button height.
			For PSDs and for pathSteps in Orders elements the info isn't needed and is "false"
			It can be a custom String, but mostly it's shows the time ("clock")
			*/
			ps.setInfo( info );
			
			// update collection 	
			ps.setKey( collection.add( ps, span ));
		
			// update DOM
			if( shortcode === "Arr") {
				pathway.prepend( span ); // put Arrived at the start of pathway
			} else {
				pathway.append( span );
			}
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 