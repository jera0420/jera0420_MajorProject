// Global variables group project
let mainRadius = 120; // Radius of the main circle
let spacingX = mainRadius * 2 + 10; // Ensure circles are at least 10px apart horizontally
let spacingY = mainRadius * 2 + 10; // Ensure circles are spaced vertically based on their size + extra space
let startX = 100; // Starting x position cutting the first circlePattern, which makes it harder to notice the diagonal column design
let startY = 100; // Starting y position to accommodate multiple rows on a 14 inches screen
let yStep = -20; // Prevents patterns from being built in a straight line vertically
let xStep = 50; // Prevents patterns from being built in a straight line horizontally

// Global variables individual project
let circlePatternArray = []; // Hold the CirclePattern objects
let song; // Hold the audio file
let fft; // Hold the FFT object
let smoothing = 0.8; // Variable for the smoothing of the FFT (between 0 and 1)
let button; // I need a button variable so I can access it in the windowResized function


// Load sound file before the setup() function runs
function preload() {
  // Audio file from Wiki Creative Commons: https://commons.wikimedia.org/wiki/File:Vivaldi_-_Four_Seasons_4_Winter_mvt_1_Allegro_non_molto_-_John_Harrison_violin.oga
  song = loadSound('assets/Vivaldi_-_Four_Seasons_4_Winter_mvt_1_Allegro_non_molto_-_John_Harrison_violin.oga');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB); // Set colour mode to HSB

  // Calculate the number of columns and rows that can fit on the screen
  // Small change from the group project as the previous setup was overloading the system when playing my animation
  let numCols = ceil((windowWidth - startX) / spacingX) + 1; 
  let numRows = ceil((windowHeight - startY) / spacingY) + 1;
  let numCircles = numCols * numRows;

  // Ensure numBins is a power of 2 (FFT rule) and greater than or equal to numCircles. Used ChatGPT for this part, see README
  let numBins = 16; // Start with the smallest power of 2 allowed for FFT
  while (numBins < numCircles && numBins < 1024) { 
    numBins *= 2; 
  }
  
  // Loop to draw the patterns at different x and y positions
  for (let i = 0; i < numCircles; i++) {
    // Calculate the row and column positions
    let row = floor(i / numCols);
    let col = i % numCols;
    // Adjust x position for each row, adding spacing between the patterns
    let x = startX + col * spacingX - row * xStep;
    // Adjust y position based on the row, adding vertical space
    let y = startY + row * spacingY + col * yStep;

    // Random HSB colour for the dotted circle
    // It makes sure the colours generated are within my chosen palette
    let hue = random(90, 270); 
    let saturation = random(50, 100);
    let brightness = random(80, 100);

    // Only 1 out of 9 circles will have the zigzag pattern
    let isZigzag = (i % 9 === 0);

    // Create the new CirclePattern
    let pattern = new CirclePattern(x, y, mainRadius, hue, saturation, brightness, isZigzag);
    // Use the push() function to add the new CirclePattern to the array
    circlePatternArray.push(pattern);
  }

  // Create a new instance of p5.FFT() object
  fft = new p5.FFT(smoothing, numBins);

  song.connect(fft);
  
  // Add a button for play/pause
  button = createButton("Play/Pause");
  button.position((width - button.width) / 2, height - button.height - 2);
  button.mousePressed(play_pause); // Event is triggered when the mouse is pressed
}

function draw() {
  background(0, 0, 0);

  // Analyze the sound and get the spectrum
  let spectrum = fft.analyze();

  // Loop to draw the patterns at different x and y positions
  for (let i = 0; i < circlePatternArray.length; i++) {
    let pattern = circlePatternArray[i]; // Each time one of the array items is drawn
    if (song.isPlaying()) {
      pattern.updateRadius(spectrum[i]); // Change the radius size of the inner circle based on energy level
      pattern.updateColor(spectrum[i]); // Change color of the outer circle dots based on the energy level
    }
    pattern.draw(); 
  }
}

class CirclePattern {
  constructor(x, y, mainRadius, hue, saturation, brightness, isZigzag) {
    this.x = x; // x position of the pattern centre
    this.y = y; // y position of the pattern centre
    this.mainRadius = mainRadius; // Radius of the circle
    this.startingHue = hue; // Pre-generated starting hue for all dots in the outer circle
    this.hue = hue; // Current hue for dots in the outer circle
    this.saturation = saturation; // Pre-generated saturation for all dots
    this.brightness = brightness; // Pre-generated brightness for all dots
    this.isZigzag = isZigzag; // Boolean to decide whether to draw zigzag or dots
    this.smallRadius = 15; //Radius of the smallest circle in the middle of the pattern

    // Predefined colour array for the inner circle based on this palette: 
    // https://coolors.co/palette/f72585-b5179e-7209b7-560bad-480ca8-3a0ca3-3f37c9-4361ee-4895ef-4cc9f0
    let predefinedColors = [
      color(0, 0, 0), // Black
      color(309, 87, 71), // Dark Pink
      color(276, 95, 72), // Light Purple
      color(268, 94, 68), // Medium Purple
      color(263, 93, 66), // Blueish Purple
      color(243, 73, 79) // Medium Blue
    ];

    // Randomly select three colours from predefined colours with shuffle
    // While making sure the same colour is not selected again, removing them from the list with slice
    this.innerColors = shuffle(predefinedColors).slice(0, 3);
  }

