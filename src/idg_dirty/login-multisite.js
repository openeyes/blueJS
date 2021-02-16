(function( bj ){

	'use strict';
	
	if( document.querySelector('.login.multisite') === null ) return;
	
	/*
	Quick little demo of the Multi-site login	
	*/
	
	let loginStep = 1;
	
	const institution = document.querySelector('.login-institution');
	const site = document.querySelector('.login-site');
	const loginSteps = document.querySelector('.login-steps');
	const stepOptions = document.querySelector('ul.step-options');
	
	const userLogin = bj.div('user');
	userLogin.innerHTML = '<input type="text" placeholder="Username"><input type="password" placeholder="Password"><button class="green hint" id="js-login">Login</button>';
	
	const showLoginStep = ( step, text='' ) => {
		switch( step ){
			case 1:
				institution.innerHTML = '<small>Please select an institution</small>';
				site.textContent = '';
				stepOptions.innerHTML = Mustache.render('{{#options}}<li>{{.}}</li>{{/options}}', {
					options: ['Bolton','Cardiff and Vale University','East Kent Hospitals University','Guy\'s and St Thomas\'']	
				});	
			break;
			case 2:
				institution.innerHTML = `${text}<i class="oe-i remove-circle small-icon pad-left"></i>`;
				site.innerHTML = '<small>Please select a site</small>';
				stepOptions.innerHTML = Mustache.render('{{#options}}<li>{{.}}</li>{{/options}}', {
					options: ['Kings site','Queens site','Another site']	
				});	
			break;
			case 3:
				site.innerHTML = `${text}<i class="oe-i remove-circle small-icon pad-left"></i>`;
				loginSteps.parentNode.insertBefore( userLogin, loginSteps.nextSibling);
				loginSteps.remove();	
			break;
		}
	};	
	
	// init
	showLoginStep( loginStep );
	
	// demo click through
	bj.userDown('.step-options li', ( ev ) => {
		const li = ev.target;
		showLoginStep( ++loginStep, li.textContent );
	});
				
})( bluejay ); 