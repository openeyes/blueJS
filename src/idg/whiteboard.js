(function (uiApp) {

	'use strict';
	
	uiApp.addModule('whiteboard');
	
	// Check for Whiteboard UI
	if(document.querySelector('main.oe-whiteboard') === null) return;
	
	// hide these
	uiApp.hide(document.querySelector('#oe-minimum-width-warning'));
	uiApp.hide(document.querySelector('#oe-admin-notifcation'));
	
	const actionsPanel = document.querySelector('.wb3-actions');
	
	uiApp.registerForClick('#js-wb3-openclose-actions', (ev) => {
		let iconBtn= ev.target;
		if(iconBtn.classList.contains('up')){
			// panel is hidden
			iconBtn.classList.replace('up','close');
			actionsPanel.classList.replace('down','up'); // CSS animation
		} else {
			iconBtn.classList.replace('close','up');
			actionsPanel.classList.replace('up','down'); // CSS animation
		}
	});
	
	// provide a way to click around the whiteboard demos:		
	uiApp.registerForClick('.wb-idg-demo-btn',(ev) => {
		window.location = '/v3-whiteboard/' + ev.target.dataset.url;
	});
	
	
	// dirty demo of editor
/*
	$('.edit-widget-btn').click(function(){
		$('.oe-i',this).toggleClass('pencil tick');
		let wbData = $(this).parent().parent().children('.wb-data');
		wbData.find('ul').toggle();
		wbData.find('.edit-widget').toggle();
		
	});
	
	let $nav = $('.multipage-nav .page-jump');
		let $stack = $('.multipage-stack');
		let numOfImgs = $('.multipage-stack > img').length;
		
	
		Get first IMG height Attribute 
		to work out page scrolling.
		Note: CSS adds 20px padding to the (bottom) of all images !
	
		let pageH = 20 + parseInt( $('.multipage-stack > img:first-child').height() );
		
		function resize() {
		  pageH = 20 + parseInt( $('.multipage-stack > img:first-child').height() );
		}

		window.onresize = resize;
		
		
		Animate the scrolling
		
		let animateScrolling = function( page ){
			var scroll = pageH * page;
			$stack.animate({scrollTop: scroll+'px'},200,'swing');
		}
		
		let scrollPage = function( change ){
			let newPos = $stack.scrollTop() + change;
			$stack.animate({scrollTop: newPos+'px'},200,'swing');
		}

	
		Build Page Nav Btns
		loop through and create page buttons
		e.g. <div class="page-num-btn">1/4</div>
			
		for(var i=0;i<numOfImgs;i++){
			var btn = $( "<div></div>", {
							text: (i+1),
							"class": "page-num-btn",
							"data-page": i,
							click: function( event ) {
								animateScrolling( $(this).data('page') );
							}
						}).appendTo( $nav );
		}
		
		$('#js-scroll-btn-down').click(function(){
			scrollPage( -200 );
		});
		
		$('#js-scroll-btn-up').click(function(){
			scrollPage( 200 );
		});
	
*/
	
})(bluejay); 


