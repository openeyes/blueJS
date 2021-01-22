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
				gui.pathStepPopup.full( this );
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
			}
		});
		
		const _setType = () => ({
			/**
			* @param {String} type - e.g. arrive, finish, process, person, config
			*/
			setType( type ){
				this.type = type;
				this.render();
			}
		});
		
		const _setStatus = () => ({
			/**
			* @param {String} status - next is default
			*/
			setStatus( status ){
				this.status = status;
				this.render();
			}, 
			
			// pathStepPopup actions need to change the status
			changeStatus( status ){
				this.setStatus( status );
				gui.pathStepPopup.full( this );
			}
		});
		
		
		const _addInfo = () => ({
			/** 
			* Not all steps have info (e.g. PSDs), but generally it's a time
			*/
			addInfo( infoText ){
				// might not have the required DOM
				if( this.info === undefined ){
					const info = document.createElement('span');
					info.className = "info";
					this.info = info;
					this.span.append( this.info );
				}
				
				// set info text 
				this.info.textContent = infoText;
			
				if( this.status == 'next' ){
					this.info.classList.add('invisible'); // need the DOM to keep the step height consistent
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
		* @param {Object} me - initialise
		* @returns {*} new PathStep
		*/
		const createPathStep = ( newPS ) => {
			return Object.assign( 
				newPS, 
				{ type:null },
				{ setKey( k ){ this.key = k; }},
				_render(),
				_setStatus(),
				_setType(),
				_addInfo(), 
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
			const span = document.createElement('span');
			span.className = selector;
			span.innerHTML = `<span class="step">${shortcode}</span>`;
			
			// create new PathStep
			const ps = createPathStep({ shortcode, status, type, span });
			
			// setup PathStep
			ps.setStatus( status );
			ps.setType( type );
			
			// PSD may or may not have extra info
			if( info ) ps.addInfo( info );
		
			// update DOM
			if( shortcode === "Arr") {
				pathway.prepend( span ); // put Arrived at the start of pathway
			} else {
				pathway.append( span );
			}
		
			// update collection 	
			ps.setKey( collection.add( ps, span ));
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 