  // Map the colour from the energy level, with 5 arguments: 
  //   1. Value to be remapped
  //   2. Minimum value of the input range (in this case 0)
  //   3. Maximum value of the input range (in this case 255)
  //   4. Minimum value of the output range
  //   5. Maximum value of the output range
  updateColor(energy) {
    // Input and output numbers were chosen by experimentation to stay within the desired palette 
    this.hue = this.startingHue + map (energy, 100, 200, 50, 130); 
  }

  // Map the size from the energy level, with 5 argument:
  //   1. Value to be remapped
  //   2. Minimum value of the input range (in this case 0)
  //   3. Maximum value of the input range (in this case 255)
  //   4. Minimum value of the output range
  //   5. Maximum value of the output range
  updateRadius(energy) {
    this.smallRadius = map(energy, 0, 255, 10, 65);
  }

  // Primary design for the outer circle - dots
  drawDotsInCircle() {
    let numRings = 15; // Number of concentric rings of dots
    let dotSize = 5; // Size of dots

    // Draw concentric rings of dots
    for (let ring = 1; ring < numRings; ring++) {
      let radius = ring * this.mainRadius / numRings; // Selecting the radius of each ring
      let numDots = floor(TWO_PI * radius / (dotSize * 1.2)); // Number of dots for the ring with some spacing

      for (let i = 0; i < numDots; i++) {
        let angle = i * TWO_PI / numDots;
        let dotX = this.x + radius * cos(angle); // X position for the dot
        let dotY = this.y + radius * sin(angle); // Y position for the dot

        noStroke();
        fill(this.hue, this.saturation, this.brightness); // Colour ramdonly generated
        circle(dotX, dotY, dotSize);
      }
    }
  }

  // Secondary design for the outer circle - zigzag line
  drawZigzagPattern() {
    let outerRadius = this.mainRadius * 0.9; // Outer radius of zigzag, so that it doesn't go past the rim of the base circle
    let innerRadius = outerRadius * 2 / 3; // Inner rim at 2/3 of the outer radius

    // Draw the base circle under the zigzag
    fill(258, 93, 64); // Dark Blue from the selected palette
    noStroke();
    circle(this.x, this.y, this.mainRadius * 2);

    // Draw the zigzag line
    stroke(212, 70, 94); // Medium Blue
    strokeWeight(3);

    let angle = 0; // Initial angle
    let angleStep = radians(3); // Angle step of 3 degrees in radians
    let numZigzags = 120; // Number of zigzag segments, discovered with experimentation

    // Begin and end shape are necessary for vertexes as they are custom shapes
    beginShape();

    for (let i = 0; i < numZigzags; i++) {
      // Line that starts from inner rim to outer rim at an angle
      let innerX = this.x + innerRadius * cos(angle); // X position on the inner rim
      let innerY = this.y + innerRadius * sin(angle); // Y position on the inner rim
      vertex(innerX, innerY); // Connects the line to the inner rim

      // Update angle for the next step
      angle += angleStep;

      // Line that starts from outer rim back to inner rim at an angle
      let outerX = this.x + outerRadius * cos(angle); // X position on the outer rim
      let outerY = this.y + outerRadius * sin(angle); // Y position on the outer rim
      vertex(outerX, outerY); // Connects the line to the outer rim

      // Update angle for the next iteration
      angle += angleStep;
    }

    endShape();
  }

  // Design for the inner circle of circles
  drawInnerCircles() {
    let numCircles = 9; // Number of circles around the inner circle

    // Draw the smallest bright blue circle at the centre
    fill(194, 68, 94); // Bright blue
    noStroke();
    circle(this.x, this.y, this.smallRadius * 2);

    // Draw 9 circles with increasing radius, same centre
    strokeWeight(6);
    noFill(); // No fill for the circles around the smallest inner circle

    // Alternate between the three chosen colours, out of the six predefined colours
    for (let i = 0; i < numCircles; i++) {
      let currentRadius = this.smallRadius + i * 5; // Increase radius for each circle
      stroke(this.innerColors[i % 3]);  // Alternate between the three chosen colours, used ChatGPT, see appendix.
      circle(this.x, this.y, currentRadius * 2);  // Draw each circle
    }
  }

  draw() {
    if (this.isZigzag) {
      this.drawZigzagPattern(); // Draw the zigzag pattern for the outer circle if it is the 9th CirclePattern
    } else {
      this.drawDotsInCircle(); // Else, draw circle with dots, which is the primary design for the outer circle
    }
    this.drawInnerCircles(); // Draw the inner concentric circles with predefined colours
  }

}

// When the button is pressed, switch between play or pause
function play_pause() {
  if (song.isPlaying()) {
    song.stop();
  } else {
    song.loop();
  }
}

// This function ensures the canvas fills the entire window
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  button.position((width - button.width) / 2, height - button.height - 2);
}
