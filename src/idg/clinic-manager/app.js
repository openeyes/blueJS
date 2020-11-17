(function( bj ){

	'use strict';	
	
	bj.addModule('clinicManager');
	
	/*
	Check we are on IDG Clinic Manager page... 
	*/
	if( document.getElementById('js-clinic-manager') === null ) return;
	
	/**
	React JS. Notes to self.
	Try to avoid deeply nested state objects. React JS is NOT oriented to work well with nested states 
	(and other solutions are hack) so.. e.g. 
	
	this.state = {
	    someProperty: {
	        flag: true
	    }
	}
	
	should be...
	
	this.state = {
	    somePropertyFlag: true
	}
	
	Unless you need features available only in a class, React encourages you to use function components instead.
	
	PureComponent: If your React component’s render() function renders the same result given the 
	same props and state, you can use React.PureComponent for a performance boost in some cases. 
	PureComponent is exactly the same as Component except that it handles the shouldComponentUpdate method for you.
	Use PureComponent instead of Component so long as you follow two simple rules: 
	1) Mutations are bad in general, but the problems are compounded when using PureComponent. 
	2) If you’re creating new functions, objects, or arrays in the render method you’re (probably) doing it wrong.
	
	Don’t bind values in functions in render
	Don’t derive data in the render method
	
	Useful articles:
	https://reactjs.org/blog/2015/12/18/react-components-elements-and-instances.html
	https://codeburst.io/when-to-use-component-or-purecomponent-a60cfad01a81
	*/
	
	
	/*
	Name space for React Components.
	Loading ReactJS dynamic.	
	*/
	const react = bj.namespace('react');
	
	/*
	Helpers
	React needs unique keys for all Elements in a list (anything in a loop)
	It suggests Strings...
	*/
	function *UniqueKey(){
		let id = 0;
		while( true ){
			++id;
			yield `uid${id}`;
		}
	}
	
	const keyIterator = UniqueKey();
	
	react.getKey = () => keyIterator.next().value; 
	
	react.fullShortCode = ( shortcode ) => {
		let full = shortcode; // "Nurse" doesn't need expanding on
		switch( shortcode ){
			case 'Arr': full = "Arrived"; break;
			case 'Fin': full = "Finish"; break;
			
			case "MM" : full = "Mr Michael Morgan"; break;
			case "AB" : full = "Dr Amit Baum"; break;
			case "AG" : full = "Dr Angela Glasby"; break;
			case "RB" : full = "Dr Robin Baum"; break;
			case "CW" : full = "Dr Coral Woodhouse"; break; 
			
			case "DNA" : full = "Did Not Attend"; break;
			case "VA" : full = "Visual Acuity"; break;
			
		}
		return full; 
	}; 
	
	
	react.deepCopy = ( obj ) => {
		// object clone	
		const cloneObj = () => {
			const clone = {};
			for ( let key in obj ) {
				if ( obj.hasOwnProperty( key )) {
					clone[key] = react.deepCopy( obj[key] );
				}
			}
			return clone;
		};
		
		// array clone
		const cloneArr = () => obj.map( item => react.deepCopy( item ));
		
		// check type
		const type = Object.prototype.toString.call(obj).slice(8, -1).toLowerCase();
		if( type === "object" ) return cloneObj();
		if( type === "array") return cloneArr();
		return obj; // primitive value
	};
	

	/**
	* Initalise Clinic Manager SPA
	* Broadcast to all listeners that React is now available to use for building elements
	*/
	const init = () => {
		bj.log('[Clinic Manager] - intialising');
		
		/*
		reactJS is now available
		OK to build React components/elements, let 'em know...
		*/
		bj.customEvent('reactJSloaded');
		
		/*
		To make the IDG UX prototype easier to change initial state JSON is provided by PHP.
		For the purposes of the demo all times are set in RELATIVE minutes. 
		Update all JSON times to full timestamps
		*/
		const patientsJSON = JSON.parse( phpClinicDemoJSON );
		patientsJSON.forEach(( patientRow, i ) => {
			/*
			Add extra Patient React info here
			*/
			patientRow.arrRef = i; 
			
			/*
			As times are relative to 'now', make sure appointments 
			always appeared scheduled on whole 5 minutes 
			*/
			const appointment = new Date( Date.now() + ( patientRow.booked * 60000 )); 
			const offsetFive = appointment.getMinutes() % 5; 
			appointment.setMinutes( appointment.getMinutes() - offsetFive );
			patientRow.booked = appointment.getTime();
			
			/*
			Step Pathway is multi-dimensional array.
			Convert each step into an Object and add other useful info here. 
			*/		
			patientRow.pathway.forEach(( step, i, thisArr ) => {
				const obj = {
					arrRef:i, // will need this to update state 
					key: react.getKey(), // this provides a unique React key
					shortcode: step[0],
					timestamp: Date.now() + ( step[1] * 60000 ),
					status: step[2],
					type: step[3],
				};
								
				// update the nested step array to an Object
				thisArr[i] = obj;
			});
		});
		
		/* 
		OK, ready.
		ReactJS App for Clinic Manager
		*/
		ReactDOM.render(
		  React.createElement( react.Clinic, { patientsJSON }),
		  document.getElementById('js-clinic-manager')
		);
	};
	
	/*
	Load React JS, then initalise
	Make sure to load the React package before loading ReactDOM.
	react.production.min.js || react.development.js
	*/
    bj.loadJS('https://unpkg.com/react@17/umd/react.development.js', true)
    	.then( () => {
	    	 bj.loadJS('https://unpkg.com/react-dom@17/umd/react-dom.development.js', true)
	    	 	.then( () => init() ); 
    	});
	  

})( bluejay ); 