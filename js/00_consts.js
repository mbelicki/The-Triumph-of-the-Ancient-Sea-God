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

/** @const @type {number} */ 
var SCREEN_WIDTH  = 256;
/** @const @type {number} */ 
var SCREEN_HEIGHT = 256;

/** @const @type {number} */ 
var INTRO_PERIOD = 4;

/** @const @type {number} */ 
var TOP_OFFSET = 24;

/** @const @type {number} */ 
var GRID_SIZE    = 16;
/** @const @type {number} */ 
var CHUNK_WIDTH  = ((SCREEN_WIDTH  / GRID_SIZE) | 0);
/** @const @type {number} */ 
var CHUNK_HEIGHT = ((SCREEN_HEIGHT / GRID_SIZE) | 0) - 4;
/** @const @type {number} */ 
var CHUNK_HALF_WIDTH  = ((CHUNK_WIDTH  / 2) | 0); 
/** @const @type {number} */ 
var CHUNK_HALF_HEIGHT = ((CHUNK_HEIGHT / 2) | 0);

/** @const @type {number} */ 
var PATH_WIDTH = 4;

/** @const @type {number} */ 
var PLAYER_ANIM_FRAMES_COUNT = 8;
/** @const @type {number} */ 
var REFL_FRAME_COUNT = 4;

/** @const @type {number} */ 
var PLAYER_SCORE_STEP_MULTI = 3;

/** @const @type {number} */ 
var PASSED_CHUNK_FLOODING_SPEED = 16;
/** @const @type {number} */
var FLOODING_SPEED_STEP = 0.5;

/** @const @type {number} */ 
var BUTTON_FLOODING_SPEED_DOWN = 1;
/** @const @type {number} */ 
var BUTTON_SCORE_DOWN = 4;
/** @const @type {number} */ 
var BUTTON_FLOODING_SPEED_UP = 0.2;
/** @const @type {number} */ 
var BUTTON_SCORE_UP = 10;
