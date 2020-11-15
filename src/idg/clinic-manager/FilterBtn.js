(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class FilterBtn extends React.PureComponent {
		
			constructor( props ){
				super( props );
				
				this.btnName = this.btnName.bind( this );
			}
			
			btnName(){
				// if filter btn is for a step, show full name
				const btnName = this.props.btn; 
				const isStep = this.props.isStep;
				
				let fullName = isStep ? rEl('div', { className: 'fullname' }, react.fullShortCode( btnName )) : null; 
							
				return (
					rEl('div', { className: 'filter' },
						rEl('div', null, btnName ), 
						fullName
					)
				);
			}
		
			/**
			* Render
			*/
			render(){ 
				return (
					rEl('li', { className: 'filter-btn'}, 
						this.btnName()
					)
				);	
			}
		}
		
		// make component available	
		react.FilterBtn = FilterBtn;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 