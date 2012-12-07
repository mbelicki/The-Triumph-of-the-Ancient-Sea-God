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
 * @param {function()} init
 * @param {function(Renderer)} draw
 * @param {function(number)} update
 * @param {function(Array.<boolean>, number)} process
 */
function StateBehavior(init, draw, update, process) {
  /** @this {StateBehavior} */

  /** @type {function()} */
  this.init    = init;
  /** @type {function(Renderer)} */
  this.draw    = draw;
  /** @type {function(number)} */
  this.update  = update;
  /** @type {function(Array.<boolean>, number)} */
  this.process = process;
};

/**
 * @param {?} previous
 * @param {StateBehavior} behavior
 */
function changeState(previous, behavior) {
  var state = {
    persistentData: previous.persistentData,
    init:           behavior.init,
    draw:           behavior.draw,
    update:         behavior.update,
    process:        behavior.process
  }
  state.init();
  return state;
}

/** 
 * @param {Date} then
 * @param {?} currentState
 * @param {Renderer} renderer
 * @param {Array.<boolean>} keys
 */
function step(then, currentState, renderer, keys) {
  /** @const */
  var now  = Date.now();
  /** @const @type {number} */
  var time = (now - then) / 1000;

  /* skip frame if it can't be drawn yet */
  if (!renderer.isReady) return now; 
  
  currentState.update(time);
  currentState.process(keys, time);
  currentState.draw(renderer);

  return now;
}

/* TODO: consider spliting game state behaviors into separate files */

