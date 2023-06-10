/*
TODO:

Add global clamping
  If one color is clamped, clamp all others by the same ratio
    Otherwise colors lose their spatial relationship

Find a way to make this JS universal
  If this JS is dropped into an arbitrary web page
  allow it to change the theme by rotating its color vars

*/


const colorDiv = document.getElementsByClassName("colors")[0];

//
// this handles the "click to show UI" functionality
const left = document.getElementsByClassName("left")[0];
const bottom = document.getElementsByClassName("bottom")[0];
left.addEventListener("click", function() {
	bottom.classList.toggle("active");
});



//const global_color_space = "prophoto-rgb"; bunko
const global_color_space = "rgb";

// Get the root element
const r = document.querySelector(':root');

// The full color space in 3d makes a cube.
// When the cube is rotated the corners will exit the valid color space.
// Right now with negative signs stripped components outside the space
// protrude back in the magnitude they would have exited if untouched.

// One wholesome solution is to only allow colors in the sphere - 
// - they can be rotated arbitrarily without exiting the space.

// Magnitude of vectors with 1, 2, and 3 components
// of length 127:

// 127
// 176.776
// 216.5056

// When a vector with a magnitude over 127 is rotated to be
// near paralell to an axis, the component of that axis will be
// maxxed out even before and after the vector is paralell.
// This represents an arc of rotation which has a static color
// component.

// The following vectors have a magnitude of 127:
// [127, 0, 0]
// [89.802561211, 89.802561211, 0]
// [73.323484187, 73.323484187, 73.323484187]

// Another solution is to allow the full cube, but accept that
// only 90 degree rotations keep all colors within the space.


//starting VECTOR reference value for 8 bit rgb

// initial values adjusted for 8-bit [0, 256]
/*
let reference_r_color1 = [-127, 0  , 0  ]
let reference_r_color2 = [0  , -127, 0  ]
let reference_r_color3 = [0  , 0  , -127]
let reference_r_color4 = [73 , 73 , 73 ]
*/

let reference_r_color1 = [-102, 127, -102]
let reference_r_color2 = [65  ,-94, -94]
let reference_r_color3 = [-100  , -33  , 55]
let reference_r_color4 = [85 , 127 , -127]

// not used yet
let starting_colors = [ [-102, 127, -102],
						[65  ,-94, -94],
						[-100  , -33  , 55],
						[85 , 127 , -127]];

/*
// initial values adjusted for percentages [0%, 100%]
const const_r_color1 = [-50, 0  , 0  ]
const const_r_color2 = [0  , -50, 0  ]
const const_r_color3 = [0  , 0  , -50]
const const_r_color4 = [30 , 30 , 30 ]
*/



/////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS TO HANDLE COLOR PICKER UPDATES /////////////////////////////////////

// hex needs to be turned into rgb,
// then unrotated, because CSS var is a rotated version of reference color
// we need to get the unrotated version to change the reference color
// then turn it back into shifted rgb for the cartesian plot
function update_pick(hex_color) {
	let unr = hexToRgb(hex_color).map(x => x - 127);
	unr = rotate3_x(unr, -slider_x.value / slider_rad);
	unr = rotate3_y(unr, -slider_y.value / slider_rad);
	unr = rotate3_z(unr, -slider_z.value / slider_rad);
	//unr = unr.map(x => Math.round(x + 127));
	return unr;

}
const picker1 = document.getElementById("color1");
picker1.addEventListener("input", function() {
	const unr = update_pick(this.value);
	reference_r_color1 = unr;
	slide_update();
});

const picker2 = document.getElementById("color2");
picker2.addEventListener("input", function() {
	const unr = update_pick(this.value);
	reference_r_color2 = unr;
	slide_update();
});

const picker3 = document.getElementById("color3");
picker3.addEventListener("input", function() {
	const unr = update_pick(this.value);
	reference_r_color3 = unr;
	slide_update();
});

const picker4 = document.getElementById("color4");
picker4.addEventListener("input", function() {
	const unr = update_pick(this.value);
	reference_r_color4 = unr;
	slide_update();
});

// FUNCTIONS TO HANDLE COLOR PICKER UPDATES /////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////


// A function for getting a css root variable value
function get_var(name) {
  // Get the styles (properties and values) for the root
  var rs = getComputedStyle(r);
  value = rs.getPropertyValue(name);
  return value;
}

