(function (uiApp) {

	'use strict';
	
	const demo = () => {
		const div = document.createElement('div');
		div.className = "oe-popup-wrap dark";
		document.body.appendChild( div );
		
		const template = [
			'<div class="oe-login timeout">',
			'<div class="login">',
			'<h1>Timed out</h1>',
			'<div class="user">',
			'<input type="text" placeholder="Username">',
			'<input type="password" placeholder="Password">',
			'<button class="green hint" id="js-login">Login</button>',
			'</div>',
			'<div class="info">',
			'For security reasons you have been logged out. Please login again',
			'</div>',
			'</div>',
			'</div>'].join('');
			
		div.innerHTML = Mustache.render( template, {} );
		
	};

	bluejay.demoLoginTimeOut = demo;	
			
})( bluejay ); 