/* running state */
/** @const */ var RUNNING_BEHAVIOR = (function () {
  
  var swapChunks = function (data) {
    var builder = getRandomStraightChunkBuilder();

    data.previousChunk = data.currentChunk;
    data.currentChunk  = data.nextChunk;
    data.nextChunk = new Chunk(builder, data.previousChunk.even);
    
    data.player.x -= CHUNK_WIDTH;
    data.player.score
      += PLAYER_SCORE_STEP_MULTI * Math.round(data.waveVelocity);
    data.waveVelocity += FLOODING_SPEED_STEP;
  }
  
  var init = function () { };

  var draw = function(renderer) {
    var p = this.persistentData;

    renderer.fillScreen(0, 0, 256, 256);
    /* chunks: */
    var waterAnim = p.waterTime / p.WATER_PERIOD;
    var ho = -(p.player.x - CHUNK_HALF_WIDTH - 2) * GRID_SIZE;
    var vo = TOP_OFFSET;
    var chunkSize = CHUNK_WIDTH * GRID_SIZE;
    renderer.drawChunk(p.previousChunk, false,  ho - chunkSize, vo, waterAnim);
    renderer.drawChunk(p.nextChunk,     false,  ho + chunkSize, vo, waterAnim);
    renderer.drawChunk(p.currentChunk,  p.player, ho, vo, waterAnim);
    /* score: */
    renderer.drawSprite(446, 240, 34, 16,
                         16,  16, 34, 16);
    renderer.drawNumber(p.player.score, 0, 2, 50, 16);
    /* player speed: */
    renderer.drawSprite(416, 224, 64, 16, 
                         16, SCREEN_HEIGHT - 48, 64, 16);
    renderer.drawNumber(p.player.velocity.length(), 0, 1, 
                         80, SCREEN_HEIGHT - 48);
    /* wave speed: */
    renderer.drawSprite(416, 208, 64, 16, 
                         16, SCREEN_HEIGHT - 32, 64, 16);
    renderer.drawNumber(p.waveVelocity, 0, 0, 
                         80, SCREEN_HEIGHT - 32);
  };

  function safelyFetchHeight(i, j, currentChunk, nextChunk) {
    if (j < 0 || j >= CHUNK_HEIGHT) return 0;
    if (i < 0) return 2;
    
    var cell = i >= CHUNK_WIDTH
             ? nextChunk.cells[i - CHUNK_WIDTH][j]
             : currentChunk.cells[i][j];
    return cell.feature == 1 ? cell.height + 1 : cell.height; 
  }

  /* TODO: this method should be refactored asap */
  var update = function(time) {

    var p = this.persistentData;

    if (p.player.state === 'drowning') {
      this.requestedChange = OVER_BEHAVIOR;
    }

    if (p.player.state !== 'jumping') {
      var d = p.player.state === 'standing' || p.player.state === 'drowning' 
            ? p.player.standingDeceleration
            : p.player.runningDeceleration; 

      if (p.player.velocity.x > 0) {
        p.player.velocity.x -= d * time;
        if (p.player.velocity.x < 0) p.player.velocity.x = 0;
      } else if (p.player.velocity.x < 0) {
        p.player.velocity.x += d * time;
        if (p.player.velocity.x > 0) p.player.velocity.x = 0;
      }

      if (p.player.velocity.y > 0) {
        p.player.velocity.y -= d * time;
        if (p.player.velocity.y < 0) p.player.velocity.y = 0;
      } else if (p.player.velocity.y < 0) {
        p.player.velocity.y += d * time;
        if (p.player.velocity.y > 0) p.player.velocity.y = 0;
      }
    }

    var updated_x = p.player.x + p.player.velocity.x * time;
    var updated_y = p.player.y + p.player.velocity.y * time;

    var i = Math.round(p.player.x);
    var j = Math.round(p.player.y);
    
    var ui = Math.round(updated_x);
    var uj = Math.round(updated_y);
    
    var new_h = safelyFetchHeight(ui, uj, p.currentChunk, p.nextChunk);

    if (new_h <= p.player.height + p.player.MAX_STEP) {
      p.player.x = updated_x;
      p.player.y = updated_y;
      i = Math.round(p.player.x);
      j = Math.round(p.player.y);
    } else {
      p.player.velocity.x *= -1;
      p.player.velocity.y *= -1;
    }

    if (i >= CHUNK_WIDTH ) { 
      swapChunks(p);
    }

    /* TODO: there surely is a way to do this in a simpler way... :( */
    if (p.player.state !== 'jumping' && p.player.state !== 'falling') {
      if (i >= 0 && j >= 0 && i < CHUNK_WIDTH && j < CHUNK_HEIGHT) {
        var cell = p.currentChunk.cells[i][j];
        if (cell.feature === 2) {
          p.waveVelocity -= BUTTON_FLOODING_SPEED_DOWN;
          if (p.waveVelocity < 0.5) p.waveVelocity = 0.5;

          p.player.score -= BUTTON_SCORE_DOWN;
          if (p.player.score < 0) p.player.score = 0;
          
          cell.feature = 0;
        } else if (cell.feature === 3) {
          p.waveVelocity += BUTTON_FLOODING_SPEED_UP;
          p.player.score += BUTTON_SCORE_UP;
          cell.feature = 0;
        }
      }
    }

    if (p.player.state !== 'jumping') {
      var h = safelyFetchHeight(i, j, p.currentChunk, p.nextChunk);

      if (p.player.height <= 0.2) {
        p.player.state = 'drowning';
      } else if (h == 0) { 
        p.player.height -= time;
        p.player.state = 'falling';
      } else {
        p.player.height = h;
        p.player.state = 'standing';
      }
    }

    if (p.previousChunk.floodedAmount < 32) {
      p.previousChunk.floodedAmount
         += PASSED_CHUNK_FLOODING_SPEED * time;
      p.previousChunk.updateValues();
    }
    
    var v = p.player.state === 'drowning'
          ? PASSED_CHUNK_FLOODING_SPEED * 4
          : p.waveVelocity; 
    if (p.currentChunk.floodedAmount < 32) {
      p.currentChunk.floodedAmount += v * time;
      p.currentChunk.updateValues();
    } 
    if (   p.currentChunk.floodedAmount > CHUNK_WIDTH 
        && p.nextChunk.floodedAmount < 32) {
      p.nextChunk.floodedAmount += v * time;
      p.nextChunk.updateValues();
    }
    
    p.previousChunk.updateAnimations(time);
    p.currentChunk.updateAnimations(time);
    p.nextChunk.updateAnimations(time);
    
    p.player.animationTimer += time;
    if (p.player.animationTimer > p.player.animationPeriod)
      p.player.animationTimer = 0;

    p.waterTime += time;
    if (p.waterTime > p.WATER_PERIOD)
      p.waterTime = 0;
      
  };

  var process = function(keys, time) {
    var player = this.persistentData.player;

    if (player.state === 'drowning') return;

    if (player.airborneTimer > 0) { /* player is jumping */
      player.state = 'jumping';
      player.airborneTimer -= time;
    } else {
      var walking = false;
      player.direction.zero();
      
      if (38 in keys) { /* up */
        player.direction.append(UP, 1);
        walking = true;
      }
      if (40 in keys) { /* down */
        player.direction.append(DOWN, 1);
        walking = true;
      }
      if (37 in keys) { /* left */
        player.direction.append(LEFT, 1);
        walking = true;
      }
      if (39 in keys) { /* right */
        player.direction.append(RIGHT, 1);
        walking = true;
      }
      if (32 in keys) { /* space */
        /* TODO: this should be moved to player class? */
        if (player.state === 'walking' || player.state === 'standing') {
          player.state = 'jumping';
          player.airborneTimer = player.airbornePeriod;
          if (player.velocity.length() < player.maxVelocity) {
            player.velocity.append(player.direction, player.jumpAcceleration);
          } 
        }
      }
      
      if (walking) {
        player.direction.normalize();
        player.state = 'walking';
        if (player.velocity.length() < player.runningVelocity - 0.05) {
          player.velocity.append(player.direction, player.runningAcceleration * time);
        }
        if (player.velocity.length() > player.runningVelocity) {
          player.velocity.normalize();
          player.velocity.x *= player.runningVelocity;
          player.velocity.y *= player.runningVelocity;
        }
      } else {
        if (player.state !== 'falling')
          player.state = 'standing';
      }
    }

  };

  return new StateBehavior(init, draw, update, process);
}());