function rgbToHex(r, g, b) {
  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');
  return `#${hexR}${hexG}${hexB}`;
}

function rgbStringToHex(str) {
	const a = str.split(",");
	const arr = [a[0].slice(4),
				 a[1],
				 a[2].slice(0, -1)];
				
	const input = arr.map(x => parseInt(x));
	return rgbToHex(input[0], input[1], input[2]);
}

function hexToRgb(hex) {
  // remove the # symbol if it exists
  hex = hex.replace("#", "");

  // split the hex string into RGB pairs
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // return an array of RGB values
  return [r, g, b];
}

function rgbToStringHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const l = Math.max(r, g, b);
  const s = l - Math.min(r, g, b);
  const h = s
    ? l === r
      ? (g - b) / s
      : l === g
      ? 2 + (b - r) / s
      : 4 + (r - g) / s
    : 0;
  return `hsl(
  ${60 * h < 0 ? 60 * h + 360 : 60 * h},
  ${100 * (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0)}%,
  ${(100 * (2 * l - s)) / 2}%
  )`;
  //return `hsl( ${hue}, ${saturation}%, ${lightness}%)`
}

// A function for setting a css root variable value
function set_var(name, value) {
  // Set the value of variable "name" to "value"
  r.style.setProperty(name, value);
}

// Given "rgb(x, y, z)" return [x, y, z]
function get_rgb(str, color_space="rgb") {

    color = get_var(str);
    
    switch(color_space) {
    
    	case "rgb":
    		cleaned  = color.slice(4, -1);
	    	spaceless = cleaned.replaceAll(' ','');
    
		    split    = spaceless.split(',');
	    	intArr   = []
    	
		    for (i=0; i<3; i++) {
		        valArr.push(parseInt(split[i]));
		    }
		    break;
		    
        case "prophoto-rgb":
        	cleaned  = color.slice(19, -1);
	    	spaceless = cleaned.replaceAll(' ','');
		    split    = spaceless.split('%');
	    	intArr   = []
    	
		    for (i=0; i<3; i++) {
		        valArr.push(parseFloat(split[i]));
		    }
		    break;
    }
    return valArr;
}

// Return "rgb(x, y, z)" Given [x, y, z]
function set_rgb(name, value, color_space="rgb") {
	// r is global variable for CSS root variable space
	switch(color_space) {
		case "rgb":
			// translate back into positive space and return to integer
			value = clamp_rgb(value);
			value = value.map(function(x) {return Math.round(x + 127)});
			
			//
			// update CSS color variable
			
			// use hsl colors for smoother gradients
			//hslString = rgbToStringHsl(value[0], value[1], value[2]);
			//str = hslString
			
			// use rgb colors for code consistency 
			str = 'rgb('.concat(String(value[0]), ',', String(value[1]), ',', String(value[2]), ')');
			
    		r.style.setProperty(name, str);
    		
    		
    		// Update color picker value
    		const id = name.slice(2);
    		document.getElementById(id).value = rgbStringToHex(str);
    		
    		break;
   
   		// likely defunct -- would take some doing to make compat with color picker
   		case "prophoto-rgb":
   			// translate back into positive space
   			value = value.map(function(x) {return x + 127});
   			
   			str = 'color(prophoto-rgb '
   			str = str.concat(String(value[0]), '% ', String(value[1]), '% ', String(value[2]), '%) ');
   			r.style.setProperty(name, str);
   			break;
	}
}

/*

[ a  b  c ] [ x ]   [ ax + by + cz ]
| d  e  f | | y | = | dx + ey + fz |
[ g  h  i ] [ z ]   [ gx + hy + iz ]

*/

function rotate3_x(triple, ang) {
    x = triple[0]
    y = triple[1]
    z = triple[2]
    return [x,
            y*Math.cos(ang) - z*Math.sin(ang),
            y*Math.sin(ang) + z*Math.cos(ang)]
}

function rotate3_y(triple, ang) {
    x = triple[0]
    y = triple[1]
    z = triple[2]
    return [x*Math.cos(ang)   + z*Math.sin(ang),
            y,
            - x*Math.sin(ang) + z*Math.cos(ang)]
}

function rotate3_z(triple, ang) {
    x = triple[0]
    y = triple[1]
    z = triple[2]
    return [x*Math.cos(ang) - y*Math.sin(ang),
            x*Math.sin(ang) + y*Math.cos(ang),
            z]
}

