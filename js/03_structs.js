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
 * @constructor
 * @param {number} height 
 * @param {number} feature : 0 -> no, 1 -> column, 2 -> slow button, 3 -> point button
 */
function Cell(height, feature) {
  /** @this {Cell} */
  
  /** @type {number} */ 
  this.height        = height;
  /** @type {number} */
  this.variant       = 0;
  /** @type {number} */
  this.feature       = feature;
  /** @type {number} */
  this.animationTime = 0;
}

/** 
 * @constructor 
 * @param {function() : Array.<Cell>} chunkBuilder
 * @param {boolean} even 
 */
function Chunk(chunkBuilder, even) {
  /** @this {Chunk} */

  /** @type {Array.<Cell>} */ 
  this.cells         = chunkBuilder();
  /** @type {boolean} */
  this.even          = even;
  /** @type {number} */
  this.floodedAmount = 0;
}

/** @const @type {number} */
Chunk.prototype.START_ANIM_HEIGHT = 0.2;

Chunk.prototype.updateValues = function () {
  var f = this.floodedAmount; 
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    var k = (i - f + 8) / 8;
    k = Math.max(0, Math.min(1, k));
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      if (this.cells[i][j].height > k)
        this.cells[i][j].height = k;
    }
  }
}

/** @param {number} time */
Chunk.prototype.updateAnimations = function (time) {
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      if (this.cells[i][j].height < this.START_ANIM_HEIGHT) {
        this.cells[i][j].animationTime += 0.8 * time;
        if (this.cells[i][j].animationTime > 1) {
          this.cells[i][j].aimationTime = 1;
        }
      }
    }
  }
}

/** @return {Array.<Cell>} */
function startChunkBuilder() {
  var width = 7;
  var height = PATH_WIDTH + (Math.random() > 0.5 ? 2 : 4); 
  return platformChunkBuilder(width, height, false);
}

/** 
 * @param {number} platfWidth
 * @param {number} platfHeight
 * @param {boolean} putColumn
 * @return {Array.<Cell>} 
 */
function platformChunkBuilder(platfWidth, platfHeight, putColumn) {
  var platformWidth  = (platfWidth  | 0);
  var platformHeight = (platfHeight | 0);
  var damagedAmount  = Math.random() * 0.08;
  var chessPattern   = Math.random() > 0.5;
  
  var off_y  = (((CHUNK_HEIGHT - PATH_WIDTH) / 2)     | 0);
  var poff_x = (((CHUNK_WIDTH  - platformWidth) / 2)  | 0);
  var poff_y = (((CHUNK_HEIGHT - platformHeight) / 2) | 0);

  var bonus_i = CHUNK_HALF_WIDTH + ((Math.random() * 3) | 0) - 1;
  var bonus_j = Math.random() > 0.5 ? poff_y + 2 : poff_y + platformHeight - 1;
  var bonus_type = Math.random() > 0.3 ? 2 : 3; 
  if (!putColumn) bonus_type = 0;

  var data = new Array(CHUNK_WIDTH);
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    data[i] = new Array(CHUNK_HEIGHT);
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      var cell = new Cell(0, 0);
      
      if (i <= poff_x || i > poff_x + platformWidth) { 
        if (j == off_y + 1 || j == off_y + PATH_WIDTH) {
          cell.height  = Math.random() < (damagedAmount + 0.08)
                       ? 0 : 1;
          cell.feature = cell.height == 1 && i % 4 == 0
                       ? 1 : 0;
          cell.variant = 1;
        } else if (j > off_y && j < off_y + PATH_WIDTH) {
          cell.height = Math.random() < damagedAmount
                      ? 0 : 1;
          cell.variant = i % 4 == 0 ? 2 : 0;
        }
      } else {
        if (j == poff_y + 1 || j == poff_y + platformHeight) {
          cell.height  = 1;
          cell.feature = (i == poff_x + 1 ||  i == poff_x + platformWidth)
                       ? 1 : 0;
          cell.variant = 1;
        } else if (j > poff_y && j < poff_y + platformHeight) {
          cell.height = 1;
          /* feature: */
          if (    putColumn && i == CHUNK_HALF_WIDTH 
              && (j == CHUNK_HALF_HEIGHT || j == CHUNK_HALF_HEIGHT + 1)) {
            cell.feature = 1;
          }
          /* variant: */
          if (i == poff_x + 1 ||  i == poff_x + platformWidth) {
            cell.variant = 2;
          } else if (chessPattern) {
            cell.variant = ((i + j) % 2) == 0 ? 3 : 0;
          } else {
            cell.variant = 0;
          }
        }
      }

      if (i == bonus_i && j == bonus_j && cell.height != 0) {
        cell.feature = bonus_type;
      }

      data[i][j] = cell;
    }
  }
  return data;
}

/** @return {function() : Array.<Cell>} */
function getRandomStraightChunkBuilder() {
  var r = ((Math.random() * 3) | 0);
  switch (r) {
    case 0:  return straightChunkBuilder;
    case 1:  return leapChunkBuilder;
    default: return columnChunkBuilder;
  }
}

/** @return {Array.<Cell>} */
function columnChunkBuilder() {
  var width  = 7 + (Math.random() > 0.5 ? 0 : 2); 
  var height = PATH_WIDTH + (Math.random() > 0.5 ? 2 : 4); 
  var column = Math.random() > 0.2;
  return platformChunkBuilder(width, height, column);
}

