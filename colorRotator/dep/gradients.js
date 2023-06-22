/*
TODO:

Add color addition/deletion class functions

Add autodetection of css color variables

Add special treatment for saturation?
low saturated colors remain low saturated to account for text/background





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
/*
// initial values adjusted for percentages [0%, 100%]
const const_r_color1 = [-50, 0  , 0  ]
const const_r_color2 = [0  , -50, 0  ]
const const_r_color3 = [0  , 0  , -50]
const const_r_color4 = [30 , 30 , 30 ]
*/




//const global_color_space = "prophoto-rgb"; // bunko (doesn't not work well with multiple gradients)
const global_color_space = "rgb";

// Get the root element
const r = document.querySelector(':root');

const color_menu = `<div class="sliders">
                      <input type="range" class="axis_slider" id="slider_x" value="0" min="0" max="629" step="0.001"><br>
                      <input type="range" class="axis_slider" id="slider_y" value="0" min="0" max="629" step="0.001"><br>
                      <input type="range" class="axis_slider" id="slider_z" value="0" min="0" max="629" step="0.001">
                    </div>
                    <div class="buttons">
                      <button type="button"
                        id="auto-rotate"
                        onclick="if you see this an error has occured"
                        >
                      </button>
                    </div>
                    <div class="colors"> </div>`

class ColorRotator {
  constructor(start_colors=getCssColors(), menu_container_div=document.getElementById("colorMenu")) {
    this.baseColors = start_colors; // this is an arr of arrs [[0, 127, 0], [-127, 0, 0], ...]
    
    this.baseColors = getCssStartColors(start_colors);

    this.menuContainer = menu_container_div; // this is a div element
    this.loop_delay = 1; // raise this for better performance, but less smoothness
    this.clamp = 1; // ratio used to reduce colors back into color space while keeping same relative magnitudes
    this.clamp_rule = "global";
    
    this.initColorMenu(); // add color sliders, pickers buttons etc. and their event listeners
    this.initColorPicker(); // add a color picker for each start color and their event listeners
    
    this.slide_update = this.slide_update.bind(this); // keeps 'this' in scope (not sure if necessary)
    this.slider_rotateLoop = this.slider_rotateLoop.bind(this);
    
  }
  
  // add color sliders, pickers buttons etc. and their event listeners
  initColorMenu() {
    const that = this;
    this.menuContainer.innerHTML += color_menu

    this.slider_x = document.getElementById("slider_x");
    this.slider_y = document.getElementById("slider_y");
    this.slider_z = document.getElementById("slider_z");
  
    this.slider_x_inc = 0.1;
    this.slider_y_inc = 0.1;
    this.slider_z_inc = 0.1;

    this.slider_x.oninput = function() {that.slide_update()};
    this.slider_y.oninput = function() {that.slide_update()};
    this.slider_z.oninput = function() {that.slide_update()};

    // prevents automatic sliding when clicked
    this.slider_x.onmousedown = function() {that.slider_x_inc = 0;}
    this.slider_x.onmouseup   = function() {that.slider_x_inc = 0.1;}
    
    this.slider_y.onmousedown = function() {that.slider_y_inc = 0;}
    this.slider_y.onmouseup   = function() {that.slider_y_inc = 0.1;}
    
    this.slider_z.onmousedown = function() {that.slider_z_inc = 0;}
    this.slider_z.onmouseup   = function() {that.slider_z_inc = 0.1;}
                                        
    // moves sliders automatically when false
    document.getElementById("auto-rotate").onclick = function() {that.rotateLoop_control()};
    this.rotateLoop_pause = true;
    this.slider_rad = 100
    this.slider_rotateLoop()
  }
  
  rotateLoop_control(pause=this.rotateLoop_pause, func=this.slider_rotateLoop) {
    if     (pause)  {this.rotateLoop_pause = false; func()}
    else/*! pause */{this.rotateLoop_pause = true};
  }

  slider_rotateLoop() {
    const that = this;
    const rad = Math.PI / 250;

    setTimeout(function() {
      // convoluted formula allows negative values to wrap around modulo correctly i.e. -4 mod 10 = 6
      that.slider_x.value = (((parseFloat(slider_x.value) + that.slider_x_inc) % 629) + 629) % 629;
      that.slider_y.value = (((parseFloat(slider_y.value) + that.slider_y_inc) % 629) + 629) % 629;
      that.slider_z.value = (((parseFloat(slider_z.value) + that.slider_z_inc) % 629) + 629) % 629;
    
      that.slide_update();
      
      if (! that.rotateLoop_pause) {
        that.slider_rotateLoop();
      }                     
    }, 1)
  }
  
  slide_update() {
    const that = this;
    const color_space = global_color_space;
    
    // dict version
    let rotated_colors = {};
    
    // dict version
    for (const key in this.baseColors) {
      let color = this.baseColors[key];
      color = rotate3_x(color, that.slider_x.value / that.slider_rad);
      color = rotate3_y(color, that.slider_y.value / that.slider_rad);
      color = rotate3_z(color, that.slider_z.value / that.slider_rad);
      
      rotated_colors[key] = color;
    }
    
    
    // arrary version
    
    /*
    this.clamp = this.max_clamp(rotated_colors);
    
    for (let i=0; i < rotated_colors.length; i++) {
      if (this.clamp_rule == "global") {
        const clamped = rotated_colors[i].map(x => x / this.clamp);
        this.update_css(`--c${i}`, clamped);
      }
      else if (this.clamp_rule == "individual") {
        let clamped = clamp_rgb(color);
        this.update_css(`--c${i}`, clamped);
      }
      else { // no clamping -- let rgb just take values out of its range
        this.update_css(`--c${i}`, rotated_colors[i]);
      }
    }
    
    */
    
    // dict version
    
    this.clamp = this.max_clamp(rotated_colors);
    
    for (const key in rotated_colors) {
      if (this.clamp_rule == "global") {
        const clamped = rotated_colors[key].map(x => x / this.clamp);
        this.update_css(key, clamped);
      }
      else if (this.clamp_rule == "individual") {
        let clamped = clamp_rgb(color);
        this.update_css(key, clamped);
      }
      else { // no clamping -- let rgb just take values out of its range
        this.update_css(key, rotated_colors[key]);
      }
    }
    
  }
  
