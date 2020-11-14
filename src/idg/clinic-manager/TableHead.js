(function( bj ){

	'use strict';	
	
	/**
	* React Component 
	*/
	const buildComponent = () => {
				
		const rEl = React.createElement;
		const react = bj.namespace('react');

		/*
		TableHeaders don't change - use React.PureComponent:
		"...instead of writing shouldComponentUpdate() by hand, inherit from React.PureComponent. Equivalent 
		to implementing shouldComponentUpdate() with a shallow comparison of current and previous props and state."
		*/
		class TableHead extends React.PureComponent {
			
			/*
			Or, could use a regular Component and just set this to false
			shouldComponentUpdate(nextProps, nextState) {
			  return false;
			}
			*/
			
			render(){
				const headers = this.props.th.map( th => rEl('th', { key: react.getKey() }, th ));
				return (
					rEl('thead', null, 
				 		rEl('tr', null, headers)
				 	)
				);
			}
		}
		
		// make component available	
		react.TableHead = TableHead;			
	};
	
	/*
	When React is available build the Component
	*/
	document.addEventListener('reactJSloaded', buildComponent, { once: true });
	  

})( bluejay ); 