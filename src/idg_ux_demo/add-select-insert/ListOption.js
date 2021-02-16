/*
List Options Constructor
*/
(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );	
	
	addSelect.ListOption = function (li, parent){
		
		let _selected = li.classList.contains('selected'); // check not setup to be selected:
		let _dependents = false;
		let json = JSON.parse(li.dataset.insert);
		
		
		/*
		Does list have any dependency lists?
		*/
		if( json.dependents !== undefined ){
			// build dependents
			_dependents = new addSelect.OptionDependents(json.dependents, parent.uniqueId);
		}
	
		/*
		Methods
		*/ 
		this.click = function(){
			this.toggleState();
			parent.optionClicked( _selected, this );
	
			if(_dependents != false){
				_dependents.show( _selected );
			}	
		};
		
		this.toggleState = function() {
			li.classList.toggle('selected'); 
			_selected = !_selected;
		};	
		
		this.deselect = function(){
			if( _selected ){
				this.toggleState();
			}
		};
		
		
		Object.defineProperty(this, 'selected',{
			get: () => {
				return _selected;
			},
			set: (v) => {
				_selected = v;
				if(!v){
					li.classList.remove('selected');
				}
			}
		});
		
		Object.defineProperty(this, 'dependents',{
			get: () => {
				return _dependents === false ? false : true; 
			}
		});
		
		Object.defineProperty(this, 'value',{
			get: () => {
				return json.value; 
			}
		});
		
	
	
		/*
		Events 
		*/
		li.addEventListener( "mousedown", this.click.bind( this ) );
	};
		
})(bluejay); 