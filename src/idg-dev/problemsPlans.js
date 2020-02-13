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
	const updateListOrder = (aStr,bStr) => {
		let a = listMap.findIndex( e => e.text.localeCompare(aStr) === 0 );
		let b = listMap.findIndex( e => e.text.localeCompare(bStr) === 0 );
		listMap[a] = listMap.splice(b,1,listMap[a])[0];
		if(pps.length > 1) reorderLists();
	};
	
	/**
	* loop through and check DOM against listMap 
	*/
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
	
	/**
	* Add new List item to the DOM(s)
	* @param {DocFragment} frag - new <li>
	*/
	const addToDOM = (frag) => {
		pps.forEach((list) => {
			let clone = frag.cloneNode(true);
			list.appendChild(clone);
			makeDraggable(list.lastChild); // now it's inserted in the DOM, set up listeners
		});
	};
	
	/**
	* Build list item domString to insert
	* @param {String} text - <li> text to show
	* @param {String} info - text for the info icon tooltip
	* @returns {String}
	*/
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


	/**
	* Callback for 'click' on <button> next to input field
	* @param {Event} ev
	*/
	const addListItem = (ev) => {
		ev.preventDefault(); // as <button>
		let parent = uiApp.getParent(ev.target,'.create-new-problem-plan');
		let input = parent.querySelector('input');
		if(input.value.length < 2) return; 
		
		let add = {	text:input.value,
					info:"Added now!" };
					
		listMap.push(add); // update listMap
		
		let fragment = new DocumentFragment();
		let li = document.createElement('li');
		li.innerHTML = domString(add.text,add.info);
		fragment.appendChild(li);
		addToDOM(fragment);	// update DOM
	};

	
	/**
	* Callback for 'click' on remove-circle icon
	* @param {Event} ev
	*/
	const removeListItem = (ev) => {
		/*
		Because of the DOM structure for <ul>, simply find 
		the node index and then remove it	
		*/
		let li = uiApp.getParent(ev.target,'li');
		let i = 0;
		while( (li = li.previousSibling) !== null ) i++;
		
		// update DOM
		pps.forEach((list) => {
			uiApp.removeElement(list.childNodes[i]);
		});
		
		// update listMap
		listMap.splice(i,1);
	};


	/* 
	Events
	*/
	uiApp.registerForClick('.create-new-problem-plan button', addListItem);
	uiApp.registerForClick('.problems-plans-sortable .remove-circle', removeListItem);
	
	document.addEventListener('DOMContentLoaded', () => {
		pps.forEach((list)=>{
			uiApp.nodeArray(list.querySelectorAll('li')).forEach((li)=>{
				makeDraggable(li);
			});
		});
	});
	

	/*
	********************************
	Drag n Drop
	*/
	let dragSourceElement = null;
	let listDragCSSFlag = "js-sorting-list";  // add to <ul> on dragstart and restrict drops to this class

	/**
	* handle start of drag
	* @param {Event} 
	*/
	const handleStart = (e) => {
		dragSourceElement = e.target; // remove source target to swap on drop
		e.target.parentNode.classList.add(listDragCSSFlag); // flag used to control 'drop' area
		/*
		setData using a custom 'type' as only for this app. however, might need 
		to provide a fallback of "text/plain"; Using "text/html" adds a <meta>!?
		*/
		e.dataTransfer.setData('source', dragSourceElement.innerHTML);
	};
	
	const handleEnter = (e) => {
		e.dataTransfer.effectAllowed = 'move';	// use browser API effects
		e.dataTransfer.dropEffect = 'move';
	};
	
	const handleOver = (e) => {
		// To allow a drop, you must prevent default handling  (as most areas don't allow a drop)	
		if(e.preventDefault) e.preventDefault(); // Necessary. Allows Drop (if it's a link or somethink clickable!)
		return false; // good practice
	};
	
	/**
	* handle drop
	* @param {Event} 
	*/
	const handleDrop = (e) => {
		if(e.stopPropagation) e.stopPropagation(); // stops the browser from redirecting.
		/*
		Without this it would be possible to mix up 2 P'n'P lists!
		*/
		if(e.target.parentNode.classList.contains(listDragCSSFlag) === false) return;
		e.target.parentNode.classList.remove(listDragCSSFlag);

		// Make sure we are not dropping it on ourself...
		if (dragSourceElement !=  e.target) {
			dragSourceElement.innerHTML = e.target.innerHTML;       // switch them around
			e.target.innerHTML = e.dataTransfer.getData('source');
			
			// update listMap
			updateListOrder(dragSourceElement.textContent,e.target.textContent);
		}
		return false;
	};
	
	/*
	const handleEnd = (e) => {
	  // this/e.target is the source node. clean up after dragging about!
	};
	*/

	const makeDraggable = (li) => {
		/*
		List items are not draggable by default
		*/
		li.setAttribute('draggable','true');
		li.addEventListener('dragstart',handleStart, false);
		/*
		'dragenter' & 'dragover' events are used to indicate valid drop targets.
		As the rest of the App is not a valid place to "drop" list item, 
		EventListeners need to be targeted to specific elements		
		Set up each <li> DOM to allow Drag n Drop
		*/
		li.addEventListener('dragenter',handleEnter, false);
		li.addEventListener('dragover',handleOver, false);
		li.addEventListener('drop',handleDrop, false);
		//li.addEventListener('dragend', handleEnd,false);	
	};
			
})(bluejay); 