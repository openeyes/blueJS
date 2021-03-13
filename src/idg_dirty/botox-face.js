(function( bj ) {

	'use strict';
	
	/**
	as I only need this in EDIT mode, check for a js- hook
	*/
	if(document.querySelector('.js-btx-inj-svg') === null) return;
	
	/**
	Useful DOM Elements
	Note: User can switch between Face and Eyeball SVGs 
	*/
	const face = document.querySelector('.btx-face');
	const eyeballs = document.querySelector('.btx-eyeballs');
	const list = document.querySelector('table.btx-list');
	const totalUnits = document.getElementById('js-idg-btx-unit-total');
	
	/**
	* Model + View notifications
	*/
	const model = Object.assign({
		_muscles:'face',
		_injections:[],
		
		get muscles(){
			return this._muscles;
		},
		set muscles( str ){
			this._muscles = str; // "face" or "eyeballs"
			// clear injections and remove injection Markers
			this._injections.forEach( inj => inj.div.remove());
			this._injections = [];
			this.views.notify();
		},
		
		set injections( inj ){
			// add human readable units
			inj.humanUnits = inj.units.toFixed(1);
			this._injections.push( inj );
			this.views.notify();
		},
		get injections(){
			return this._injections;
		}, 
		
		injNum(){
			return this._injections.length;	
		},
		
		removeInj( arrayRef ){
			const injs = this._injections;
			// remove the injection
			injs[arrayRef].div.remove();
			// update the list
			injs.splice( arrayRef, 1 );
			// update all list references
			injs.forEach(( inj, index ) => {
				inj.injCount = index + 1;
				inj.ref = index;
				inj.div.innerHTML = injMarkerText( inj.units, inj.injCount);
			});
			
			// re-render
			this.views.notify();
		}, 
		
		volumeChange( arrayRef, volume ){
			const inj = this._injections[ arrayRef ];
			const integer = Math.round( parseFloat( volume ) * 10 ); // allow for extreme precision
			inj.vol = integer / 10;
			inj.units = calcUnits( inj.vol );
			inj.humanUnits = inj.units.toFixed(1);
			inj.div.innerHTML = injMarkerText( inj.units, inj.injCount);
			showTotalUnits();
		}
		
	}, bj.ModelViews());
	
	/**
	* View - Handle the SVG display
	*/
	const muscleMode = () => {
		if( model.muscles == "face"){
			bj.show( face );
			bj.hide( eyeballs );
		} else {
			bj.hide( face );
			bj.show( eyeballs );
		}
	}
	
	model.views.add( muscleMode );
	
	/**
	* View - render the table rows for the btx list
	*/
	const renderList = () => {
		const tr = [
			'{{#list}}<tr>',
			'<td><span class="highlighter"><b>{{injCount}}</b></span></td>',
			'<td><input type="text" value="{{muscles}}" class="cols-11"></td>',
			'<td>{{side}}</td>',
			'<td><input type="number" step="0.1" min="0" max="5" value="{{vol}}" class="fixed-width-medium js-idg-btx-vol" data-btx="{{ref}}"/></td>',
			'<td>{{humanUnits}}</td>',
			'<td>Botox (BTX)</td>',
			'<td><i class="oe-i trash" data-btx="{{ref}}"></i></td>',
			'</tr>{{/list}}',
		].join('');
		
		const tbody = list.querySelector('tbody');
		bj.empty( tbody );
		tbody.innerHTML = Mustache.render( tr, { list: model.injections });
	};
	
	model.views.add( renderList );
	
	/**
	* View - show total Unit count for all injections
	*/
	const showTotalUnits = () => {
		const injs = model.injections;
		let units = 0;
		if( injs.length ){
			units = model.injections.reduce(( accumulator, inj ) => accumulator + inj.units, 0 );
		}
		// update totalUnits for agent
		totalUnits.textContent = units.toFixed(1);		
	};
	
	model.views.add( showTotalUnits );
	
	/**
	* Helpers
	*/
	const injMarkerText = ( units, count ) => `<div class="units">${units.toFixed(1)}</div><div class="agent">BTX</div><div class="inj-num">${count}</div>`;
	
	const calcUnits = ( vol ) => {
		const unitsPerMl = document.querySelector('input[name="btx-units-ml"]');
		return  vol * parseInt( unitsPerMl.value, 10 ); // floating point
	}
	
	/**
	* @callback - user clicks on face
	* Build <div> to show injection and update list
	* @param {Number} - offsetX 
	* @param {Number} - offsetY
	*/
	const addInj = ( x, y ) => {
		//console.log(`x ${x} : y ${y}`);
		
		// default volume: 
		const userDefaultVolume = document.querySelector('input[name="btx-volume-ml"]');
		const volume = parseInt(( parseFloat( userDefaultVolume.value ) * 10 ), 10); // allow for extreme precision
		
		const injNum = model.injNum();
		const injCount = injNum + 1;
		const injUnits = calcUnits( volume / 10 ); // default Units
		
		const div = bj.div('inj-marker');
		div.style.top = (y - 30) + 'px'; // CSS sets .inj-marker height to 30px;
		div.style.left = x + 'px';
		div.innerHTML = injMarkerText( injUnits, injCount );
		
		let muscles = "";
		let side = x > 192 ? 'Left' : 'Right';
		
		// show injection on current muscles SVG: 
		if( model.muscles == "face"){
			/*
			Face!
			*/
			face.append( div );
			
			muscles = "Frontalis"; 
			
			if( y > 118) muscles = "Corrugator";
			if( y > 139) muscles = "Orbicularis upper";
			if( y > 190) muscles = "Orbicularis lower";
			if( y > 242) muscles = "Zygomaticus";
			if( y > 310) muscles = "Mentalis";
			if( y > 375) muscles = "Platysma";
			
			// Procerus - midline
			if(( x < 201 && x > 174) && ( y < 181 && y > 130 )){
				side = "Midline";
				muscles = "Procerus";
			}
			
			// Procerus - midline
			if(( x < 245 && x > 151) && ( y < 310 && y > 280 )){
				muscles = "Orbicularis oris";
			}
	
		} else {
			/*
			Eyeballs!
			*/
			eyeballs.append( div );
			
			if( y < 160 && y > 136 ) muscles = "Superior";
			if( y < 240 && y > 218 ) muscles = "Inferior";
			
			if( y < 205 && y > 160 ){
				if( x < 110 && x > 70 ) muscles = "Lateral";
				if( x < 310 && x > 270 ) muscles = "Lateral";
				if( x < 230 && x > 150 ) muscles = "Medial";
			}
		
			muscles = muscles ? muscles + ' rectus' : '?';
			
			// inferior oblique
			if( y < 218 && y > 205 ) muscles = "inferior oblique";
		}
		
		// add new injection...
		model.injections = {
			ref: injNum,
			injCount,
			vol: volume / 10,
			units: injUnits,
			div, // it will handle removing it's div
			side,
			muscles
		};
	};
	
	/**
	* Events 
	*/
	bj.userDown('.js-btx-inj-svg', e => {
		addInj( e.offsetX, e.offsetY );
	});
	
	bj.userDown('table.btx-list .trash', e => {
		model.removeInj( parseInt( e.target.dataset.btx, 10 ));
	});
	
	document.addEventListener('change', e => {
		if( e.target.matches('.js-idg-btx-vol')){
			model.volumeChange( e.target.dataset.btx, e.target.value );
			// this is quick hack to save fixing this properly!
			e.target.parentNode.nextSibling.textContent = calcUnits( e.target.value ).toFixed(1);
		}
		
		if( e.target.matches('input[name="idg-btx-muscles"]')){
			model.muscles = e.target.value;
		}
	});
	
		
})( bluejay ); 