(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		class Filters extends React.Component {
			
			constructor( props ){
				super( props );
			
				this.dom = document.getElementById('js-clinic-filter');
				
				this.state = {
					handleFilterChange: this.props.onFilterChange
				};
				
				this.filterBtns = this.filterBtns.bind( this );
			}
		
			filterBtns(){
				const btns = this.props.btns.map( btn => {
					btn.onClick = this.state.handleFilterChange;
					return rEl( react.FilterBtn, btn );
				});
				return btns;
			}
		
			/**
			* Render, Use a portal to render the children into a specific DOM element
			* note: It's STILL in the React DOM tree!
			*/
			render(){ 
				return ReactDOM.createPortal(
					this.filterBtns(),
					this.dom
				);	
			}
		}
		
		// make component available	
		react.Filters = Filters;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 