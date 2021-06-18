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
			},
		});
		
		const _setters = () => ({
			/**
			* Shortcode
			* @param {String} val - change shortcode (from initial value)
			*/
			setCode( code ){
				this.shortcode = code;
				const stepName = this.span.querySelector('.step');
				
				if( code.startsWith('i-')){
					stepName.textContent = '';
					stepName.className = `step ${code}`;
				} else {
					stepName.className = `step`;
					stepName.textContent = code;
				}
				
				this.render();
			},
			
			getCode(){
				return this.shortcode;
			},
			
			/**
			* Status
			* @param {String} val
			*/
			setStatus( val ){
				// valid status settings
				const valid = ['config', 'todo', 'todo-next', 'active', 'done', 'buff'].find( test => test == val );
				if( !valid ) throw new Error(`PathStep: invaild status: "${val}".`);
				this.status = val;
				this.render();
			}, 
			
			getStatus(){
				return this.status;	
			},
			
			/**
			* Type
			* @param {String} val
			*/
			setType( val ){
				// valid types
				const valid = ['none', 'process', 'person', 'wait', 'hold', 'delayed-wait', 'arrive', 'red-flag', 'fork', 'break', 'break-back', 'finish', 'comments', 'comments-added'].find( test => test == val );
				if( !valid ) throw new Error(`PathStep: invaild type: "${val}"`);
				
				this.type = val;
				this.render();
			},
			
			getType(){
				return this.type;
			},
			
			/**
			* In pathway can a step be bulk removed?
			*/
			isRemovable(){
				let removable = (
					this.status == 'config' ||
					this.status == "todo" ||
					this.status == "todo-next" ||
					this.status == "buff"
				);
				
				// but don't remove these:
				if( this.status == "buff" ){
					removable = !(
						this.type == "wait" || 
						this.type == "wait long" ||
						this.type == "break"
					);	
				}
				
				return removable;
			},
			
			/**
			* @method - Move PathStep onto next state
			* PathStep popup action buttons use this
			* @param {String} status - next is default
			*/
			nextState(){
				let newStatus = false;
				switch( this.status ){
					case 'config': newStatus = 'todo'; 
					break;
					case 'todo': 
					case 'todo-next': newStatus = 'active'; 
					break;
					case 'active': 
						newStatus = 'done';
						// may not have any info DOM...
						if( this.info ) this.info.textContent = bj.clock24( new Date( Date.now()));
					break;
					case "buff":
						if( this.type == "break"){
							// no longer a break (blue), patient is back
							this.type = "break-back"; 
							this.render();
							this.renderPopup();
							bj.customEvent('idg:pathStepChange', this );
						}
					break;
				}
				
				if( newStatus ) this.changeState( newStatus );
			},
			
			/**
			* @method - Move PathStep back a state
			* PathStep popup action buttons use this
			* @param {String} status - next is default
			*/
			prevState(){
				let newStatus = false;
				switch( this.status ){
					case 'todo': newStatus = 'config'; 
					break;
					case 'done':
					case 'active': newStatus = 'todo'; 
					break;
				}
				
				if( newStatus ) this.changeState( newStatus );
			},
			
			/**
			* @method - Jump to a pathstate
			*/
			jumpState( newStatus ){
				this.changeState( newStatus );
			},
			
			changeState( newStatus ){
				this.setStatus( newStatus );
				bj.customEvent('idg:pathStepChange', this );
				
				gui.pathStepPopup.remove();
				if( newStatus != 'done' && this.type != "hold" ){
					// reload the popup this will reposition it as well
					this.renderPopup();	
				}
				
				if( this.type == "hold"){
					if( this.status == "active"){
						 this.holdTimer();	
					} else {
						this.span.querySelector('svg').remove();
					}
				} 
				
			},
			
			renderPopup(){
				gui.pathStepPopup.full( this, true );
			},
			 
			/**
			* IDG specific hack to provide a specific code for demo popups
			* @param {String} val
			*/
			setIdgPopupCode( val ){
				this.idgCode = val;
			},	
			
			removeIdgPopupCode(){
				delete this.idgCode;
			},
			
			holdTimer(){
				const svgns = "http://www.w3.org/2000/svg";
				const attr = ( el, a, b ) => el.setAttribute( a, b );
				const svg = document.createElementNS( svgns, "svg");
				const circle = document.createElementNS( svgns, "circle");
				const radius = 15;
				
				attr( svg, 'class', 'progress-ring');
				attr( svg, 'viewBox', '0 0 34 34'); // step CSS is 34px x 34px 
				attr( circle, 'fill', 'transparent');
				attr( circle, 'r', radius );
				attr( circle, 'cx', 17 );
				attr( circle, 'cy', 17 );
				
				// DOM
				svg.append( circle );
				this.span.append( svg );
				
				// animation the timer
				const circumference = radius * 2 * Math.PI;
				circle.style.strokeDasharray = `${circumference} ${circumference}`;
				circle.style.strokeDashoffset = circumference;
	
				// timer duration from step name e.g. "2"
				const total = Number( this.shortcode ) * 60000; // millisecs!
				let start = null; // timestamp
			
				const progress = ( timeStamp ) => {
					start = start || timeStamp; // capture inital timeStamp, in closure
					const elapsed = timeStamp - start;
					let percent = (elapsed / total) * 100;
					if( percent < 2 ) percent = 2; // show something! 
					const offset = circumference - percent / 100 * circumference;
					
					if( percent > 100 ){
						this.jumpState('done');
					} else if( 	this.status == "active" && elapsed < total ){
						// visually show progress in circle: 
						circle.style.strokeDashoffset = offset;
						// take a load off the processor!
						setTimeout( window.requestAnimationFrame( progress ), 300 );
					}
				};
	
				window.requestAnimationFrame( progress );
				// note to self! can not test faster thatn time! 
				// need to allow the CSS animation time to catch up! 0.5s
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
				if( this.type == "hold") return; // ignore (timer e.g. 2mins, etc)
				
				if( info !== false ){
					this.info = bj.dom('span','info');
					
					// set content
					this.info.innerHTML = info === "clock" ? 
						bj.clock24( new Date( Date.now())) :
						info;
					
					// append
					this.span.append( this.info );
					
					if( this.shortcode == 'i-wait' || 
						this.shortcode == 'i-delayed'){
							this.countWaitMins();
						}
					
				} 
			}, 
			
			countWaitMins(){
				if( this.shortcode == 'i-wait' || 
					this.shortcode == 'i-delayed'){
						setTimeout(() => {
							const mins = parseInt( this.info.textContent, 10 ) + 1;
							this.info.textContent = mins; 
							if( mins > 59 && this.shortcode == 'i-wait' ){
								this.setType('delayed-wait');
								this.setCode('i-delayed');
								bj.customEvent('idg:pathStepChange', this );
							}
							this.countWaitMins(); // keep counting the mins?
						}, 60000 );
					}	
			},
			
			/**
			* When state changes and PathStep is rendered
			* check info display state.
			*/  
			displayInfo(){
				if( !this.info  ) return; 
				
				if( this.status == 'active' ||
					this.shortcode == 'i-fin' ||
					this.shortcode == 'i-wait' ||
					this.shortcode == 'i-delayed' ){
					bj.show( this.info );
				} else {
					bj.hide( this.info );
				}
				
				if( this.shortcode == 'i-arr' &&
					this.status == 'done'){
					bj.show( this.info );		
				}
				
			}
		});
		
		const _remove = () => ({
			/**
			* Remove - 
			* Could be from the patient pathway "Remove last"
			*/
			remove(){
				this.span.remove();
				collection.delete( this.key );
			}, 
			
			// Or, by the User from the pathStepPopup
			userRemove(){
				this.remove();
				this.status = "userRemoved";
				bj.customEvent('idg:pathStepChange', this );
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
		* @param {DOM} parentNode 
		* @param {String} UID token - Patient Pathway UID, need this for Event listener
		* @returns {PathStep}
		*/
		const addPathStep = ({ shortcode, status, type, info, idgPopupCode }, parentNode, pathwayID = null ) => {
			
			// new DOM element, check for icons
			const stepName = shortcode.startsWith('i-') ? 
				`<span class="step ${shortcode}"></span>` :
				`<span class="step">${shortcode}</span>`;
		
			// create new PathStep & set up
			const ps = createPathStep( bj.dom('span', selector, stepName));
			ps.shortcode = shortcode;
			ps.setStatus( status );
			ps.setType( type );
			ps.setInfo( info );
			ps.pathwayID = pathwayID;
			
			// timer?
			if( ps.getType() == "hold" && ps.getStatus() == "active"){
				ps.holdTimer();
			}
			
			// render DOM
			const spanDOM = ps.render();
			
			// iDG code to show specific content in popup
			if( idgPopupCode ) ps.setIdgPopupCode( idgPopupCode );
			
			// update collection 	
			ps.setKey( collection.add( ps, spanDOM ));
		
			// add to a parentNode DOM?
			if( parentNode ) parentNode.append( spanDOM );
			
			return ps; // return new PathStep
		};
		
		// API
		return addPathStep; 
	};
	
	// universal GUI. Clinic Manager, Worklists (PSDs), Orders Exam Element
	gui.pathStep = pathSteps();
		
})( bluejay, bluejay.namespace('gui')); 