/*
Optional Lists based on List selection
find group ID: 	"add-to-{uniqueID}-listgroup{n}";
find list ID: 	"add-to-{uniqueID}-list{n}";

@param dependents: String e.g. "2.1" or "2.1,2.2": 
*/

(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.getModule('addSelect');	
	
	addSelect.OptionDependents = function( dependents, listId ){

		if(dependents === undefined)  return false;
		
		/*
		List has extra list options	
		*/
		const idPrefix = "#add-to-" + listId + "-";
		let groups = [];
		
		/*
		Can be mulitple list groups.
		Check string for commas "2.1,2.2" for groups
		*/
		dependents.split(',').forEach( group => {
			
	
			let ids = group.split('.'); // could be mutliple list IDs e.g. 2.3.4.5
			let obj = {};
			// find group
			obj.div = document.querySelector(idPrefix + 'listgroup'+ids[0] ); // <div> wrapper for optional lists
			obj.holder = obj.div.querySelector('.optional-placeholder'); // default placeholder for Optional Lists
	
			/*
			Does it have lists, or show default text?
			e.g. 2.0
			*/
			if( ids[1] == 0 ){
				obj.showDefaultText = true;
			} else {
				obj.showDefaultText = false;
				/*
				Not a ZERO... so:
				Loop through option lists required
				e.g. 2.4.5 (two lists in group '2')
				*/
				obj.lists = [];
				for(let i=1;i<ids.length;i++ ){
					obj.lists.push( document.querySelector(idPrefix + 'list' + ids[i]));
				}
			}
			
			groups.push(obj);
		});
	
		/*
		Methods
		*/
		this.show = function( show ){
			if(show){
				/*
				hide ALL optional lists
				$('#add-to-'+listId+' .optional-list').hide();
				*/
				this.myLists();
			} else {
				// unclick
				this.reset();
			}
		};
	
		this.hideAllOptionalLists = function(div){
			let optionalLists = uiApp.nodeArray(div.querySelectorAll('.optional-list'));
			optionalLists.forEach((list) => {
				uiApp.hide(list);
			});
			
		};
	
		this.myLists = function(){
			groups.forEach( group => {
				/*
				in group hide other lists
				*/
				this.hideAllOptionalLists(group.div);
				
				if(group.showDefaultText){
					uiApp.show(group.holder);
				} else {
					uiApp.hide(group.holder);
					// show required Lists
					group.lists.forEach( list => {
						uiApp.show(list);
					});
				}
				
			});
		};
		
		/*
		Reset (these!) groups!	
		*/
		this.reset = function(){
			groups.forEach( group => {
				this.hideAllOptionalLists(group.div);
				uiApp.show(group.holder);
			});
		};
			
	};
	
})(bluejay); 