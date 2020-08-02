(function( bj ) {
	
	'use strict';
	
	bj.addModule('oesLayoutOptions'); 
	
	const dataLayoutElem = document.querySelector('.oes-hd-data-layout');
	if( dataLayoutElem == null ) return; // DOM check
	
	/** 
	* Model
	*/	
	const model = Object.assign( bj.ModelViews(), { 
		selector: {
			root: 		'.oes-hd-data-layout',
			btn: 		'.oes-hd-data-layout .layout-select-btn',
			optionBtn: 	'.oes-hd-data-layout .option-btn',
			options: 	'.layout-options',
		},
		side: dataLayoutElem.dataset.eye,
		layout:dataLayoutElem.dataset.layout, 
		changed(){
			this.views.notify();
		} 		
	});
	
	/**
	* Build eye and layout options and insert for user selection
	*/
	const buildOptions = (() => {
		// Mustache template
		const template = [
			'{{#sides}}',
			'<div class="option-btn" data-oes=\'{"opt":"eye.{{eyelat.r}}-{{eyelat.l}}"}\'><span class="oe-eye-lat-icons"><i class="oe-i laterality {{eyelat.r}} small"></i><i class="oe-i laterality {{eyelat.l}} small"></i></span></div>',
			'{{/sides}}',
			'{{#layouts}}',
			'<div class="option-btn" data-oes=\'{"opt":"layout.{{.}}}"}\'><i class="oes-layout-icon i-{{.}}"></i></div>',
			'{{/layouts}}',
		].join('');
		
		// build layout DOM
		const div = document.createElement('div');
		div.className = model.selector.options.replace('.','');
		div.innerHTML = Mustache.render( template, {
			'sides' : [
				{ eyelat: { r:'R', l:'NA'}},
				{ eyelat: { r:'R', l:'L'}},
				{ eyelat: { r:'NA', l:'L'}}
			],
			'layouts' : ['1-0', '2-1', '1-1', '1-2', '0-1'], 
		} );
		
		bj.hide( div );
		dataLayoutElem.appendChild( div );
		
	})();
	

	/** 
	* Views
	*/
	const layout = (() => {
		// observer model changes
		const update = () => {
			console.log('Model updated');
		};
		
		model.views.add( update );
		
	})();
	
	// Data and Layout options bar
	const options = (() => {
		
		let showing = false;
		const btn = dataLayoutElem.querySelector(  model.selector.btn );
		const elem = dataLayoutElem.querySelector( model.selector.options );
		
		/**
		* Event callbacks
		*/
		const show = ( ev ) => {
			showing = true;
			bj.show( elem); 
			btn.classList.add('active'); 
		};
		
		const hide = ( ev ) => {
			showing = false;
			bj.hide( elem );
			btn.classList.remove('active'); 
		}; 
		
		const change = ( ev ) => {
			if( showing ){
				hide();
			} else {
				show();
			}
		};
		
		// public
		return { show, hide, change };
			
	})();

	
	/**
	* Events
	*/
	bj.userDown( model.selector.btn, options.change );
	bj.userEnter( model.selector.btn, options.show );
	bj.userLeave( model.selector.root , options.hide );
	
	
})( bluejay ); 