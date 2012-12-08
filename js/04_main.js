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

var renderer = (function () {
  var canvas  = document.getElementById('screen');
  var context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.mozImageSmoothingEnabled = false;
  context.webkitImageSmoothingEnabled = false;
  
  return new Renderer(context, 'gfx/bg.png', 1);
}());

/* layout arrangement */
var arrange = function () {
  /* found here: http://stackoverflow.com/a/1248126 */
  var elem = document.compatMode === 'CSS1Compat'
           ? document.documentElement 
           : document.body;
  var height = elem.clientHeight;
  var width  = elem.clientWidth;
  
  var scale = height < width
            ? height / SCREEN_HEIGHT
            : width  / SCREEN_WIDTH;
  scale = scale > 1 ? (scale | 0) : scale;
  if (scale > 3) scale = 3;

  var canvas  = document.getElementById('screen');
  var context = canvas.getContext('2d');
  context['imageSmoothingEnabled'] = false;
  context['mozImageSmoothingEnabled'] = false;
  context['webkitImageSmoothingEnabled'] = false;
  var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;

  var finalWidth  = ((scale * SCREEN_WIDTH)  | 0);
  var finalHeight = ((scale * SCREEN_HEIGHT) | 0);
  
  canvas.style.width  = finalWidth  + 'px';
  canvas.style.height = finalHeight + 'px';
  canvas.style.left   = (width  - finalWidth)  / 2 + 'px';
  canvas.style.top    = (height - finalHeight) / 2 + 'px';

  canvas.width  = isChrome ? finalWidth  : SCREEN_WIDTH;
  canvas.height = isChrome ? finalHeight : SCREEN_HEIGHT;

  if (isChrome) {
    renderer.manualScale = scale;
  }
};

arrange();

document.onresize = arrange;

var keys = (function () {
  var keys = {};

  document.addEventListener('keydown', function (e) {
  	keys[e.keyCode] = true;
  }, false);
  
  document.addEventListener('keyup', function (e) {
  	delete keys[e.keyCode];
  }, false);
  

  document.addEventListener('touchstart', function (e) {
    keys[32] = true;
  }, false);

  document.addEventListener('touchend', function (e) {
    delete keys[32];
  }, false);

  var jump = document.getElementById('jump-btn');
  /* screen controls: */
  if (jump) {
    jump.onclick = function () { 
      keys[32] = true; 
      setTimeout(function () {delete keys[32];}, 20);
    };
  }

  return keys;
}())

function getInitialData() {
  var _previousChunk = new Chunk(leapChunkBuilder, true);
  var _currentChunk  = new Chunk(startChunkBuilder, false);
  var _nextChunk     = new Chunk(straightChunkBuilder, true);
  var _player = new Player();
  var _highscore = readScore();
  
  return {
    persistentData: {
      player:        _player,
      
      previousChunk: _previousChunk,
      currentChunk:  _currentChunk,
      nextChunk:     _nextChunk,
      
      waveVelocity: 0,

      waterTime:    0,
      WATER_PERIOD: 2,

      highscore: _highscore
    }
  };
} 

var currentState = changeState(getInitialData(), MENU_BEHAVIOR);

var loop = function() {
  /* work around for: https://bugs.webkit.org/show_bug.cgi?id=89018 */
  renderer.context['webkitImageSmoothingEnabled'] = false;

  then = step(then, currentState, renderer, keys);
  /* TODO: this is a quick hack for poor step() design allowing state change */
  if (currentState.requestedChange) {
    currentState = changeState(currentState, currentState.requestedChange);
  }

};

/** @param {number} score */
function saveScore(score) {
	var date = new Date();
    var days = 88;
	date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
	var expires = "; expires=" + date.toGMTString();
    var name = 'tTotASG-score=';
	document.cookie = name + score + expires + '; path=/';
}

/** @return {number} */
function readScore() {
  var key = 'tTotASG-score=';
  var cookies = document.cookie.split(';');
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var index = cookie.indexOf(key);
    if (index > -1) {
      return cookie.substring(index + key.length, cookie.length) * 1;
    }
  }
  return 0;
}

/* actual entry point: */

var then = Date.now();
setInterval(loop, 33);
