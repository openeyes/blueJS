(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class PopupFields extends React.Component {
			
			constructor( props ){
				super( props );
				
				// no need for state (at least, as I currently understand React JS ;)
				
				this.setTitle = this.setTitle.bind( this );
				this.content = this.content.bind( this );
				this.stepActions = this.stepActions.bind( this );
				this.stepStatus = this.stepStatus.bind( this );
			}
			
			/**
			* Title, convert shortcode into full title
			* @params {*} this.props.step
			* @returns {ReactElement}
			*/
			setTitle( step ){
				const title = react.fullShortCode( step.shortcode );
				const time = ( step.status == 'next' ) ? "Configure" : bj.clock24( new Date( step.timestamp ));
				return rEl('h3', null, `Configure - Visual Fields` ); 
			}
			
			/**
			* Demo some content example for popup
			*/
			content(){
				return (
					rEl('div', { className: 'popup-overflow' }, 
						rEl('div', { className: 'data-group' }, 
							rEl('table', null, 
								rEl('tbody', null, 
									rEl('tr', null, 
										rEl('th', null, 'Eye:'),
										rEl('td', null, 
											rEl('fieldset', null, 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'checkbox', name:'eye' }, null), 
													rEl('i', { className: 'oe-i laterality R medium' }, null)
												), 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'checkbox', name:'eye' }, null), 
													rEl('i', { className: 'oe-i laterality L medium' }, null)
												)
											)
										)
									),
									rEl('tr', null, 
										rEl('th', null, 'Test type:'), 
										rEl('td', null, 
											rEl('fieldset', null, 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'radio', name:'fieldtest' }, null), 
													rEl('span', null, '10-2')
												), 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'radio', name:'fieldtest' }, null), 
													rEl('span', null, '24-2')
												), 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'radio', name:'fieldtest' }, null), 
													rEl('span', null, '30-2')
												)
											)
										)
									),
									rEl('tr', null, 
										rEl('th', null, 'Esterman:'), 
										rEl('td', null, 
											rEl('fieldset', null, 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'checkbox', name:'fieldtest' }, null), 
													rEl('span', null, 'Esterman')
												)
											)
										)
									),
									rEl('tr', null, 
										rEl('th', null, 'STA:'), 
										rEl('td', null, 
											rEl('fieldset', null, 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'radio', name:'sta' }, null), 
													rEl('span', null, 'Standard')
												), 
												rEl('label', { className: 'highlight inline'}, 
													rEl('input', { type: 'radio', name:'sta' }, null), 
													rEl('span', null, 'Fast')
												)
											)
										)
									)
								)
							)								
						)
					)
				);
			}
			
			//<label class="inline highlight"><input value="R" name="a-eye-sides" type="checkbox" checked=""> <i class="oe-i laterality R medium"></i></label>
			
			
			
			
			/**
			* <button> actions for the popup, 
			* available actions depend on step status
			* @params {*} this.props.step
			* @returns {ReactElement}
			*/
			stepActions( step ){
				
				if( step.status != 'active' && step.status != 'next') return null; 
				
				const btn = ( css, btnTxt, newStatus ) => {
					return rEl( 'button', { 
						className: css,
						onClick: this.props.onActions
					}, btnTxt );
				};
				
				if( step.status == 'active' ){
					return (
						rEl('div', { className: 'step-actions' }, 
							btn('green hint', 'Complete', 'done' ),
							btn('red hint', 'Remove', 'remove' )
						)	
					);
				}
				
				if( step.status == 'next' ){
					return (
						rEl('div', { className: 'step-actions' }, 
							btn('blue hint', 'Request Test', 'active' ),
							btn('red hint', 'Cancel Test', 'remove' )
						)	
					);
				}
				
									
			}
			
			/**
			* show the steps status with CSS 
			* @params {*} this.props.step
			* @returns {ReactElement}
			*/
			stepStatus( step ){
				let css = 'step-status'; 
				if( step.status == 'done' ) css += ' green';
				if( step.status == 'active' ) css += ' orange';
				return rEl('div', { className: css }, step.status );
			}
			
			
			/**
			* Render
			*/
			render(){ 
				// Build and position the popup	
				const step = this.props.step; 

				// set up a default standard step.
				return (
					rEl('div', {
							className: 'oe-pathstep-popup a-t-l',
							style: {
								top: step.rect.bottom,
								left: step.rect.left,
							}
						},
						rEl('div', { 
							className: 'close-icon-btn', 
							onClick: this.props.onActions,
							dangerouslySetInnerHTML: { __html : '<i class="oe-i remove-circle medium"></i>'}
						}),
						
						this.setTitle( step ),
						this.content( step ),
						this.stepActions( step ),
						this.stepStatus( step )
					)
				);
					
			}
		}
		
		// make component available	
		react.PopupFields = PopupFields;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 