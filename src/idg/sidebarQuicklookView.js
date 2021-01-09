(function( bj ){

	'use strict';	
	
	bj.addModule('sidebarQuicklookView');
	
	/*
	Note: the event sidebar can be re-oredered and filtered
	sidebar event list - DOM
	ul.events -|- li.event -|
							|- .tooltip.quicklook (hover info for event type)
							|- <a> -|- .event-type
									|- .event-extra (for eyelat icons)
									|- .event-date
									|- .tag
	
	DOM data attributes:
	<li> -|- data-id = "0000001" // OE (this repeated on <a> child)
		  |- data-bj = complex JSON (combines all OE seperate data attribures into 1)
	
	Event sidebar only exists on SEM pages...
	*/
	if( document.querySelector('.sidebar-eventlist') === null ) return;

	/*
	There can only be one sidebar 'quicklook' open (tooltip for sidebar element)
	and only one quickview (the big popup that shows more lightning view of Event)	
	*/
	
	/**
	* Quicklook, the little tooltip underneath <li>, in the DOM but hidden.
	*/
	const quicklook = {
		el:null, 
		show( eventType ){
			// !! relies on the current DOM structure
			this.el = eventType.parentNode.previousSibling; 
			this.el.classList.add('fade-in');
		},
		hide(){
			this.el.classList.remove('fade-in');
		}
	};

	/**
	* Quickview, big popup preview.
	* DOM struture is built dymnamically and content is loaded from an IDG PHP
	* This is to demo loading.
	*/
	const quickview = {
		
		id:null,
		div:null,
		locked:false,
		iCloseBtn: 'i-btn-close',
		
		// primary action (for touch)
		click( json ){
			if( json.id == this.id ){
				// Quick view is already open...
				if( this.locked ){
					this.unlock();
				} else {
					this.lock();
				}
			} else {
				// touch device (no "hover")
				this.show( json );	
				this.lock();
			}
		},
		
		// mouse/track pad UX enhancement
		over( json ){
			if( this.locked ) return; // ignore
			this.show( json );
		},
		out(){
			if( this.locked ) return; // ignore
			this.remove();
		},
		
		// click behaviour
		lock(){
			this.locked = true;
			this.div.appendChild( bj.div(`${this.iCloseBtn}`));
		},
		unlock(){
			this.locked = false;
			this.div.querySelector(`.${this.iCloseBtn}`).remove();
		},
		
		// User clicks on the close icon button
		close(){
			this.remove();
			this.locked = false;	
		},
		
		// remove DOM, and reset
		remove(){
			// this.div.classList.add('fade-out'); // CSS fade-out animation lasts 0.2s
			this.div.remove();
			this.div = null;
			this.id = null;
		},
		
		/**
		Show the QuickView content
		There should only be one QuickView open at anytime
		*/
		show( json ){
			if( this.div !== null ) this.remove();
	
			this.id = json.id;
			
			const template =  [
				'<div class="event-icon"><i class="oe-i-e large {{icon}}"></i></div>',
				'<div class="title">{{event}} - {{date}}</div>',
				'<div class="quick-view-content {{type}}"></div>'
			].join('');
			
			this.div = bj.div('oe-event-quickview fade-in');
			this.div.innerHTML = Mustache.render( template, json );
			
			this.load( json.type, json.content );

			// append div, and wait to load PHP content	
			document.body.appendChild( this.div );
		},
		
		/**
		Load the QuickView content
		*/
		load( type, content ){
			const contentDiv = this.div.querySelector('.quick-view-content');
			switch( type ){
				case 'img': 
					contentDiv.innerHTML = `<img src="${content}" />`;
				break;
				case 'pdf': 
					contentDiv.innerHTML = `<embed src="${content}" width="100%" height="100%"></embed>`;
				break;
				case 'php': 
					bj.xhr( content, this.id )
						.then( xreq => {
							// check user hasn't move on whilst we were loading in
							if( this.id != xreq.token ) return; 
							contentDiv.innerHTML = xreq.html;
						})
						.catch(e => console.log('PHP failed to load',e));
				break;
				case "none":
					contentDiv.innerHTML = `<div class="not-available">${content}</div>`;
				break;
				
/*
				case 'v3': 
					this.v3DOM( content ); // to check the old DOM is still supported by the CSS, test on an IMG
				break;
*/
				
				default: bj.log('QuickView Error - load content type unknown:' + type);
			}
		},
		
/*
		v3DOM( src ){
			const oldDOM = [
				'<div class="event-quickview">',
				'<div class="quickview-details">',
				'<div class="event-icon"><i class="oe-i-e large i-CiExamination"></i></div>', 
				'<div class="event-date"></div>', // not used!
				'</div>', // .quickview-details
				'<div class="quickview-screenshots">',
				'<img class="js-quickview-image" src="{{imgSrc}}">',
				'</div>', // .quickview-screenshots
				'</div>', // .event-quickviews	
			].join('');
			this.div.innerHTML = Mustache.render( oldDOM, { imgSrc: src });
		}
*/
	};
	
	/*
	Event delegation
	*/
	bj.userEnter('.event .event-type', (ev) => {	
		quicklook.show( ev.target );
		// quick view JSON is held in <li> parent
		const li = bj.getParent( ev.target, 'li.event' );
		quickview.over( JSON.parse( li.dataset.quick ));	
	});	
																				
	bj.userLeave('.event .event-type', (ev) => {
		quicklook.hide(); 
		quickview.out();	
	});

	bj.userDown(`.oe-event-quickview .${quickview.iCloseBtn}`, () => {
		quickview.close();
	});
	
	/*
	Intercept "click" on <a> if it's on the .event-type area! 	
	*/
	document.addEventListener('click',( ev ) => {
		if( ev.target.matches('.event .event-type')){
			ev.preventDefault();
			ev.stopImmediatePropagation();
			// quick view JSON is held in <li> parent
			const li = bj.getParent( ev.target, 'li.event' );
			quickview.click( JSON.parse( li.dataset.quick ));
		}
	},{ capture:true });
	
	/*
	Notes on "Click": 
	Event sidebar is a list of <a> links, historically (and semantically)
	they were simply the way to navigate through the Events. Then Quicklook popup was
	added, as a desktop (hover) enhancement, and then QuickView was added.
	After these enhancements the DOM should be changed so that <a> doesn't wrap the 
	Quicklook and QuickView DOM and only wraps the link part. This would make it much easier
	on Touch devices, but this is unlikely to be done at the moment.
	*/
	
})( bluejay ); 