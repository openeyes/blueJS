/**
* Restrict Data Height (shown!) 
* Tile Element data (in SEM) and "Past Appointments"
* can be very long lists. There high is restricted by 
* CSS but the data overflow needs visually flagging.
*/
(function () {

	'use strict';

	
/*
	idg.restrictDataHeight = function( wasHiddenElem = false ){
	
	
	if( wasHiddenElem !== false){
		/*
		A restricted height element could be wrapped in hideshow
		wrapper DOM. Therefore when it's open IT calls this function 
		with an Elem and then sets it up. 
		
		console.log( wasHiddenElem)
		setupRestrict( $(wasHiddenElem) );
		return;
	}
	
	
	if( $('.restrict-data-shown').length == 0 ) return;
	/*
	Quick demo of the UI / UX behaviour	

	$('.restrict-data-shown').each(function(){
		setupRestrict( $(this) );
	});
	
	function setupRestrict( $elem ){

		/*
		Restrict data can have several different 
		heights, e.g. 'rows-10','rows-5'	
	
	
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
	
	
})(); 