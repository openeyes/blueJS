(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('sidebarQuicklookView');
	
	/*
	sidebar event list - DOM
	<ul> .events 
	- <li> .event
	-- .tooltip.quicklook (hover info for event type)
	-- <a> (Event data)
	--- .event-type (data attributes all in here for quickView)
	
	Remember!: the event sidebar can be re-oredered and filtered
	*/
	
	/*
	Quicklook (in DOM)
	*/
	
	if( document.querySelector('ul.events') === null ) return;

	let active = null;
	
	const findQuickLook = (eventType) => {
		let li = uiApp.getParent(eventType, 'li');
		return li.querySelector('.quicklook');
	};

	const hideQuickLook = () => {
		if(active != null){
			findQuickLook(active).classList.remove('fade-in');
			active = null;
		}
	};

	const showQuickLook = (newActive) => {
		findQuickLook(newActive).classList.add('fade-in');
		active = newActive;
	};
	
	/*
	QuickView 
	DOM built dymnamically and content is loaded from PHP
	*/

	const _show = () => ({
		/**
		* Callback for 'hover'
		* Enhanced behaviour for mouse/trackpad
		*/
		show:function(target){
			this.open = true;
			const json = JSON.parse(target.dataset.quickview);
			this.icon.className = "oe-i-e large " + json.icon;
			this.titleDate.textContent = json.title + " - " + json.date;
			
			// returns a promise
			uiApp.xhr('/idg-php/v3/_load/sidebar/quick-view/' + json.php)
				.then( html => {
					if(this.open === false) return;
					this.open = true;
					this.content.innerHTML = html;
					this.div.classList.remove('fade-out');
					this.div.classList.add("fade-in");
				})
				.catch(e => console.log('PHP failed to load',e));  // maybe output this to UI at somepoint, but for now...
			
		}	
	});
	
	const _hide = () => ({
		/**
		* Hide content
		*/
		hide:function(){
			this.open = false;
			this.div.classList.add('fade-out');
			this.div.classList.remove("fade-in");
			/*
			Must remove the fade-out class or it will cover
			the Event and prevent interaction!
			*/
			setTimeout(() => this.div.classList.remove('fade-out'), 300); 	// CSS fade-out animation lasts 0.2s
		}
	});
	
	/**
	* quickView singleton 
	* (using IIFE to maintain code pattern)
	*/
	const quickView = (() => {	
		const div = document.createElement('div');
		div.className = "oe-event-quick-view";
		div.id = "js-event-quick-view";
		div.innerHTML = [
			'<div class="event-icon"><i class="oe-i-e large"></i></div>',
			'<div class="title-date">Title - DD Mth YYYY</div>',
			'<div class="audit-trail">Michael Morgan</div>',
			'<div class="quick-view-content"></div>'].join('');
		
		uiApp.appendTo('body',div);
		
		return Object.assign(	{	div: div,
									titleDate: div.querySelector('.title-date'),
									icon: div.querySelector('.event-icon > .oe-i-e'),
									content: div.querySelector('.quick-view-content'),
									open:false,
								},
								_show(),
								_hide() );
	})();
	
	/*
	Events 
	*/
	uiApp.registerForHover('.event .event-type', (ev) => {	showQuickLook(ev.target);
															quickView.show(ev.target);	});	
																				
	uiApp.registerForExit('.event .event-type', (ev) => {	hideQuickLook(); 
															quickView.hide();	});
	
	/*
	No click events?! Why?
	Event sidebar is a list of <a> links, historically (and semantically)
	they  are simply the way to navigate through the Events. Quicklook popup was
	added later as a desktop (hover) enhancement. Then QuickView was added 
	but it should STILL be only a hover enhancement (at least for now on IDG).
	
	If 'click' to lock OR touch support is required this will handle default <a> click:
	document.addEventListener('click',(e) => {
		if(e.target.matches('.event .event-type')){
			e.preventDefault();
			e.stopImmediatePropagation();
			console.log('phew');
		}
	},{capture:true})
	*/

	
})(bluejay); 