/* game over state */
/** @const */ var OVER_BEHAVIOR = (function () {

  var init = function () {};

  var draw = function(renderer) {
    var p = this.persistentData;

    renderer.fillScreen(0, 0, 256, 256);

    var waterAnim = p.waterTime / p.WATER_PERIOD;
    var ho = -(p.player.x - CHUNK_HALF_HEIGHT - 2) * GRID_SIZE;
    var vo = TOP_OFFSET;
    var chunkSize = CHUNK_WIDTH * GRID_SIZE;
    renderer.drawChunk(p.previousChunk, false,  ho - chunkSize, vo, waterAnim);
    renderer.drawChunk(p.nextChunk,     false,  ho + chunkSize, vo, waterAnim);
    renderer.drawChunk(p.currentChunk,  p.player, ho, vo, waterAnim);

    if (p.highscore >= p.player.score) {
      /* score: */
      var x = SCREEN_WIDTH / 2 - 34;
      var y = SCREEN_HEIGHT / 2 - 8;
      renderer.drawSprite(446, 240, 34, 16, x, y, 34, 16);
      renderer.drawNumber(p.player.score, 0, 2, x + 34, y);

      if (p.highscore > 0) {
        x = (SCREEN_WIDTH  - 57) / 2;
        y = (SCREEN_HEIGHT - 16) / 2 + 16;
        renderer.drawSprite(439, 192, 57, 16, x, y, 57, 16);
        var score = p.highscore;
        /* I... I really don't know how THIS could have happened: */
        /* sorry :( */
        x = (SCREEN_WIDTH - ((score + '').length * 9) - 8) / 2;
        y += 16;
        renderer.drawNumber(score, 0, 2, x, y);
      }
    } else {
      x = (SCREEN_WIDTH  - 80) / 2;
      y = (SCREEN_HEIGHT - 16) / 2 + 16;
      renderer.drawSprite(416, 192, 80, 16, x, y, 80, 16);
      var score = p.player.score;
      /* I... I really don't know how THIS could have happened: */
      /* sorry :( */
      x = (SCREEN_WIDTH - ((score + '').length * 9) - 8) / 2;
      y += 16;
      renderer.drawNumber(score, 0, 0, x, y);
    }

    /* info: */
    x = (SCREEN_WIDTH - 96) / 2;
    y = SCREEN_HEIGHT - 64;
    renderer.drawSprite(256, 64, 96, 32, x, y, 96, 32);
  };

  var update  = function(time) {
    var p = this.persistentData;

    p.player.animationTimer += time;
    if (p.player.animationTimer > p.player.animationPeriod)
      p.player.animationTimer -= p.player.animationPeriod;

    p.waterTime += time;
    if (p.waterTime > p.WATER_PERIOD)
      p.waterTime -= p.WATER_PERIOD;

    var v = PASSED_CHUNK_FLOODING_SPEED * 4;
    if (p.previousChunk.floodedAmount < 32) {
      p.previousChunk.floodedAmount += v * time;
      p.previousChunk.updateValues();
    }
    if (p.currentChunk.floodedAmount < 32) {
      p.currentChunk.floodedAmount += v * time;
      p.currentChunk.updateValues();
    } 
    if (   p.currentChunk.floodedAmount > CHUNK_WIDTH 
        && p.nextChunk.floodedAmount < 32) {
      p.nextChunk.floodedAmount += v * time;
      p.nextChunk.updateValues();
    }

    p.previousChunk.updateAnimations(time);
    p.currentChunk.updateAnimations(time);
    p.nextChunk.updateAnimations(time);
  };

  var process = function(keys) {
    if (32 in keys) { /* space */
      if (this.persistentData.highscore < this.persistentData.player.score)
        saveScore(this.persistentData.player.score)
      var newData = getInitialData();
      this.persistentData = newData.persistentData;
      this.requestedChange = RUNNING_BEHAVIOR;
    }
  };
  
  return new StateBehavior(init, draw, update, process);
}());