/** @return {Array.<Cell>} */
function straightChunkBuilder() {
  var off_y = (((CHUNK_HEIGHT - PATH_WIDTH) / 2) | 0);
  var damagedAmount = Math.random() * 0.16;

  var bonus_i = CHUNK_HALF_WIDTH + ((Math.random() * 3) | 0) - 1;
  var bonus_j = CHUNK_HALF_HEIGHT + ((Math.random() * 2) | 0);
  var bonus_type = Math.random() > 0.3 ? 2 : 3; 

  var data = new Array(CHUNK_WIDTH);
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    data[i] = new Array(CHUNK_HEIGHT);
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      var cell = new Cell(0, 0);
    
      if (j == off_y + 1 || j == off_y + PATH_WIDTH) {
        cell.height  = Math.random() < (damagedAmount + 0.1)
                     ? 0 : 1;
        cell.feature = cell.height == 1 && i % 4 == 0
                     ? 1 : 0;
        cell.variant = 1;
      } else if (j > off_y && j < off_y + PATH_WIDTH) {
        cell.height = Math.random() < damagedAmount
                    ? 0 : 1;
        cell.variant = i % 4 == 0 ? 2 : 0;
      }

      if (i == bonus_i && j == bonus_j && cell.height != 0) {
        cell.feature = bonus_type;
      }

      data[i][j] = cell;
    }
  }
  return data;
}

/** @return {Array.<Cell>} */
function leapChunkBuilder() {
  var damagedAmount = Math.random() * 0.16;
  var leapWidth = ((4 + Math.random() * 3) | 0);

  var off_x = (((CHUNK_WIDTH  - leapWidth)  / 2) | 0);
  var off_y = (((CHUNK_HEIGHT - PATH_WIDTH) / 2) | 0);

  var data = new Array(CHUNK_WIDTH);
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    data[i] = new Array(CHUNK_HEIGHT);
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      var cell = new Cell(0, 0);
    
      var p = damagedAmount;
      if (i == off_x || i == off_x + leapWidth - 1) p += 0.33;
      else if (i > off_x && i < off_x + leapWidth) p = 1;

      if (j == off_y + 1 || j == off_y + PATH_WIDTH) {
        cell.height  = Math.random() < (p + 0.1)
                     ? 0 : 1;
        cell.feature = cell.height == 1 && i % 4 == 0
                     ? 1 : 0;
        cell.variant = 1;
      } else if (j > off_y && j < off_y + PATH_WIDTH) {
        cell.height = Math.random() < p
                    ? 0 : 1;
        cell.variant = i % 4 == 0 ? 2 : 0;
      }

      data[i][j] = cell;
    }
  }
  return data;
}

/** @return {Array.<Cell>} */
function noiseChunkBuilder() {
  var data = new Array(CHUNK_WIDTH);
  for (var i = 0; i < CHUNK_WIDTH; i++) {
    data[i] = new Array(CHUNK_HEIGHT);
    for (var j = 0; j < CHUNK_HEIGHT; j++) {
      var h = 0;
      /* point noise: */
      if (Math.random() < 0.1) { 
        h = 0;
      } else {
        /* exponential probability of non empty tile (highest in center) */
        var p = 1 - (Math.abs(j - CHUNK_HALF_HEIGHT) / CHUNK_WIDTH);
        p = p * p * p * p * p * p;
        h = Math.random() <= p ? 1 : 0;
      }
      var f = h == 1 && Math.random() > 0.8 ? 1 : 0; /* has feature? (column) */
      data[i][j] = new Cell(h, f);
    }
  }
  return data;
}

/** 
 * @constructor 
 * @param {number} x
 * @param {number} y
 */
function Vector2(x, y) { 
  /** @this {Vector2} */

  /** @type {number} */
  this.x = x;
  /** @type {number} */
  this.y = y;
}

/**
 * @param {Vector2} direction
 * @param {number} amount
 */
Vector2.prototype.append = function (direction, amount) {
  this.x += direction.x * amount;
  this.y += direction.y * amount;
}

/** @return {number} */
Vector2.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
}

Vector2.prototype.zero = function () {
  this.x = 0; 
  this.y = 0;
}

Vector2.prototype.normalize = function () {
  var len = this.length();
  if (len == 0) return;
  this.x /= len; 
  this.y /= len;
}

/** @const @type {Vector2} */
var UP    = new Vector2(0, -1);
/** @const @type {Vector2} */
var DOWN  = new Vector2(0,  1);
/** @const @type {Vector2} */
var LEFT  = new Vector2(-1, 0);
/** @const @type {Vector2} */
var RIGHT = new Vector2( 1, 0);

/** 
 * @constructor 
 */
function Player() {
  /** @this {Player} */
  
  /** @type {number} */
  this.x = ((CHUNK_WIDTH  / 2) | 0);
  /** @type {number} */
  this.y = ((CHUNK_HEIGHT / 2) | 0);
  /** @type {number} */
  this.height = 1;

  /** @type {Vector2} */
  this.velocity = new Vector2(0, 0);
  /** @type {number} */
  this.runningVelocity      =  6.7;
  /** @type {number} */
  this.maxVelocity          =  8.0;
  
  /** @type {number} */
  this.runningAcceleration  = 18.0;
  /** @type {number} */
  this.runningDeceleration  =  3.0;
  /** @type {number} */
  this.standingDeceleration = 29.0;
  
  /** @type {number} */
  this.jumpAcceleration = 1.0;

  /** @type {number} */
  this.animationTimer  = 0.0;
  /** @type {number} */
  this.animationPeriod = 0.5;
  
  /** @type {number} */
  this.airborneTimer  = 0;
  /** @type {number} */
  this.airbornePeriod = 1;
  
  /** @type {Vector2} */
  this.direction = new Vector2(0, 0);
  /** @type {string} */
  this.state = 'standing';

  /** @type {number} */
  this.score = 0;
}

/** @const @type {number} */
Player.prototype.MAX_STEP = 0.15; /* max height difference between 
                                    two blocks that doesn't stop 
                                    player movement */