function clamp_rgb(rgb) {
	if (Math.max(...rgb) > 127 || Math.min(...rgb) < -127) {
		// get max error above or below the bounds
		const largest = Math.max(Math.max(...rgb), Math.abs(Math.min(...rgb)));
		const ratio = largest / 127;
		return rgb.map(x => x / ratio);
	}
	else { return rgb; }
}

function rotate_rgb(rgb, ang, axis, css_var, color_space="rgb") {

    rgb = axis(rgb, ang);
    
    switch(color_space) {
    	case "rgb":
    		rgb = rgb.map(Math.round);
    		set_rgb(css_var, rgb.map(function(x) {return x + 127}));
    		break;
    		
    	case "prophoto-rgb":
    		set_rgb(css_var, rgb.map(function(x) {return x + 50}), color_space);
    		break;
    }
    
    return rgb;
}


//mutable values
var r_color1 = reference_r_color1
var r_color2 = reference_r_color2
var r_color3 = reference_r_color3
var r_color4 = reference_r_color4


var rotateLoop_pause = true;

function rotateLoop_control(pause=rotateLoop_pause, func=slider_rotateLoop) {
    if     (pause)  {rotateLoop_pause = false; func()}
    else/*! pause */{rotateLoop_pause = true};
}

var slider_x_inc = 0.1;
var slider_y_inc = 0.1;
var slider_z_inc = 0.1;

// moves sliders automatically
function slider_rotateLoop() {
  var rad = Math.PI / 250;
  setTimeout(function() {
    slider_x.value = (((parseFloat(slider_x.value) + slider_x_inc) % 629) + 629) % 629;
    slider_y.value = (((parseFloat(slider_y.value) + slider_y_inc) % 629) + 629) % 629;
    slider_z.value = (((parseFloat(slider_z.value) + slider_z_inc) % 629) + 629) % 629;
    
    slide_update();
    
    if (! rotateLoop_pause) {
      slider_rotateLoop();
    }                     
  }, 1)
}
slider_rotateLoop()

slider_rad = 100

var slider_x = document.getElementById("slider_x");
var slider_y = document.getElementById("slider_y");
var slider_z = document.getElementById("slider_z");

slider_x.oninput = function() {slide_update()};
slider_y.oninput = function() {slide_update()};
slider_z.oninput = function() {slide_update()};

// prevents automatic sliding when clicked
slider_x.onmousedown = function() {slider_x_inc = 0;}
slider_x.onmouseup   = function() {slider_x_inc = 0.1;}

slider_y.onmousedown = function() {slider_y_inc = 0;}
slider_y.onmouseup   = function() {slider_y_inc = 0.1;}

slider_z.onmousedown = function() {slider_z_inc = 0;}
slider_z.onmouseup   = function() {slider_z_inc = 0.1;}


function slide_update() {

  const color_space = global_color_space;
  
  var r_color1 = reference_r_color1
  r_color1 = rotate3_x(r_color1, slider_x.value / slider_rad);
  r_color1 = rotate3_y(r_color1, slider_y.value / slider_rad);
  r_color1 = rotate3_z(r_color1, slider_z.value / slider_rad);
  set_rgb("--color1", r_color1, color_space);
  
  var r_color2 = reference_r_color2
  r_color2 = rotate3_x(r_color2, slider_x.value / slider_rad);
  r_color2 = rotate3_y(r_color2, slider_y.value / slider_rad);
  r_color2 = rotate3_z(r_color2, slider_z.value / slider_rad);
  set_rgb("--color2", r_color2, color_space);
  
  var r_color3 = reference_r_color3
  r_color3 = rotate3_x(r_color3, slider_x.value / slider_rad);
  r_color3 = rotate3_y(r_color3, slider_y.value / slider_rad);
  r_color3 = rotate3_z(r_color3, slider_z.value / slider_rad);
  set_rgb("--color3", r_color3, color_space);
  
  var r_color4 = reference_r_color4
  r_color4 = rotate3_x(r_color4, slider_x.value / slider_rad);
  r_color4 = rotate3_y(r_color4, slider_y.value / slider_rad);
  r_color4 = rotate3_z(r_color4, slider_z.value / slider_rad);
  set_rgb("--color4", r_color4, color_space);
}


slide_update();
