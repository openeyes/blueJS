(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class PathStepPopup extends React.Component {
			
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
				const time = ( step.status == 'next' ) ? "Next" : bj.clock24( new Date( step.timestamp ));
				return rEl('h3', null, `${time} - ${title}` ); 
			}
			
			/**
			* Demo some content example for popup
			*/
			content(){
				return (
					rEl('div', { 
							className: 'popup-overflow' 
						}, 
						rEl('div', { 
							className: 'data-group', 
							dangerouslySetInnerHTML: { 
								__html : '<table class="data-table"><tbody><tr><td><span class="oe-eye-lat-icons"><i class="oe-i laterality R small"></i><i class="oe-i laterality L small"></i></span></td><td>No step data being shown for this demo...</td><td>UX Demo</td></tr></tbody></table>'
							}, 	
						})
					)
				);
			}
			
			
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
						onClick: () => this.props.onChangeStepStatus( step.patientArrRef, step.arrRef, newStatus )
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
							btn('blue hint', 'Make active', 'active' ),
							btn('red hint', 'Remove', 'remove' )
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
				console.log('Render: PathStepPopup');
				// Build and position the popup	
				const step = this.props.step; 
				
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
							onClick: this.props.onClosePopup,
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
		react.PathStepPopup = PathStepPopup;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 