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
				
				// Following React Docs example, store DOM Element here
				// then use a Portal to render the children into the DOM.
				this.dom = document.getElementById('js-clinic-filter');
				
				this.filterBtns = this.filterBtns.bind( this );
			}
		
			/**
			* Create <li> elements as buttons.
			* @returns {Array} of React Elements
			*/
			filterBtns(){
				const btns = this.props.btns.map( btn => {
					btn.onClick = this.props.onFilterChange;
					return rEl( react.FilterBtn, btn );
				});
				
				// add the update-patients button here.
				btns.push(
					rEl('li', { className: 'update-clinic-btn', key: react.getKey()},
						rEl('button', { 
							className: this.props.adderOpen ? 'adder close' : 'adder open', 
							onClick: this.props.onAdderBtn 
						}, null )
					)
				);
				
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