var width = window.innerWidth;
var height = window.innerHeight;

// MATH
function cubeVertices(dim){
  var vertices = [[]];
  for (var i=0; i<dim; ++i){
    var next = [];
    for (var j=0, l=vertices.length; j<l; ++j){
      next.push([-1].concat(vertices[j]));
      next.push([ 1].concat(vertices[j]));
    };
    vertices = next;
  };
  return vertices;
};

function cubeEdges(dim){
  var vertices = cubeVertices(dim);
  var edges = [];
  for (var i=0; i<vertices.length; ++i)
    for (var j=0; j<dim; ++j)
      edges.push([
        vertices[i],
        [].concat(
          vertices[i].slice(0,j),
          [-vertices[i][j]],
          vertices[i].slice(j+1))]);
  return edges;
};

var X = [1, 0, 0.7, -1.3, 1.9, 0.7];
var Y = [0, 1, 0.7,  1.3, -0.7, 1.6];
function project(point, dims){
  var x = 0.5 * width;
  var y = 0.5 * height;
  for (var i=0; i<point.length; ++i){
    var r = Math.max(Math.min(dims - i, 1), 0);
    x += point[i] * X[i] * r;
    y += point[i] * Y[i] * r;
  };
  return [x, y];
};
var R = [0, 0, 0, 1, 0, 0];
var G = [0, 0, 0, 0, 1, 0];
var B = [0, 0, 0, 0, 0, 1];
function projectColor(point, dims){
  var r = 0;
  var g = 0;
  var b = 0;
  var m = -7;
  for (var i=0; i<point.length; ++i){
    var k = Math.max(Math.min(dims - i, 1), 0);
    r += point[i] * R[i] * k * m;
    g += point[i] * G[i] * k * m;
    b += point[i] * B[i] * k * m;
  };
  return [r, g, b];
};

// SCREEN & RENDERING
var canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
canvas.context = canvas.getContext("2d");
var context = canvas.context;
context.textAlign = "center";
context.textBaseline = "middle";
context.lineWidth = 0.8;
function line(x0, y0, x1, y1, col0, col1){
  function rgb(col){ return "rgb("+(~~(col[0]))+","+(~~(col[1]))+","+(~~(col[2]))+")"; };
  var grad = context.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, rgb(col0));
  grad.addColorStop(1, rgb(col1));
  context.beginPath();
  context.moveTo(x0, y0);
  context.lineTo(x1, y1);
  context.strokeStyle = grad;
  context.stroke();
};
function text(x, y, size, text){
  context.font = size+"px Arial Narrow";
  context.fillText(text, x, y);
};
function clear(){
  context.clearRect(0, 0, width, height);
};
function add(a, b){
  var c = [];
  for (var i=0; i<a.length; ++i)
    c.push(a[i]+b[i]);
  return c;
};
function mul(a, b){
  var c = [];
  for (var i=0; i<a.length; ++i)
    c.push(a[i]*b[i]);
  return c;
};
function scale(x, a){
  var c = [];
  for (var i=0; i<a.length; ++i)
    c.push(a[i]*x);
  return c;
};
function dist(a, b){
  var dot = 0;
  for (var i=0; i<a.length; ++i)
    dot += (a[i] - b[i]) * (a[i] - b[i]);
  return Math.sqrt(dot);
};
function len(a, b){
  var dot = 0;
  for (var i=0; i<a.length; ++i)
    dot += a[i] * a[i];
  return Math.sqrt(dot);
};
function norm(a){
  return scale(1/len(a),a);
};
function adjust(a, dims){
  return a;
};
function set(n, x, a){
  var c = [];
  for (var i=0; i<a.length; ++i)
    c[i] = a[i];
  c[n] = x;
  return c;
};
function renderCube(dims, pos, size){
  var edges = cubeEdges(dims);
  for (var i=0, l=edges.length; i<l; ++i){
    var e0 = add(mul(edges[i][0],size),pos);
    var e1 = add(mul(edges[i][1],size),pos);
    var p0 = project(e0, dims);
    var p1 = project(e1, dims);
    var c0 = projectColor(e0, dims);
    var c1 = projectColor(e1, dims);
    line(p0[0], p0[1], p1[0], p1[1], c0, c1);
  };
};
function repeat(n, x){
  var c = [];
  for (var i=0; i<n; ++i)
    c.push(x);
  return c;
};
function between(x, from, to){
  return Math.min(Math.max(x, from), to);
};

