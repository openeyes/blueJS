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
				const fullName = this.props.isStep ? rEl('div', { className: 'fullname' }, react.fullShortCode( this.props.btn )) : null; 
				const count = this.props.count ? rEl('div', { className: 'count' }, this.props.count ) : null; 
			
				return (
					rEl('div', { className: 'filter' },
						rEl('div', { className: 'name' }, this.props.btn  ), 
						fullName, 
						count
					)
				);
			}
		
			/**
			* Render
			*/
			render(){ 
				const css = this.props.selected ? 'filter-btn selected' : 'filter-btn';
				return (
					rEl('li', { className: css, onClick: () => this.props.onClick( this.props.filter ) }, 
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