(function (uiApp) {

	'use strict';	
	
	const addSelect = uiApp.namespace( 'addSelect' );
	
	addSelect.Popup = function( greenBtn ){	
		
		let popup = document.querySelector('#' + greenBtn.dataset.popup);
		
		if( popup == null ) return;
		
		let lists = [];
		const reset = true;
		const require = false; 
	
		/*
		Using in analytics to build the data filters. Popup
		needs to anchor to the left. Can not rely to x < n to do this.
		*/
		this.anchorLeft = popup.dataset.anchorLeft ? true : false;
	
		/*
		Props
		*/ 
		this.btn = greenBtn;  
		this.popup = popup;
		this.closeBtn = popup.querySelector('.close-icon-btn');
	
		/*
		Methods
		*/
		this.open = function(){
			this.position();
			addSelect.closeAll();
			uiApp.show(popup, 'block');
			
			this.closeBtn.addEventListener('mousedown', this.close.bind(this));
			//window.addEventListener('scroll', this.close.bind(this), {capture:true, once:true});
		};
		
		this.close = function(){
			popup.style.display = "none";	
		};
		
		this.reset = function(){
			// reset (to default state)
		};
		
		let addOptions = uiApp.nodeArray(popup.querySelectorAll('.add-options'));
		addOptions.forEach((option) => {
			let list = new addSelect.OptionsList(option);
			list.checkForDefaultSelections();
			lists.push(list);
		});
		
		//idg.addSelectInsert.btnEvent( this, $popup.children('.close-icon-btn'), this.close );
		this.btn.addEventListener('mousedown', this.open.bind(this) );		
	};
	
	
	addSelect.Popup.prototype.position = function(){
		let rect = this.btn.getBoundingClientRect();	
		let w = window.innerWidth; // hmmm, this could be better as forces reflow
		let h = window.innerHeight;
		let posH = (h - rect.bottom);
		
		// check popup doesn't go off the top of the screen 
		// and don't overlay Logo! or Patient Name
		if(h - posH < 325){
			posH = h - 325;
		}
		
		/*
		Popup can be 'requested' to anchor left.
		Only used in Analytics (so far)	
		*/
		if( this.anchorLeft ){
			this.popup.style.left = rect.left + 'px';
		} else {
			// is popup pushing off the left
			let leftSideEdge = rect.right - this.popup.getBoundingClientRect().width;
			let adjustRight =  leftSideEdge < 0 ? leftSideEdge - 25 : 0;
			this.popup.style.right = (w - rect.right) + adjustRight + 'px' ;
		}
		
		this.popup.style.bottom = posH + 'px';

	};
	
		
})(bluejay); 
