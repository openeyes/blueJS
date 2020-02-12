(function (uiApp) {

	'use strict';
	
	uiApp.addModule('problemsPlans');

	/*
	Assumes that the "problems-plans-sortable"	<ul>
	is already in the DOM and not dynamically loaded. 
	Note: in Patient Overview the same list is editable in
	TWO places the popup and in main page area.
	*/

	const pps = uiApp.nodeArray(document.querySelectorAll('.problems-plans-sortable'));
	if(pps.length < 1) return; 
	
	/*
	list state for Problems and Plans Lists
	(this can be JSON'd back to server)
	*/
	const listMap = [];
	/*
	only need to use FIRST list to set up 
	as if more (two) they should be identical!
	*/
	uiApp.nodeArray(pps[0].querySelectorAll('li')).forEach((li)=>{
		listMap.push(	{ 	text:li.textContent,
							info:li.querySelector('.info').getAttribute('data-tooltip-content') });
	});

	/**
	* update list map based on the last drag event
	* @param {String} a - Source textContent
	* @param {String} b - textContent of Element switched with
	*/
	const swapListItems = (a,b) => {
		let indexA = listMap.findIndex( e => e.text.localeCompare(a) === 0 );
		let indexB = listMap.findIndex( e => e.text.localeCompare(b) === 0 );
		listMap[indexA] = listMap.splice(indexB,1,listMap[indexA])[0];
		
		if(pps.length > 1) reorderLists();
	};
	
	
	const reorderLists = () => {
		pps.forEach((list) => {
			let listNodes = list.querySelectorAll('li');
			for(let i=0, len=listMap.length;i<len;i++){
				if(listMap[i].text !== listNodes[i].textContent){
					listNodes[i].innerHTML = domString(listMap[i].text,listMap[i].info);
				}
			}
		});
	};
	
	const domString = (text,info) => {
		return [	'<span class="drag-handle"><i class="oe-i menu medium pro-theme"></i></span>',
					text,
					'<div class="metadata">',
					'<i class="oe-i info small pro-theme js-has-tooltip" data-tooltip-content="',
					info,
					'"></i></div>',
					'<div class="remove"><i class="oe-i remove-circle small pro-theme pad"></i></div>'
					].join('');
	};

	/*
	Drag n Drop List
	*/
	let dragSourceElement = null;
	// add to <ul> on dragstart and restrict drops to this class
	let listDragCSSFlag = "js-sorting-list"; 

	/**
	* handle start of drag
	* @param {Event} 
	*/
	const handleStart = (e) => {
		dragSourceElement = e.target;
		e.target.parentNode.classList.add(listDragCSSFlag);
		/*
		setData using a custom 'type' as only for this app. however, might need 
		to provide a fallback of "text/plain"; Using "text/html" adds a <meta>!?
		*/
		e.dataTransfer.setData('source', dragSourceElement.innerHTML);
	};
	
	/**
	* handle enter of drag 
	* @param {Event} - target Element
	*/
	const handleEnter = (e) => {
		// use browser API effects
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.dropEffect = 'move';
	};
	
	/**
	* handle over of drag 
	* @param {Event} - target Element
	*/
	const handleOver = (e) => {
		// To allow a drop, must prevent default handling  (as most areas don't allow a drop)	
		if(e.preventDefault) e.preventDefault(); // Necessary. Allows Drop (if it's a link or somethink clickable!)
		return false; // good practice
	};
	
	
	const handleDrop = (e) => {
		if(e.stopPropagation) e.stopPropagation(); // stops the browser from redirecting.
		
		/*
		Without this it would be possible to mix up 2 P'n'P list items!
		*/
		if(e.target.parentNode.classList.contains(listDragCSSFlag) === false) return;
		e.target.parentNode.classList.remove(listDragCSSFlag);

		// Make sure we are not dropping it on ourself...
		if (dragSourceElement !=  e.target) {
			// Set the source column's HTML to the HTML of the column we dropped on.
			
			dragSourceElement.innerHTML = e.target.innerHTML;
			e.target.innerHTML = e.dataTransfer.getData('source');
			
			// update listMap
			swapListItems(dragSourceElement.textContent,e.target.textContent);
		}

		return false;
	};
	
	/**
	* handle end of drag 
	* @param {Event} - the same Element that received "dragstart";
	*/
	const handleEnd = (e) => {
	  // this/e.target is the source node.
	  // clean up after dragging about!
	};


	
	/*
	'dragenter' & 'dragover' events are used to indicate valid drop targets.
	As the rest of the App is not a valid place to "drop" list item, 
	EventListeners need to be targeted to specific elements	
	
	Set up each <li> DOM to allow Drag n Drop
	*/
	pps.forEach((list)=>{
		uiApp.nodeArray(list.querySelectorAll('li')).forEach((li)=>{
			li.setAttribute('draggable','true');
			li.addEventListener('dragstart',handleStart, false);
			li.addEventListener('dragenter',handleEnter, false);
			li.addEventListener('dragover',handleOver, false);
			li.addEventListener('drop',handleDrop, false);
			//li.addEventListener('dragend', handleEnd,false);	
		});
	});
	
	
			
})(bluejay); 