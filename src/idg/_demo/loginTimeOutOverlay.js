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
			'<div class="login-details">',
			'<ul class="row-list">',
			'<li class="login-institution">Cardiff and Vale University</li>',
			'<li class="login-site">Queens site</li>',
			'</ul>',
		    '</div>',
			'<div class="user">',
			'<input type="text" placeholder="Username">',
			'<input type="password" placeholder="Password">',
			'<button class="green hint" id="js-login">Login</button>',
			'</div>',
			'<div class="info">',
			'You have been logged out for security reasons. Please login to continue',
			'</div>',
			'<div class="flex-c"><a href="/v3/login-multisite" class="button">Or exit to homepage</a></div>',
			'</div>',
			'</div>'].join('');
			
		div.innerHTML = Mustache.render( template, {} );
		
	};

	bluejay.demoLoginTimeOut = demo;	
			
})( bluejay ); 