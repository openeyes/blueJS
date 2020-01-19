/**
* Attachments Thumbnails
* Open up a fullscreen popup up of PNG or PDF
*/
(function (uiApp) {

	'use strict';
	
	uiApp.addModule('attachmentThumbnail');
	const css = {
		thumb: "oe-attachment-thumbnail",
	};
	
	let div,open = false;
		
	/*
	Pretty sure, these won't be dynamically loaded later...
	*/
	let thumbs = uiApp.nodeArray(document.querySelectorAll('.'+css.thumb));
	if(thumbs.length < 1) return; // no elements, bail.
	
	/**
	* Show file attachment
	* @param {JSON object} 
	*/
	const showAttachment = (json) => {
		open = true;
		// create DOM (keep out of reflow)
		div = document.createElement('div');
		div.className = "oe-popup-wrap";
		
		/*
		The popup attachment in it's basic form
		shows the file attachment (PNG or PDF)
		If PDF then the browser will handle it, 
		if PNG provide scale options.
		
		"Annotation" mode (edit) adds Element inputs
		and adjust the layout to fit everything in
		*/
	
		// basic DOM template
		let html = '<div class="oe-popup-attachment">';
		html += '<div class="title">'+json.title+'</div>';
		html += '<div class="close-icon-btn"><i class="oe-i remove-circle pro-theme"></i></div>';
		html += '<div class="file-attachment-content"></div>';
		html += '<div class="file-size-controls"></div>';
		html += '</div>';	
			
		div.innerHTML = html;
		
		
		if(json.stack){
			// create a image "date" stack demo
			let stack = document.createElement('div');
			stack.className = "attachment-stack";
			
			let title = json.title.split(' - ');
			
			let options = "Timeline: <select>";
			options += '<option>'+json.title+'</option>';
			for(let i=json.stack;i;i--){
				options += '<option>' + title[0] + ' - (' + i +' Jan 1975 09:30)</option>';
			}
			options += '</select>';
			
			stack.innerHTML = options;
			
			uiApp.appendTo('.oe-popup-attachment',stack,div);
		}
		
		
		// html += '<div class="attachment-annotation"></div>';
		let attachment = div.querySelector('.file-attachment-content');
		let controls =  div.querySelector('.file-size-controls');
	
		
		// add buttons depending on type
		let buttons = '<button id="oe-att-fit" class="pro-theme selected">Fit to screen</button>';
		buttons += '<button id="oe-att-actual" class="pro-theme">Actual Size</button>';
		
		if(json.type == 'pdf') buttons = '<button class="pro-theme selected">PDF</button>';
				
		// in Annotation mode?
		if(json.annotate){
			attachment.classList.add('annotation');
			
			let notes = document.createElement('div');
			notes.className = "attachment-annotation";
			uiApp.appendTo('.oe-popup-attachment',notes,div);
			
			buttons += '<button class="green hint">Save annotations</button>';
			
			// load in PHP using XHR	
			uiApp.xhr(json.idgPHP,(html) => {
				notes.innerHTML = html;
				// IDG demo eyelat inputs... 
				if(json.eyelat == "L")	notes.querySelector('#annotation-right').style.visibility = "hidden"; // maintain layout?
				if(json.eyelat == "R")	notes.querySelector('#annotation-left').style.visibility = "hidden";
			});
			
		}
		
		/*
		Set up buttons based on state
		*/
		controls.innerHTML = buttons;

		
		if(json.type === "png"){
			// show all (use background)
			attachment.style.backgroundImage = "url('"+json.file+"')";
			// actual size
			attachment.innerHTML = '<img src="'+json.file+'" style="display:none"/>';
		
			// set up functionality 
			let fitBtn =  div.querySelector('#oe-att-fit');
			let actualBtn = div.querySelector('#oe-att-actual');
			let img = div.querySelector('img');
			
			const changeImgState = (bg,display,selectedBtn,resetBtn) => {
				attachment.style.backgroundImage = bg;
				img.style.display = display;
				selectedBtn.classList.add('selected');
				resetBtn.classList.remove('selected');
			};
			
			// change image size buttons
			actualBtn.addEventListener("mousedown",(e) => {
				e.stopPropagation();
				changeImgState("none","block",actualBtn,fitBtn);
			});
			
			fitBtn.addEventListener("mousedown",(e) => {
				e.stopPropagation();
				changeImgState("url('"+json.file+"')","none",fitBtn,actualBtn);
			});
			
		} else {
			// PDF
			attachment.innerHTML = '<embed src="'+json.file+'" width="100%" height="100%"></embed>';
		}
	
		// close icon btn
		let closeBtn = div.querySelector('.close-icon-btn');
		closeBtn.addEventListener("mousedown",() => removeAttachment(), {once:true});
		
		// reflow DOM
		uiApp.appendTo('body',div);
	}; 
	
	/**
	* Remmove popup DOM and reset
	*/
	const removeAttachment = () => {
		uiApp.removeElement(div);
		open = false;
	};
	
	
	/**
	* Callback for Event
	* @param {event} event
	*/
	const userClick = (event) => {
		if(open) return;
		showAttachment(	JSON.parse(event.target.dataset.attachment ));
	};	
	
	// register for Event delegation
	uiApp.registerForClick('.' + css.thumb, userClick);
	
	/*
	If there is an "Annotate" button under the thumbail
	*/
	if(document.querySelectorAll('.js-annotate-attachment')){
		uiApp.registerForClick('.js-annotate-attachment',userClick); 
	}
	
		
})(bluejay); 