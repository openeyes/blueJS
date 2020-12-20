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
	
	Event sidebar only exists on SEM pages
	*/
	if( document.querySelector('.sidebar-eventlist') === null ) return;

	/*
	There can only be one sidebar 'quicklook' open (tooltip for sidebar element)
	and only one quickview (the big popup that shows more lightning view of Event)	
	*/
	
	/**
	* Quicklook, DOM is hidden.
	*/
	const quicklook = {
		el:null, 
		show( eventType ){
			this.el = eventType.parentNode.previousSibling; // unless DOM structure changes
			this.el.classList.add('fade-in');
		},
		hide(){
			this.el.classList.remove('fade-in');
		}
	};
	

	/**
	* Quick / Lightning View
	* DOM built dymnamically and content is loaded from PHP
	*/
	const lightningView = {
		locked:false,
		div:null,
		xhrToken:null,
		php:null,
		over( json ){
			if( this.locked ) return; // ignore
			this.show( json );
		},
		out(){
			if( this.locked ) return; // ignore
			this.remove();
		},
		click( json ){
			if( json.php == this.php && this.locked ){
				this.locked = false;
				this.div.querySelector('.close-icon-btn').remove();
				return;
			}
			this.locked = true;
			this.show( json );
			
			const closeBtn = bj.div('close-icon-btn');
			closeBtn.innerHTML = '<i class="oe-i remove-circle"></i>';
			this.div.appendChild( closeBtn );
		},
		close(){
			this.remove();
			this.locked = false;	
		},
		show( json ){
			// there is only ever one lightning view at a time
			if( this.div !== null ) this.remove();
			
			const template =  [
				'<div class="event-icon"><i class="oe-i-e large {{icon}}"></i></div>',
				'<div class="lightning-icon"></div>',
				'<div class="title-date">{{title}} - {{humandate}}</div>',
				'<div class="quick-view-content"></div>'
			].join('');
			
			this.div = bj.div('oe-event-quick-view fade-in');
			this.div.innerHTML = Mustache.render( template, json );
			
			/*
			xhr, returns a promise, but check user hasn't moved on to another event icon
			by comparing tokens
			*/
			this.php = json.php;
			this.xhrToken = bj.getToken();
			bj.xhr('/idg-php/v3/_load/sidebar/quick-view/' + json.php, this.xhrToken )
				.then( xreq => {
					if( this.xhrToken != xreq.token ) return;
					this.div.querySelector('.quick-view-content').innerHTML = xreq.html;
				})
				.catch(e => console.log('PHP failed to load',e));
			
			// append div, and wait to load PHP content	
			document.body.appendChild( this.div );
		},
		remove(){
			this.div.classList.add('fade-out'); // CSS fade-out animation lasts 0.2s
			this.div.remove();
			this.div = null;
			this.php = null;
		}
	};
	
	// create a way of reviewing a Quickvew. 
	const testTarget = document.querySelector('.js-idg-sidebar-demo-quickview');
	if( testTarget !== null ){
		lightningView.show( JSON.parse( testTarget.dataset.quickview ));
	}
	
	/*
	Events 
	*/
	bj.userEnter('.event .event-type', (ev) => {	
		quicklook.show( ev.target );
		lightningView.over( JSON.parse( ev.target.dataset.quickview ));	
	});	
																				
	bj.userLeave('.event .event-type', (ev) => {
		quicklook.hide(); 
		lightningView.out();	
	});
	
	bj.userDown('.oe-event-quick-view .close-icon-btn', () => {
		lightningView.close();
	});
	
	/*
	No click events?! Why?
	Event sidebar is a list of <a> links, historically (and semantically)
	they  are simply the way to navigate through the Events. Quicklook popup was
	added later as a desktop (hover) enhancement. Then QuickView was added 
	but it should STILL be only a hover enhancement (at least for now on IDG).
	
	If 'click' to lock OR touch support is required this will handle default <a> click:
	*/
	document.addEventListener('click',( ev ) => {
		if( ev.target.matches('.event .event-type')){
			ev.preventDefault();
			ev.stopImmediatePropagation();
			lightningView.click( JSON.parse( ev.target.dataset.quickview ));
		}
	},{ capture:true });
	

	
})( bluejay ); 