/* menu state */
/** @const */ var MENU_BEHAVIOR = (function () {

  var init = function () {
    this.introTimer = 0;
  };

  var draw = function(renderer) {
    var player        = this.persistentData.player;
    var currentChunk  = this.persistentData.currentChunk;
    renderer.fillScreen(0, 0, 256, 256);
    var waterAnim = this.persistentData.waterTime / this.persistentData.WATER_PERIOD;
    var k = (1 - this.introTimer / INTRO_PERIOD);
    k = k * k;
    var top_offset = TOP_OFFSET + k * SCREEN_HEIGHT;
    renderer.drawChunk(currentChunk, player, 0, top_offset, waterAnim);
    /* author: */
    var x = (SCREEN_WIDTH  - 128) / 2;
    var y = (SCREEN_HEIGHT / 2 -  32) / 2 - (1 - k) * SCREEN_HEIGHT / 3;
    renderer.drawSprite(352, 160, 128, 32, x, y, 128, 32);
    /* high score: */
    if (this.persistentData.highscore > 0) {
      x = (SCREEN_WIDTH  - 57) / 2;
      y = (SCREEN_HEIGHT - 16) / 2 - k * SCREEN_HEIGHT + 16;
      renderer.drawSprite(439, 192, 57, 16, x, y, 57, 16);
      var score = this.persistentData.highscore;
      /* I... I really don't know how THIS could have happened: */
      /* sorry :( */
      x = (SCREEN_WIDTH - ((score + '').length * 9) - 8) / 2;
      y += 16;
      renderer.drawNumber(score, 0, 0, x, y);
    }
    /* title: */
    x = (SCREEN_WIDTH  - 96) / 2;
    y = (SCREEN_HEIGHT - 64) / 2 - (1 - k) * SCREEN_HEIGHT / 4;
    renderer.drawSprite(256, 0, 96, 64, x, y, 96, 64);
    /* info: */
    x = (    SCREEN_WIDTH      - 96) / 2;
    y = (3 * SCREEN_HEIGHT / 2 - 32) / 2 + k * SCREEN_HEIGHT / 2;
    renderer.drawSprite(256, 64, 96, 32, x, y, 96, 32);
    /* link: */
    y = y + SCREEN_HEIGHT / 4;
    renderer.drawSprite(256, 96, 96, 16, x, y, 96, 16);
  };

  var update  = function(time) {
    var p = this.persistentData;

    p.player.animationTimer += time;
    if (p.player.animationTimer > p.player.animationPeriod)
      p.player.animationTimer -= p.player.animationPeriod;

    p.waterTime += time;
    if (p.waterTime > p.WATER_PERIOD)
      p.waterTime -= p.WATER_PERIOD;

    if (this.introTimer < INTRO_PERIOD) {
      this.introTimer += time;
      if (this.introTimer > INTRO_PERIOD)
        this.introTimer = INTRO_PERIOD;
    }
  };

  var process = function(keys) {
    if (this.introTimer >= INTRO_PERIOD) {
      if (32 in keys) { /* space */
        this.requestedChange = RUNNING_BEHAVIOR;
      }
    }
  };
  
  return new StateBehavior(init, draw, update, process);
}());

