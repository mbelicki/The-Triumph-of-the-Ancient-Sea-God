/* Copyright (C) 2012 Mateusz Belicki
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */ 

/**
 * Renderer
 * @constructor
 * @param {?} context
 * @param {string} atlasURI
 * @param {number} manualScale
 */
function Renderer(context, atlasURI, manualScale) {
  this.context  = context;
  
  this.manualScale = typeof manualScale !== 'undefined'
                   ? (manualScale | 0) : 1;

  this.atlasLoaded = false;
  this.atlas = new Image();
  this.atlas.onload = function () { this.atlasLoaded = true; };
  this.atlas.src = atlasURI;
};

/** @return {boolean} */
Renderer.prototype.isReady = function () {
  return !this.atlasLoaded;
};

/** 
 * @param {string} text
 * @param {number} x
 * @param {number} y
 */
Renderer.prototype.drawText = function (text, x, y) {
  var ix = (x | 0) * this.manualScale;
  var iy = (y | 0) * this.manualScale;
  this.context.fillText(text, ix, iy);
}

/**
 * Draw source region from atlas to destination region on the screen (canvas) 
 *
 * @param {number} sX source region x
 * @param {number} sY source region y
 * @param {number} sW source region width
 * @param {number} sH source region height
 * @param {number} dX destination region x
 * @param {number} dY destination region y 
 * @param {number} dW destination region width
 * @param {number} dH destination region height
 */
Renderer.prototype.drawSprite = function (sX, sY, sW, sH, dX, dY, dW, dH) {
  var sx = (sX | 0);
  var sy = (sY | 0);
  var sw = (sW | 0);
  var sh = (sH | 0);

  var dx = (dX | 0) * this.manualScale;
  var dy = (dY | 0) * this.manualScale;
  var dw = (dW | 0) * this.manualScale;
  var dh = (dH | 0) * this.manualScale;
  
  this.context.drawImage(this.atlas, sx, sy, sw, sh, dx, dy, dw, dh);
};

/** 
 * Fill screen (canvas) with source region from atlas 
 *
 * @param {number} sX source region x
 * @param {number} sY source region y
 * @param {number} sW source region width
 * @param {number} sH source region height
 */
Renderer.prototype.fillScreen = function (sX, sY, sW, sH) {
  var sx = (sX | 0);
  var sy = (sY | 0);
  var sw = (sW | 0);
  var sh = (sH | 0);

  this.context.drawImage(this.atlas, sx, sy, sw, sh, 
                         0, 0, SCREEN_WIDTH  * this.manualScale, 
                               SCREEN_HEIGHT * this.manualScale);
};

/**
 * @param {Chunk} chunk
 * @param {Player} player
 * @param {number} horizontalOffset
 * @param {number} verticalOffset
 * @param {number} waterAnimTime
 */
Renderer.prototype.drawChunk = function (chunk, player, 
                                         horizontalOffset, verticalOffset,
                                         waterAnimTime) {
  var playerDrawn = false;
  /** @const */ 
  var refl_anim_frame = ((waterAnimTime * REFL_FRAME_COUNT) | 0);
  var spark_anim_frame = (((1 - waterAnimTime) * 2 * REFL_FRAME_COUNT) | 0);
  /* cell-related local _consts_ */
  var cellWidth  = GRID_SIZE;
  var cellHeight = GRID_SIZE * 3;
  var cellCoords = {
    x: 256,
    y: 112 + (chunk.even ? 0 : 48), 
    w: 16, h: 48
  }
  /* reflection-related local _consts_ */
  var reflectionCoords = {
    x: 480 + (chunk.even ? 0 : 16), 
    y: 48, w: 16, h: 16
  }
  /* other local _consts_ */
  var minHeight = 16
  var pi = Math.round(player.x);
  var pj = Math.round(player.y);

  for (var j = 0; j < CHUNK_HEIGHT; j++) {
    for (var i = 0; i < CHUNK_WIDTH; i++) {

      var refl_x = ((horizontalOffset + i * GRID_SIZE) | 0);
      var refl_y = ((verticalOffset   + j * GRID_SIZE + cellHeight) | 0);
      var refl_coord_y = 16 * ((refl_anim_frame + i) % REFL_FRAME_COUNT);
      var spark_coord_y = 16 * ((spark_anim_frame + i) % REFL_FRAME_COUNT);
      
      var cell = chunk.cells[i][j];
      var k = cell.height;

      var x = ((horizontalOffset + i * GRID_SIZE) | 0); 
      var y = ((verticalOffset + j * GRID_SIZE) | 0);
      var height = Math.max(minHeight, ((cellHeight * k) | 0));
      var offset = cellHeight - height;

      if (k > 0) {
        var refl_height = ((height / 3) | 0);
        var oy = y + offset;
        
        this.drawSprite(cellCoords.x + cell.variant * cellWidth, 
                        cellCoords.y, cellCoords.w, height,
                        x, oy, cellWidth, height);
        
        this.drawSprite(reflectionCoords.x, 
                        reflectionCoords.y + refl_coord_y, 
                        reflectionCoords.w, reflectionCoords.h,
                        refl_x, refl_y, cellWidth, refl_height);
      }
      if (cell.feature == 1) {
        var anim = cell.animationTime;
        var frame = ((anim * 16) | 0);
        var fy = y + Math.max(0, offset);
        this.drawSprite(256 + frame * 16, 256, 16, 32,
                        x, fy - 16, cellWidth, 32);
      }
      else if (cell.feature == 2 && k > 0) {
        this.drawSprite(352, 192, 16, 16,
                        x, y + offset, 16, 16);
      }
      else if (cell.feature == 3 && k > 0) {
        this.drawSprite(352 + 16, 192, 16, 16,
                        x, y + offset, 16, 16);
      }
      /* water sparkles */
      this.drawSprite(480, 112 + spark_coord_y, 16, 16, refl_x, refl_y, 16, 16);
      if (pi == i - 1 && pj == j) {
        var v = verticalOffset - 24;
        this.drawPlayer(player, v + (1 - player.height) * cellHeight);
        playerDrawn = true;
      }
    }
  }
  /* if for some reason this haven't happened before do it now */
  if (player && playerDrawn === false) {
    var v = verticalOffset - 24;
    this.drawPlayer(player, v + (1 - player.height) * cellHeight);
  }
};

