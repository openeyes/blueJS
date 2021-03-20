(function( bj ){

	'use strict';	
	
	/*
	Centeralise, in the "pathstep" namespace, a method to get the 
	full text for shortcodes...	
	*/
	bj.namespace('pathstep').fullShortCode = ( shortcode ) => {
		
		let full = shortcode; // e.g "Nurse" doesn't need expanding on
	
		switch( shortcode ){
			case 'Arr': full = "Arrived"; break;
			case 'Fin': full = "Finish"; break;
			case "DNA" : full = "Did Not Attend"; break;
			case "unassigned" : full = "Not assigned"; break;

			case "MM" : full = "Mr Michael Morgan"; break;
			case "GJB" : full = "Dr Georg Joseph Beer "; break;
			case "GP" : full = "Dr George Bartischy"; break;
			case "Su" : full = "Sushruta"; break;
			case "ZF" : full = "Dr Zofia Falkowska"; break; 
			
			case "Img" : full = "Imaging"; break;
			case "VisAcu" : full = "Visual Acuity"; break;
			case "Orth" : full = "Orthoptics"; break;
			case "Fields" : full = "Visual Fields"; break;
			case "Ref" : full = "Refraction"; break;
			
			case "PSD" : full = "Patient Specific Directive"; break;
			case "PGD" : full = "Patient Group Directive"; break;
			
			// icon instead of text
			case "PSD-A-overview":
			case "PSD-A" : full = "Haider Special Mix Set"; break;
			case "PSD-B-overview":
			case "PSD-B" : full = "Pre Op drops"; break;
			case "PSD-C-overview":
			case "PSD-C" : full = "HCA Nightingale (Custom)"; break;
			case "PSD-D" : full = "David Haider (Custom)"; break;
		}
		
		return full; 
	}; 
		
})( bluejay ); 