// KEYBOARD
var down = [];
for (var i=0; i<255; ++i)
  down[String.fromCharCode(i)] = 0;
document.onkeypress = function(e){
  down[String.fromCharCode(e.keyCode).toLowerCase()] = 1;
};
document.onkeyup = function(e){
  down[String.fromCharCode(e.keyCode).toLowerCase()] = 0;
};

// THE GAME (you lost)
window.onload = function(){
  document.body.appendChild(canvas);

  var dims       = 0;
  var maxDims    = 6;
  var dimsSpd    = 0.0022;
  var stageSize  = 72;
  var ball       = [ 0, 0, 0, 0, 0, 0];
  var player     = [ 1, 0, 0, 0, 0, 0];
  var enemy      = [-1, 0, 0, 0, 0, 0];
  var padRad     = 8/64;
  var ballSpd    = 0.025;
  var ballDir    = [1, 0, 0, 0, 0, 0];
  var autoPlay   = false;
  var incDims    = true;

  var stageSizes = repeat(maxDims, stageSize);
  var padSizes   = [1.3].concat(repeat(maxDims, padRad*stageSize));
  var ballSizes  = repeat(maxDims, 2);

  var ks = [
    [],
    ["w", "s"],
    ["a", "d"],
    ["l", "j"],
    ["k", "i"],
    ["o", "u"]];

  setInterval(function(){
    // Autoplay config
    if (down.z) autoPlay = true;
    if (down.x) autoPlay = false;
    if (down.q || down.e) incDims = false;

    // Commands
    var spd  = 0.06;
    var k = padRad;
    dims = between(dims + down.e * spd - down.q * spd, 0, 6);
    for (var i=1; i<maxDims; ++i)
      player[i] = between(player[i] + down[ks[i][1]]*spd - down[ks[i][0]]*spd, -1, 1);
    ball = add(ball, mul(ballDir, repeat(maxDims, ballSpd)));

    // Auto follow ball
    enemy  = [-1].concat(ball.slice(1));
    if (autoPlay) player = [ 1].concat(ball.slice(1));
    for (var i=1; i<maxDims; ++i){
      if (player[i] < -1+k) player[i] = -1+k;
      if (player[i] >  1-k) player[i] =  1-k;
      if (enemy[i]  < -1+k) enemy[i]  = -1+k;
      if (enemy[i]  >  1-k) enemy[i]  =  1-k;
    };

    // Distances
    var playerDist = dist(ball,player);
    var enemyDist = dist(ball,enemy);

    // Ball is out on X
    if (!(-1 <= ball[0] && ball[0] < 1)){
      if (playerDist < padRad*1.5 || enemyDist < padRad*1.5 || autoPlay){
        for (var i=1; i<dims; ++i)
          ballDir[i] += Math.random();
        ballDir[0] = 0;
        if (dims > 1)
          ballDir = norm(ballDir);
        ballDir[0] = ball[0] >= 1 ? -1 : 1;
      } else {
        ball = repeat(maxDims, 0);
      };
    }

    // Ball is out on other axis
    for (var i=1; i<maxDims; ++i)
      if (!(-1 <= ball[i] && ball[i] < 1))
        ballDir[i] *= -1;

    // RENDER
    clear();
    text(26, 26, 46, dims.toFixed(1));

    // Ball
    renderCube(dims, adjust(mul(ball, stageSizes), dims), ballSizes);

    // Player
    renderCube(dims, adjust(mul(player, stageSizes), dims), adjust(padSizes, dims));

    // Enemy
    renderCube(dims, adjust(mul(enemy, stageSizes), dims), adjust(padSizes, dims));

    // Stage
    renderCube(dims, adjust(repeat(maxDims, 0), dims), stageSizes);

    var D = 60;
    var L = 20;
    var T = 10;
    var CX = D;
    var CY = height - D;
    for (var i=1; i<dims; ++i){
      line(CX-L*X[i], CY-L*Y[i], CX+L*X[i], CY+L*Y[i], [0, 0, 0], [0, 0, 0]);
      text(CX-(L+T)*X[i], CY-(L+T)*Y[i], T*2, ks[i][0]);
      text(CX+(L+T)*X[i], CY+(L+T)*Y[i], T*2, ks[i][1]);
    };

    if (incDims)
      dims = Math.min(dims + dimsSpd * (dims < 1 ? 4 : 1), maxDims);
  }, 50);

};
