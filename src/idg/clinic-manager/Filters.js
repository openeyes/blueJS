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
				
				this.filterBtns = this.filterBtns.bind( this );
			}
		
			filterBtns(){
				return this.props.btns.map( btn =>  rEl( react.FilterBtn, btn ));
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