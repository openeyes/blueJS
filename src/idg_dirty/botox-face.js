(function( bj ) {

	'use strict';
	
	// only need this in EDIT mode, use a js- hook
	if(document.querySelector('.js-btx-face') === null) return;
	
	const face = document.querySelector('.btx-face');
	const list = document.querySelector('table.btx-list');
	const atoz = "abcdefghijklmnopqrstuvwxyz";
			
	/**
	* Model with View notifications
	*/
	const model = Object.assign({
		_injections:[],
		set injections( inj ){
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
				const letter = atoz.charAt( index ).toUpperCase();
				inj.div.textContent = letter;
				inj.letter = letter;
				inj.ref = index;
			});
			
			
			// re-render
			this.views.notify();
		}
		
	}, bj.ModelViews());
	
	/**
	* View - render the table rows for the btx list
	*/
	const renderList = () => {
		const tr = [
			'{{#list}}<tr>',
			'<td><span class="highlighter"><b>{{letter}}</b></span></td>',
			'<td>{{muscles}}</td>',
			'<td>{{side}}</td>',
			'<td>Units per ml</td>',
			'<td><input type="text" class="cols-full" /></td>',
			'<td><i class="oe-i trash" data-btx="{{ref}}"></i></td>',
			'</tr>{{/list}}',
		].join('');
		
		const tbody = list.querySelector('tbody');
		bj.empty( tbody );
	
		tbody.innerHTML = Mustache.render( tr, { list: model.injections });
	};
	
	model.views.add( renderList );
	
	
	/**
	* @callback - user clicks on face
	* Build <div> to show injection and update list
	* @param {Number} - offsetX 
	* @param {Number} - offsetY
	*/
	const addInj = ( x, y ) => {
		const injNum = model.injNum();
		const assignedLetter = atoz.charAt( injNum ).toUpperCase();
		
		const div = bj.div('inj-marker');
		div.style.top = (y - 28) + 'px'; // CSS sets .inj-marker height to 28px;
		div.style.left = x + 'px';
		div.textContent = assignedLetter;
		
		// show injection
		face.append( div );
		
		// which muscle group?
		let muscles = "Frontalis"; 
		if( y > 132) muscles = "Orbicularis Upper";
		if( y > 170) muscles = "Orbiulcaris Lower";
		if( y > 205) muscles = "Maxilla";
		if( y > 285) muscles = "Mental";
		if( y > 350) muscles = "Platysma";
	
		// add new injection...
		model.injections = {
			ref: injNum,
			letter: assignedLetter,
			div, // it will handle removing it's div
			side: x > 175 ? 'Left' : 'Right',
			muscles
		};
	};
	
	
	bj.userDown('.btx-face', e => {
		addInj( e.offsetX, e.offsetY );
	});
	
	bj.userDown('table.btx-list .trash', e => {
		model.removeInj( parseInt( e.target.dataset.btx, 10 ));
	});
	
		
})( bluejay ); 