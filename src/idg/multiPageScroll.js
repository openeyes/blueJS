(function (uiApp) {

	'use strict';	
	
	uiApp.addModule('multiPageScroll');
	
	/*
	Mulit Page Scroll Widget. 
	Used in Correspondence VIEW and Lightning Viewer for Letters 
	... and maybe other places too.
	Currently only an IDG thing tho.
	*/
	
	let multiPageScroll = uiApp.nodeArray(document.querySelectorAll('.lightning-multipage-scroll'));
	if( multiPageScroll.length ===  0 ) return;	


	const _animateScrollTo = () => ({
		animateScrollTo:function(pageNum){
			const easeInOutQuad = t => t<0.5 ? 2*t*t : -1+(4-2*t)*t;
			const duration = 80; // num of animation steps
			let step = 1;	
			let time = 0;
			let startPos = this.stack.scrollTop;
			let endPos = (this.pageH * pageNum) - startPos;
			// first clear any running animation
			clearInterval(this.animateID);
			// set up the animation		
			this.animateID = setInterval(() => {
				time = Math.min(1, (step/duration));
				this.stack.scrollTop = Math.ceil((easeInOutQuad(time) * endPos)) + startPos;
				step = step + 1; // increment animation
				if(time == 1) clearInterval(this.animateID); 
			}, 2);
		}
	});
	
	const _pageBtn = () => ({
		pageBtn:function(btn){
			if(btn.matches('.page-num-btn')){
				this.animateScrollTo(parseFloat(btn.dataset.page));
			}
		}
	});

	const PageScroller = (me) => {
		me.numOfImgs = me.stack.querySelectorAll('img').length;
		/*
		Get first IMG height Attribute to work out page scrolling.
		Note: CSS adds 10px padding to the (bottom) of all images !
		*/
		me.pageH = parseFloat(me.stack.querySelector('img').height + 10);
		me.animateID = null;
		/*
		Build Page Nav Page scroll btns
		e.g. <div class="page-num-btn">1/4</div>
		*/	
		let frag = new DocumentFragment();

		for(let i = 0; i < me.numOfImgs; i++){
			let btn = document.createElement('div');
			btn.className = "page-num-btn";
			btn.setAttribute('data-page', i);
			btn.textContent = (i+1) + "/" + me.numOfImgs;
			frag.appendChild(btn);
		}
		
		me.nav.appendChild(frag);
		me.nav.addEventListener('mouseenter', (ev) => me.pageBtn(ev.target), {capture:true});
		me.nav.addEventListener('mousedown', (ev) => me.pageBtn(ev.target), {capture:true});

		return Object.assign(	me,
								_pageBtn(),
								_animateScrollTo() );
	};

	multiPageScroll.forEach((mps) => {
		PageScroller({	nav: mps.querySelector('.multipage-nav'),
						stack: mps.querySelector('.multipage-stack')
		});	
	});
	
	
	
})(bluejay); 