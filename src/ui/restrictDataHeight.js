/**
* Restrict Data Height
* Tile Element data (in SEM) and "Past Appointments"
* can be very long lists. There high is restricted by 
* CSS but the data overflow needs visually flagged so 
* as not to be missed.
*/
(function (uiApp) {

	'use strict';
	
	/*
	* setup Restricted Data Visual Flag 
	* once clicked on, or scrolled it's removed.
	* several different CSS heights e.g. 'rows-10','rows-5'
	*/
	const setup = (elem) => {
		console.log(elem);
		
			
		// end of scroll: element.scrollHeight - element.scrollTop === element.clientHeight
	};	
	
	/**
	* Initialise DOM Elements
	* setup wrapped in case it needs calling on a UI update
	*/
	const init = () => {
		let restrictedData = uiApp.nodeArray(document.querySelectorAll('.restrict-data-shown'));
		if(restrictedData.length < 1) return; // no elements!
		
		restrictedData.forEach( (elem) => {
			setup(elem);
		});
	};
	
	// init DOM Elements
	init();

	
/*
	
	function setupRestrict( $elem ){

			
	
	
		let wrapHeight 		= $elem.height();
		let $content 		= $elem.find('.restrict-data-content');
		let scrollH 		= $content.prop('scrollHeight');
		
		
		/*
		if set up, don't do bother again, probably coming in from a
		hide show wrapper.
		
		if( $elem.data('build') ){
			// but fade in the flag UI.. 
			$elem.find('.restrict-data-shown-flag').fadeIn();
		} else {
			if(scrollH > wrapHeight){
				
				// it's scrolling, so flag it
				let flag = $('<div/>',{ class:"restrict-data-shown-flag"});
				$elem.prepend(flag);
				
				flag.click(function(){
					$content.animate({
						scrollTop: $content.height()
					}, 1000);
				});	
	
				$content.on('scroll',function(){
					flag.fadeOut();
				});
				
				$elem.data('build',true);
			}	
		}	
	}
}

*/
	
	
})(bluejay); 