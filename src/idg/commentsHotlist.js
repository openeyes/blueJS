(function( bj ) {
	'use strict';	
	
	bj.addModule('commentHotlist');	

	// DOM collection
	const collection = new bj.Collection();
	
	/**
	* Methods
	*/
	const _reset = () => ({
		/**
		* VIEW: Reset the comment. 
		*/
		reset(){
			this.editMode = false;
			this.icon('comment');
			bj.hide( this.elem.textarea );
			bj.hide( this.elem.userComment );
		}
	});
	
	const _show = () => ({
		/**
		* VIEW: Show the comment. 
		*/
		show(){
			this.editMode = false;
			this.icon('edit');
			
			// set the comment text
			this.elem.userComment.textContent = this.comment;
			
			bj.hide( this.elem.textarea );
			bj.show( this.elem.userComment, 'block' );
		}
	});
	
	const _edit = () => ({
		/**
		* VIEW: Edit the comment. 
		*/
		edit(){
			this.editMode = true;
			this.icon('save');
			bj.show( this.elem.textarea, 'block' );
			bj.hide( this.elem.userComment );
			
			// set the comment text
			this.elem.textarea.value = this.comment;
			
			// check the resize
			bj.resizeTextArea( this.elem.textarea );
			
			// and set focus for cursor
			setTimeout( () => this.elem.textarea.focus() , 20);
			
			/*
			Allow user to update comments with an Enter press
			(alternative to icon click)
			*/
			const keyPress = ( ev ) => {
				ev.stopPropagation();
				if( ev.key === "Enter" ){
					this.elem.textarea.removeEventListener("keydown", keyPress, false );
					this.update();
				}
			};
			// must match the removeEventListener.
			this.elem.textarea.addEventListener("keydown", keyPress, false );				
		}
	});
	
	const _icon = () => ({
		/**
		* VIEW: Icon state. 
		*/
		icon( state ){
			this.elem.icon.classList.remove('comments', 'comments-added', 'save', 'active');
			switch( state ){
				case 'comment': this.elem.icon.classList.add('comments');
				break;
				case 'edit': this.elem.icon.classList.add('comments-added');
				break;
				case 'save': this.elem.icon.classList.add('save', 'active');
				break;
				
				default: bj.log(`commentHotlist - unknown icon: ${state}`);
			}
		}
	});
	
	
	const _userClick = () => ({
		/**
		* Clicking icon can only have two options
		*/
		userClick(){
			// icon clicked, update based on current state
			if( this.editMode ){
				this.update();
			} else {
				this.edit();
			}
		}
	});
	
	const _update = () => ({
		/**
		* Update the comment text and the state depending 
		* the text... if it's an empty string then reset
		*/
		update(){
			let text = this.elem.textarea.value.trim();
			if( text.length < 2 ){
				this.comment = "";
				this.reset();
			} else {
				this.comment = text;
				this.show();
			}
		}
	});
	

	/**
	* @Class 
	* @param {Element} icon
	* @param {Element} <td>
	* @param {String} comments to initalise template with.
	* @returns new Object
	*/
	const PatientComment = ( icon, td, comment = "" ) => {
		// Mustache template
		const template = [
			'<textarea placeholder="Comments" rows="1" class="cols-full" style="display:none"></textarea>',
			'<div class="user-comment" style="display:none">{{comment}}</div>',
		].join('');
		
		/*
		Initalise the DOM for comments
		*/
		let div = document.createElement('div');
		div.className = 'patient-comments';
		div.innerHTML = Mustache.render( template, { comment: comment });
		td.appendChild( div );
		
		// get the new Elements
		let textarea = div.querySelector('textarea');
		let userComment = div.querySelector('.user-comment');
		
		return Object.assign({ 
				editMode: false,
				comment,
				elem: { 
					icon, textarea, userComment 
				}
			},
			_reset(),
			_show(),
			_edit(), 
			_icon(),
			_userClick(),
			_update()
		);
	};
	
	/**
	Initalise from DOM
	check to see if PHP static comments are added
	*/
	let hotlistPatients = bj.nodeArray( document.querySelectorAll( '.oe-hotlist-panel .patients-open tr, .oe-hotlist-panel .patients-closed tr' ));
	
	hotlistPatients.forEach( (tr) => {
		let json = JSON.parse( tr.dataset.comment );
		if( json.comment ){
			let icon = tr.querySelector('.oe-i.comments');
			let td = tr.querySelector('.js-patient-comment');
			let patientComment = PatientComment( icon, td, json.comment );
			patientComment.show();
			
			// init and record Key
			collection.add( patientComment, icon );
		}
	});
	
	/**
	* Callback for Event (header btn)
	* @param {event} event
	*/
	const userClick = (ev) => {
		const icon = ev.target;
		let key = collection.getKey( icon );
		
		if( key ){
			let patientComment = collection.get( key );
			patientComment.userClick();
		} else {
			// Not Setup.
			let tr = bj.getParent(icon, 'tr');
			let td = tr.querySelector('.js-patient-comment');
			let patientComment = PatientComment( icon, td );
			patientComment.edit(); // user clicked on comment icon

			// update collection 	
			collection.add( patientComment, icon );	
		}		
	};

	bj.userDown('.oe-hotlist-panel .js-comment-icon', userClick);

})( bluejay ); 