/**
 * @param {Player} player
 * @param {number} verticalOffset   
 */
Renderer.prototype.drawPlayer = function (player, verticalOffset) {
  var t = player.animationTimer / player.animationPeriod;
  var frame = ((PLAYER_ANIM_FRAMES_COUNT * t) | 0);

  var x = ((SCREEN_WIDTH / 2) | 0);
  var y = ((player.y * GRID_SIZE + 8 + verticalOffset) | 0);

  var coord_x; /* calculated just before draw call using `frame' */
  var coord_y = 0; 

  /* each of this cases should modify onyl `frame' and `coord_y' */
  if (player.state === 'jumping') {
    coord_y = 64;

    var halfPeriod = player.animationPeriod / 2;
    var initialPhaseEnd = (player.airbornePeriod - halfPeriod);
    var finalPhaseBegining = halfPeriod;
    var halfFrame = (((PLAYER_ANIM_FRAMES_COUNT - 1)/ 2) | 0);

    if (player.airborneTimer > initialPhaseEnd) {
      frame = halfFrame * 
                (1 - (player.airborneTimer - initialPhaseEnd) / halfPeriod);
    } else if (player.airborneTimer < finalPhaseBegining) {
      frame = halfFrame + halfFrame * 
                          (halfPeriod - player.airborneTimer) / halfPeriod;
    } else {
      frame = halfFrame;
    }    
    frame = (frame | 0);
    /* parabolic trajectory, f(x) = -(2x - 1)^2 - 1  */
    var p = (2 * player.airborneTimer / player.airbornePeriod) - 1;
    y += ((p * p) - 1) * 8;
  } else if (player.state === 'drowning') {
    coord_y = 128; 
  } else if (player.state === 'falling') {
    coord_y = 96; 
  } else if (player.state === 'walking') {
    coord_y = 0;
  } else { /* standing or unknown */
    coord_y = 32; 
  }

  coord_x = 352 + 16 * frame;
  this.drawSprite(coord_x, coord_y, 16, 32, x, y, 16, 32);
};

/** @param {number} number     
 *  @param {number} demicalLen amount of digits after demical point
 *  @param {number} color      2 -> blue, 1 -> green, 0 -> orange 
 *  @param {number} x           
 *  @param {number} y           
 */
Renderer.prototype.drawNumber = function (number, demicalLen, color, x, y) {
  var str = Math.round(number) + '';
  var sx = x;
  var DIGIT_SIZE = 9;
  for (var i = 0; i < str.length; i++) {
    this.drawDigit(str[i] * 1, color, sx, y);
    sx += DIGIT_SIZE;  
  }
  return sx + DIGIT_SIZE;
}

/** @param {number} digit
 *  @param {number} color 2 -> blue, 1 -> green, 0 -> orange 
 *  @param {number} x     
 *  @param {number} y     
 */
Renderer.prototype.drawDigit = function (digit, color, x, y) {
  var coord_x = 256 + digit * 16;
  var coord_y = 208 + color * 16;
  this.drawSprite(coord_x, coord_y, 16, 16, x, y, 16, 16);
}
