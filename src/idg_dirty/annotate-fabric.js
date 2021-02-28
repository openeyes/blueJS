(function( bj ) {

	'use strict';
	
	// dirty demo of fabric annotation on IDG
	if( document.getElementById('js-idg-annotate-image-tester') == null ) return;
	
	// user can test different images on IDG via a dropdown
	// /v3-SEM-events/document-annotate
	
	const init = () => {
		bj.log(`[Annotate] - Fabric Version ${fabric.version}`);
	
		// div.oe-annotate-image wrapper for the toolbox and canvas-js for Fabric	
		const annotate = document.getElementById('js-idg-annotate-image-tester');
		
		// line width is using input [range], only need it for freedraw, hide on other tools
		const lineWidth = annotate.querySelector('.line-width');
		
		let activeTool = null; // store current tool (to handle adding removing "draw" class)
		let drawColor = "#f00"; // user selected colour
		
		/*
		Create CANVAS and append to DOM
		*/
		const canvasElem = document.createElement('canvas');
		canvasElem.id = 'c1';
		canvasElem.textContent = "Image annotation tool";
		annotate.querySelector('.canvas-js').append( canvasElem );

		/* 
		Fabric fun...
		*/
		const canvas = new fabric.Canvas('c1');
		
		// Selecting Object styling
		fabric.Object.prototype.set({
		    borderColor: 'rgb(0,255,255)', // funky OE Electric blue!
			cornerColor: 'rgb(0,255,255)', 
			cornerSize: 12,
			transparentCorners: false
		});
		
		// set up the default line (default to middle setting 3)
		canvas.freeDrawingBrush.color = drawColor;
		canvas.freeDrawingBrush.width = 12; // ( user line width * 4 )
		
		
		/**
		* set up the canvas for an image, iDG is demo-ing different images
		* reset each time...
		* @param {String} img - jpg
		* @param {Number} w - width 
		* @param {Number} h - height
		*/
		const resetCanvas = ( img, w, h ) => {
			canvas.clear();
			
			const canvasMaxWidth = annotate.offsetWidth - 160; // allow for the toolbox
			const imgScale = canvasMaxWidth / w;
			// update canvase size
			canvas.setHeight( h * imgScale );
			canvas.setWidth( canvasMaxWidth );
			
			// image background
			fabric.Image.fromURL(`/idg-php/imgDemo/annotate/${img}.jpg`, oImg => {
				oImg.scale( imgScale );
				canvas.setBackgroundImage( oImg, canvas.renderAll.bind( canvas ));
			});
		};
		
		/**
		* Circle draw
		*/
		const drawCircle = (() => {
			let active, adjust; 
			
			/**
			* @callback for mouse:down
			* @param {Event} e
			*/
			const addCircle = ( e ) => {
				if( !active || adjust ) return; adjust = true;
				
				// create a new circle
				const circle = new fabric.Circle({
					radius: 30, // a standard size 
					left: e.pointer.x - 30, 
					top: e.pointer.y - 30, 
					fill: false,
					stroke: drawColor,
					strokeWidth: 4, // fixed!
					centeredScaling: true
				});
				
				canvas.add( circle ); // add Circle
				canvas.setActiveObject( circle ); // set as active to provide instant control	 
			};
			
			// Listeners
			canvas.on('mouse:down', ( e ) => addCircle( e ));	
			canvas.on('selection:cleared', () => adjust = false );
			
			// simple API
			const start = () => {
				active = true;
				adjust = false;
			};
			
			const stop = () => {
				active = false;
			};	
		
			return { start, stop };
		})();
		
		/**
		* Pointer (Arrow) draw
		*/
		const drawPointer = (() => {
			let active, adjust;
			
			// build the pointer template group
			const triangle = new fabric.Triangle({ width: 30, height: 30, fill: 'red', left: 30, top: 30 });
			const line = new fabric.Line([42,60,42,120],{ stroke: 'red', strokeWidth: 7 });
			const template = new fabric.Group([ triangle, line ], { originY:'top', });
			
			const addPointer = ( e ) => {
				if( !active || adjust ) return; adjust = true;
				
				// clone the template
				let newPointer; 
				template.clone(( copy ) => newPointer = copy );
				
				// which quarter is the user adding the arrow in?
				const topHalf = ( canvas.height / 2 ) > e.pointer.y;
				const leftHalf = ( canvas.width / 2 ) > e.pointer.x; 
				let r, x, y; 
				
				if( topHalf ){
					if( leftHalf ){
						r = -45;
						x = e.pointer.x;
						y = e.pointer.y + 18;
					} else {
						r = 45;
						x = e.pointer.x - 18;
						y = e.pointer.y;
					}
				} else {
					if( leftHalf ){
						r = -135;
						x = e.pointer.x + 20;
						y = e.pointer.y;
					} else {
						r = 135;
						x = e.pointer.x;
						y = e.pointer.y - 20;
					}
				}
				
				// adjust and position new Pointer
				newPointer.rotate( r );
				newPointer.set({
					top: y,
					left: x,
				});
				
				canvas.add( newPointer ); // add Pointer
				canvas.setActiveObject( newPointer ); // set as active to provide instant control
			};
			
			// Listeners
			canvas.on('mouse:down', ( e ) => addPointer( e ));	
			canvas.on('selection:cleared', () => adjust = false );
			
			// simple API
			const start = () => {
				active = true;
				adjust = false;
			};
			
			const stop = () => {
				active = false;
			};	
		
			return { start, stop };
		})();

		
		
		/**
		* Controller for tool button events 
		* @param {Element} button - user requests a tool
		*/
		const toolChange = ( toolBtn ) => {
			if( toolBtn.name == 'erase'){
				canvas.remove( canvas.getActiveObject());
				return;
			}
			
			// update the UI
			if( activeTool ) activeTool.classList.remove('draw');			
			activeTool = toolBtn;
			toolBtn.classList.add('draw');
			
			// reset to defaults
			drawCircle.stop();
			drawPointer.stop();
			canvas.set('isDrawingMode', false );
			canvas.set('defaultCursor', 'crosshair');
			
			// only need line width for freedraw
			lineWidth.style.display = "none";
			
			switch( toolBtn.name ){
				case 'manipulate': 
					canvas.set('defaultCursor', 'auto'); 
				break;
				case 'freedraw': 
					canvas.set('isDrawingMode', true );
					lineWidth.style.display = "block";
				break;
				case 'circle': 
					drawCircle.start();
				break;
				case 'pointer': 
					drawPointer.start();
				break;
			}
		};
		
		// use BlueJS event delegation for toolbox buttons 
		bj.userDown('.js-tool-btn', ( e ) => toolChange( e.target ));
		
		// linewidth input range
		lineWidth.querySelector('input').addEventListener('change', ( e ) => {
			const w = e.target.value;
			lineWidth.querySelector('small').textContent = `Line width: ${w}`;
			canvas.freeDrawingBrush.width = ( w * 4);
		});
		
		/*
		IDG!
		provide a dropdown to switch the image in the canvas to test different sizes... 
		*/
		const selectImage = document.getElementById('js-idg-annotate-image');
		const imageOptions = selectImage.options;
		selectImage.addEventListener('change', () => {
			const optionSelected = imageOptions[ imageOptions.selectedIndex ];
			const imgSize = ( JSON.parse(optionSelected.dataset.idg) );
			resetCanvas( optionSelected.value, imgSize.w, imgSize.h );
		}, false);
		
		/*
		Quick init
		*/
		resetCanvas('face-muscles', 1280, 720 );
		toolChange( document.querySelector('.js-tool-btn[name="freedraw"]'));
	};
	
	
	// load in Fabric
	bj.loadJS('https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.3.1/fabric.min.js', true )
		.then(() => init());
	
	
})( bluejay ); 