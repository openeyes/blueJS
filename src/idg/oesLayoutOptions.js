(function( bj ) {
	
	'use strict';
	
	bj.addModule('oesLayoutOptions'); 
	
	const dataLayoutElem = document.querySelector('.oes-hd-data-layout');
	
	// check for DOM...
	if( dataLayoutElem == null ) return; 
	
	/** 
	* Model
	* extended with views
	*/	
	const model = Object.assign({ 
		selector: {
			rootElem: 	'.oes-hd-data-layout',
			btn: 		'.oes-hd-data-layout .layout-select-btn',
			optionBtn: 	'.oes-hd-data-layout .option-btn',
			options: 	'.layout-options',
		},
		
		current: {
			eye: JSON.parse( dataLayoutElem.dataset.oes ).eyeIcons,
			layout: JSON.parse( dataLayoutElem.dataset.oes ).layout,
		},

		get eye(){
			return this.current.eye;
		}, 
		
		set eye( val ){
			if( val === this.current.eye ) return false;
			this.current.eye = val;
			this.views.notify();
		},
		
		get layout(){
			return this.current.layout;
		},
		
		set layout( val ){
			if( this.current.layout === val) return false;
			this.current.layout = val;
			this.views.notify();
		}
	
	}, bj.ModelViews());
	
	
	/**
	* Build DOM for eye and layout options and insert for user selection
	*/
	const buildOptions = (() => {
		// Mustache template
		const template = [
			'{{#sides}}',
			'<div class="option-btn" data-oes=\'{"opt":"eye.{{eyelat.r}}-{{eyelat.l}}"}\'><span class="oe-eye-lat-icons"><i class="oe-i laterality {{eyelat.r}} small"></i><i class="oe-i laterality {{eyelat.l}} small"></i></span></div>',
			'{{/sides}}',
			'{{#layouts}}',
			'<div class="option-btn" data-oes=\'{"opt":"layout.{{.}}"}\'><i class="oes-layout-icon i-{{.}}"></i></div>',
			'{{/layouts}}',
		].join('');
		
		// build layout DOM
		const div = document.createElement('div');
		div.className = model.selector.options.replace('.','');
		div.innerHTML = Mustache.render( template, {
			'sides' : [
				//{ eyelat: { r:'R', l:'NA'}},
				{ eyelat: { r:'R', l:'L'}},
				//{ eyelat: { r:'NA', l:'L'}}
			],
			'layouts' : ['1-0', '2-1', '1-1', '1-2', '0-1'], 
		} );
		
		bj.hide( div );
		dataLayoutElem.appendChild( div );
		
	})();

	/** 
	* View 
	* show current state of model in UI
	*/
	const currentState = (() => {
		// btn DOM elements
		const css = {
			layout: 'oes-layout-icon'
		};
		
		const layoutBtn = document.querySelector( model.selector.btn );
		const layout = layoutBtn.querySelector( '.' + css.layout );
		const eyelat = layoutBtn.querySelector( '.oe-eye-lat-icons' );

		const iconTemplate ='{{#eyes}}<i class="oe-i laterality {{.}} small pad"></i>{{/eyes}}';
		
		/**
		*  make sure UI reflects model updates
		*/
		const update = () => {
			
			layout.className = css.layout + '  i-' + model.layout;
		
			let eyes = model.eye.split('-'); 
			eyelat.innerHTML = Mustache.render( iconTemplate, { eyes });
		};
		
		// add to observers
		model.views.add( update );
		
	})();
	
	
	const oesSides = (() => {
		// dom side divs
		let layout = null;
		const right = document.querySelector('.oes-v2 .oes-right-side');
		const left = document.querySelector('.oes-v2 .oes-left-side');
		
		/**
		* set layout proportions to match the model
		*/
		const resize = () => {
			if(model.layout === layout) return; 
			layout = model.layout;
		
			// options (see buildOptions above)
			// ['1-0', '2-1', '1-1', '1-2', '0-1']
			switch( layout ){
				case '1-0': 
					left.style.width = "";
					bj.show( left );
					bj.hide( right );			
				break;
				case '0-1': 
					right.style.width = "";
					bj.hide( left );
					bj.show( right );			
				break;
				case '2-1':
					left.style.width = "66%"; 
					right.style.width = "33%";
					bj.show( left );
					bj.show( right );			
				break;
				case '1-2':
					left.style.width = "33%"; 
					right.style.width = "66%";
					bj.show( left );
					bj.show( right );			
				break;
				case '1-1':
					left.style.width = "50%"; 
					right.style.width = "50%";
					bj.show( left );
					bj.show( right );			
				break;
				
				default: 
					throw new TypeError('[bluejay] [oesLayoutOptions] - unknown layout: ' + layout);
			}
			
			bj.customEvent('oesLayoutChange', layout);
		};
		
		// make widths are set correctly on initalisation
		resize();
		
		// add to observers
		model.views.add( resize );
	})();
	
	
	/** 
	* View 
	* Data and Layout options bar
	*/
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
	* Handler
	* @param {JSON} dataAttr - see Mustache template above
	*/
	const requestOption = ( dataAttr ) => {
		let json = JSON.parse( dataAttr ); 
		let arr = json.opt.split('.');
	
		if( arr[0] == 'eye' ) model.eye = arr[1];
		if( arr[0] == 'layout' ) model.layout = arr[1];
		
	};
	
	/**
	* Events
	*/
	bj.userDown( model.selector.btn, options.change );
	bj.userEnter( model.selector.btn, options.show );
	bj.userLeave( model.selector.rootElem, options.hide );
	// select an option 
	bj.userDown( model.selector.optionBtn, ( ev ) => requestOption( ev.target.dataset.oes ) );
	
	
})( bluejay ); 