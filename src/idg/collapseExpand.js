(function( bj ){

	'use strict';	
	
	bj.addModule('collapseExpand');
	
	/*
	Collapse and Expanding data is a common UI pattern
	Initially I approached this with "data", I then used 'group'
	Both are supported:
	
	.collapse-data
	|- .collapse-data-header-icon (expand/collapse)
	|- .collapse-data-content
	
	.collapse-group
	|- .header-icon (expand/collapse)
	|- .collapse-group-content
	
	Hotlist also required this but needed it's own styling:
	.collapse-hotlist
	|- .header-icon (expand/collapse)
	|- .collapse-group-content
	
	*/
	const collection = new bj.Collection();

	/*
	Methods	
	*/
	const _change = () => ({
		change: function(){
			if( this.open )	this.hide();
			else			this.show();
		}
	});
	
	const _show = () => ({
		show: function(){
			bj.show( this.content, "block" );
			this.btn.classList.replace('expand','collapse');
			this.open = true;
		}
	});
	
	const _hide = () => ({
		hide: function(){
			bj.hide( this.content );
			this.btn.classList.replace('collapse','expand');
			this.open = false;
		}
	});
	
	/**
	* @Class
	* @param {Object} me - initialise
	* @returns new Object
	*/
	const Expander = (me) => Object.assign( me, _change(), _show(), _hide());

	/**
	* Callback for 'Click' (header btn)
	* @param {event} event
	*/
	const userClick = (ev, type) => {
		let btn = ev.target;
		let key = collection.getKey( btn );
		let expander;
		
		if( key ){
			// already setup
			expander = collection.get( key );
		} else {
			/*
			Data/Group are generally collapsed by default
			but might be setup in the DOM to be expanded, check btn class to see
			*/
			// create new Expander
			expander = Expander({
				btn: btn,
				content: bj.find('.collapse-' + type + '-content', btn.parentNode ),
				open: btn.classList.contains('collapse') // inital state
			});
	
			// update collection 	
			collection.add( expander, btn );	
		}
		
		// either way it's a click...
		expander.change(); 
	
	};

	/*
	Events
	*/
	bj.userDown( ".collapse-data-header-icon", ev => userClick( ev, "data"));
	bj.userDown( ".collapse-group > .header-icon", ev => userClick( ev, "group"));
	bj.userDown( ".collapse-hotlist > .header-icon", ev => userClick( ev, "hotlist"));

})( bluejay ); 