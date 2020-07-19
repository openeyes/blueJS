(function (uiApp) {

	'use strict';
	
	if(document.querySelector('#tinymce-letterheader-editor') === null) return;
	
	let tinyEditor = null;
	
	const inserts = {
		"user_name": {"label":"User Name","value":"<span>Admin Admin</span>"},
		"firm_name": {"label":"Firm Name","value":"<span>Glaucoma Clinic</span>"},
		"site_name": {"label":"Site Name","value":"<span>Kings Hospital</span>"},
		"site_phone": {"label":"Site Phone","value":"<span>0123456789</span>"},
		"site_fax": {"label":"Site Fax","value":null},
		"site_email": {"label":"Site Email","value":null},
		"site_address": {"label":"Site Address","value":"<span>100 Main Road</span>"},
		"site_city":{"label":"Site City", "value":"<span>London</span>"},
		"site_postcode": {"label":"Site Postcode","value":"<span>W1 1AA</span>"},
		"primary_logo": {"label":"Primary Logo","value":'<img src="/idg-php/imgDemo/correspondence/letterhead-logo.png">'},
		"secondary_logo": {"label":"Secondary Logo","value":null},
		"current_date": {"label":"Today's Date","value":"<span>" + document.documentElement.dataset.today + "</span>"}
	};

	const insertData = (key, value) => {
		tinyEditor.insertContent('<span contenteditable="false" data-substitution="' + key + '">' + value + '</span>');
	};
	
	const quickInsertBtns = () => {
		var frag = new DocumentFragment();
		
		// build Buttons
		for (const key in inserts) {
			let label = inserts[key].label;
			let value = inserts[key].value;
			if(value === null) continue; // not much point in adding this as a button!
			
			var btn = document.createElement('button');
			btn.className = "idg-quick-insert";
			btn.textContent = label;
			btn.setAttribute('data-insert', JSON.stringify({key, value}));
			
			// build the Fragment
			frag.appendChild(btn);
		}
		
		document.querySelector('.editor-quick-insert-btns').appendChild(frag);
	};

	/*
	tinyMCE editor - initialise
	*/
	tinymce.init({
		selector: '#tinymce-letterheader-editor',
		schema: 'html5-strict',
		branding: false,
		min_height:400, // can be dragged bigger
		menubar: false,
		plugins: ['lists table paste code'],
		contextmenu: 'table',
		toolbar: "undo redo | bold italic underline | alignleft aligncenter alignright | table | code",
		//body_class: 'tiny_oe_body',	
		custom_undo_redo_levels: 10, // save memory
		//object_resizing : false
		hidden_input: false,
		block_formats: 'Paragraph=p; Header 2=h2; Header 3=h3',
		content_css : '/newblue/css/style_oe3_print.min.css',
		setup: function(editor) {
			editor.on('init', function(e) {
				tinyEditor = editor;
				quickInsertBtns();
			});
		}
	}); 
		
	uiApp.registerForClick('.idg-quick-insert', (ev) => {
		let obj = JSON.parse(ev.target.dataset.insert);
		insertData(obj.key, obj.value);
	});
	
/*
	$('select#substitution-selection').on('change', function () {
                let key = $(this).val();
                if (key !== '' && key !== 'none_selected') {
                    let value = that.getSubstitution(key);
                    editor_ref.insertContent('<span contenteditable="false" data-substitution="' + key + '">' + value + '</span>');
                    console.log(key);
                }

                $(this).val('none_selected');
            });
	
			
			

    $(document).ready(function () {
        let html_editor_controller =
            new OpenEyes.HTMLSettingEditorController(
                "letter_header",
                {"plugins":"lists table paste code pagebreak","branding":false,"visual":false,"min_height":400,"toolbar":"undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | table | subtitle | labelitem | label-r-l | inputcheckbox | pagebreak code","valid_children":"+body[style]","custom_undo_redo_levels":10,"object_resizing":false,"menubar":false,"paste_as_text":true,"table_toolbar":"tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol","browser_spellcheck":true,"extended_valid_elements":"i[*]","valid_elements":"*[*]","pagebreak_separator":"<div class=\"pageBreak\" \/>","content_css":"\/assets\/ca6609ee\/css\/style_oe3_print.min.css"},
                }            );
    });
*/
			
			
})(bluejay); 