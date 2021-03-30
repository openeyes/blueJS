(function( bj ){

	'use strict';
	
	if( document.querySelector('.login.multisite') === null ) return;
	
	/*
	Quick little demo of the Multi-site login	
	*/
	
	let loginStep = 0;
	
	const institution = document.querySelector('.login-institution');
	const site = document.querySelector('.login-site');
	const loginDetails = document.querySelector('.login-details');
	const loginSteps = document.querySelector('.login-steps');
	const stepOptions = document.querySelector('ul.step-options');
	
	bj.hide( loginDetails );
	bj.hide( loginSteps );
	
	const userLogin = bj.div('user');
	userLogin.innerHTML = '<input type="text" placeholder="Username"><input type="password" placeholder="Password"><button class="green hint" id="js-login">Login</button>';
	
	const showLoginStep = ( step, text='' ) => {
		switch( step ){
			case 1:
				document.querySelector('.pre-id').remove();
				bj.show( loginDetails );
				bj.show( loginSteps );
				institution.innerHTML = '<small>Please select an institution</small>';
				site.textContent = '';
				stepOptions.innerHTML = Mustache.render('{{#options}}<li>{{.}}</li>{{/options}}', {
					options: ['Bolton','Cardiff and Vale University','East Kent Hospitals University','Guy\'s and St Thomas\'','Barking, Havering and Redbridge University Hospitals NHS Trust','Barnet, Enfield and Haringey Mental Health NHS Trust','Barnsley Hospital NHS Foundation Trust','Barts Health NHS Trust','Bedford Hospital NHS Trust','BEDFORDSHIRE HOSPITALS NHS FOUNDATION TRUST','Berkshire Healthcare NHS Foundation Trust','Birmingham and Solihull Mental Health NHS Foundation Trust','Birmingham Community Healthcare NHS Foundation Trust','Birmingham Women\'s and Children\'s NHS Foundation Trust','Black Country Healthcare NHS Foundation Trust','Blackpool Teaching Hospitals NHS Foundation Trust','Bolton NHS Foundation Trust','Bradford District NHS Foundation Trust','Bradford Teaching Hospitals NHS Foundation Trust','Bridgewater Community Healthcare NHS Foundation Trust','Brighton and Sussex University Hospitals NHS Trust','Buckinghamshire Healthcare NHS Trust','Burton Hospitals NHS Foundation Trust']	
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
	
	bj.userDown('#js-user-email-id', () => showLoginStep( ++loginStep));
				
})( bluejay ); 