  // add a color picker for each start color and their event listeners
  initColorPicker() {
    // for each baseColor, add an HTML color picker and init the value
    let that = this;
    
    // dict version
    for (const key in this.baseColors) {
      this.add_color_picker(key, this.baseColors[key]);
      }
  }
  
  add_color_picker(index, color) {
    const that = this;
    let picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'color_picker';
    
    // dict version
    picker.id = index;
    picker.value = rgbToHex(...color.map(x => x + 127));

    // Add the picker to the DOM
    // TODO - don't grab from global (document) grab from this.menuContainer
    document.getElementsByClassName('colors')[0].appendChild(picker);

    picker.addEventListener('input', function() {
      
          
      // 1. Unrotate to get correct baseColor 
      const unr = update_pick(picker.value, that.slider_rad, that.clamp);
      // unclamp it
      
      that.baseColors[index] = unr;
          
      // 2. Change CSS variable value (update DOM) -- this happens in slide_update()
      //that.update_css(`--c${index}`, color);
      
      that.slide_update();
          
      });
      // End color picker event function
      /////////////////////////////////////////////////
  }
  
  update_css(name, color) {
  
		color = color.map(function(x) {return Math.round(x + 127)});
			 
		const rgb_str = 'rgb('.concat(String(color[0]), ',', String(color[1]), ',', String(color[2]), ')');
				
    r.style.setProperty(name, rgb_str);
        
    // update picker value;
    document.getElementById(name).value = rgbStringToHex(rgb_str);
  }
  
  max_clamp(rgb_arr) {
    let max_clamp = 1;
    
    // dict version
    // TODO - change "rgb_arr" to "rgb_dict"

    for (const key in rgb_arr) {
      const rgb = rgb_arr[key];
      if (Math.max(...rgb) > 127 || Math.min(...rgb) < -127) {
		    // get max error above or below the bounds
		    const largest = Math.max(Math.max(...rgb), Math.abs(Math.min(...rgb)));
		    const ratio = largest / 127;
		    if (ratio > max_clamp) {
		      max_clamp = ratio;
		    }
		  }
    }
    
    
    return max_clamp;
  }
  
}

function getCssColors() {

  const styles = getComputedStyle(document.documentElement);
  const arr = [];
  
  // Loop through computed styles and find CSS variables
  Array.from(styles).forEach(property => {
    if (property.startsWith('--c')) {
      arr.push(property);
    }
  });
  
  return arr;
}

function getCssStartColors(cssVars) {

  const styles = getComputedStyle(document.documentElement);
  const startColors = {};
  
  // Loop through computed styles and find CSS variables
  cssVars.forEach(property => {
    
    const value = styles.getPropertyValue(property);
      
    // hex property
    if (value[0] == "#" && value.length() == 7) {
      let rgb = hexToRgb(value).map(x => x - 127);
      startColors[property] = rgb;
    }
      
    // color property
    else if (value.slice(0, 3) == "rgb") {
      let rgb = rgbStringToArr(value).map(x => x - 127);
      startColors[property] = rgb
    }

  });
  
  return startColors;
}

const starting_colors = [ "--c0",
						              "--c1",
						              "--c2",
						              "--c3",
						              "--c4",
						              "--c5" ];
                                

//const class_test = new ColorRotator(undefined, document.getElementById("bottom"))











// hex needs to be turned into rgb,
// then unrotated, because CSS var is a rotated + clamped version of reference color
// we need to get the unrotated+unclamped version to change the reference color
// then turn it back into shifted rgb for the cartesian plot
function update_pick(hex_color, slider_rad, clamp) {
  
  // turn color picker HEX to RGB, and then shift
  // coords into 'centered' rgb space - where 0,0,0 == rgb(127,127,127)
	let base_color = hexToRgb(hex_color).map(x => x - 127);
	
	// undo the rotation and clamping so that when those
	// effects are re-applied the unr value ends up back at hex_color
	
	// unclamp so that when rer
	base_color = base_color.map(x => x * clamp);
  
  // 'unrotations' must be done in reverse order that slide_update rotates
	base_color = rotate3_z(base_color, -slider_z.value / slider_rad);
	base_color = rotate3_y(base_color, -slider_y.value / slider_rad);
	base_color = rotate3_x(base_color, -slider_x.value / slider_rad);

	
	return base_color;
}


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

function rgbStringToArr(str) {
  const a = str.split(",");
	const arr = [a[0].slice(4),
				 a[1],
				 a[2].slice(0, -1)];
				
	const input = arr.map(x => parseInt(x));
	return input;
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
			//value = clamp_rgb(value);
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
    const x = triple[0]
    const y = triple[1]
    const z = triple[2]
    return [x,
            y*Math.cos(ang) - z*Math.sin(ang),
            y*Math.sin(ang) + z*Math.cos(ang)]
}

function rotate3_y(triple, ang) {
    const x = triple[0]
    const y = triple[1]
    const z = triple[2]
    return [x*Math.cos(ang)   + z*Math.sin(ang),
            y,
            - x*Math.sin(ang) + z*Math.cos(ang)]
}

function rotate3_z(triple, ang) {
    const x = triple[0]
    const y = triple[1]
    const z = triple[2]
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
