(function( bj ){

	'use strict';	
	
	/**
	* React Component - using Portal to render outside the DOM tree.
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

				// helper to build btnObj in state
				const btnObj = ( btn, filter, isStep ) => ({ btn, filter, isStep, key: react.getKey() });
				
				// Methods
				this.btn = this.btn.bind( this );
				this.filterBtns = this.filterBtns.bind( this );
			}
		
			/**
			* Build Filter Btn
			* @returns {React Element}
			*/
			btn( btnText, filterCode, isStep, count ){
				return rEl( react.FilterBtn, {
					btn: btnText,
					filter: filterCode, 
					isStep,
					count, 
					key: react.getKey(),
					onClick: this.props.onFilterChange,
					selected: ( this.props.clinicFilter == filterCode )
				});
			}
			
		
			/**
			* Create <li> elements as buttons.
			* @returns {Array} of React Elements
			*/
			filterBtns(){
				// work out the counts per filter.
				const countFilters = filter => {
					return this.props.allAssigned.reduce( (acc, curr ) => {
						if( curr === filter ) return acc + 1;
						return acc;
					}, 0);
				};
			
				
				let btns = [];
				
				btns.push( this.btn('Show all','showAll', false, 0 ));
				btns.push( this.btn('Hide completed','hideComplete', false, 0 ));
	
				btns = btns.concat( react.assignList.map( personCode => this.btn( personCode, personCode, true, countFilters( personCode ))));
				
				btns.push( this.btn('Unassigned', 'nobody', false, countFilters( false )));
								
				// add the update-patients button here.
				btns.push(
					rEl('li', { className: 'update-clinic-btn', key: react.getKey()},
						rEl('button', { 
							className: this.props.showAdder ? 'adder close' : 'adder open', 
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