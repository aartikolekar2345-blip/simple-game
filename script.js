// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const pw = 10;            // paddle width
const ph = 100;           // paddle height
const ballR = 8;          // ball radius

const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');

let WIDTH = canvas.width;
let HEIGHT = canvas.height;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Game state
const leftPaddle = { x: 10, y: (HEIGHT - ph) / 2, w: pw, h: ph, vy: 0 };
const rightPaddle = { x: WIDTH - pw - 10, y: (HEIGHT - ph) / 2, w: pw, h: ph, vy: 0 };
let ball = { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, speed: 5 };

let playerScore = 0;
let computerScore = 0;

let running = true;
let lastTime = 0;

// Controls
const paddleSpeed = 6;
let keys = { ArrowUp: false, ArrowDown: false };
let usingMouse = false;

// initialize ball with random direction toward the player or computer optionally
function resetBall(direction = null) {
  ball.x = WIDTH / 2;
  ball.y = HEIGHT / 2;
  ball.speed = 5;
  // random angle between -30 and 30 degrees
  const maxAngle = Math.PI / 4;
  const angle = (Math.random() * 2 - 1) * maxAngle;
  const dir = direction === 'left' ? -1 : direction === 'right' ? 1 : (Math.random() < 0.5 ? -1 : 1);
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

function drawNet() {
  const segH = 12;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  for (let y = 0; y < HEIGHT; y += segH * 2) {
    ctx.fillRect(WIDTH/2 - 1, y, 2, segH);
  }
}

function draw() {
  // background
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // net
  drawNet();

  // paddles
  ctx.fillStyle = '#9dd7c3';
  roundRect(ctx, leftPaddle.x, leftPaddle.y, leftPaddle.w, leftPaddle.h, 4, true);
  roundRect(ctx, rightPaddle.x, rightPaddle.y, rightPaddle.w, rightPaddle.h, 4, true);

  // ball
  ctx.fillStyle = '#ffd580';
  circle(ctx, ball.x, ball.y, ballR);

  // Add subtle glow
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,128,0.06)';
  ctx.arc(ball.x, ball.y, ballR * 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  if (fill) ctx.fill();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function update(dt) {
  if (!running) return;

  // Paddle movement via keys
  if (keys.ArrowUp) leftPaddle.y -= paddleSpeed;
  if (keys.ArrowDown) leftPaddle.y += paddleSpeed;

  // Clamp paddle in bounds
  leftPaddle.y = clamp(leftPaddle.y, 0, HEIGHT - leftPaddle.h);

  // Simple AI for right paddle
  const aiSpeed = 4.0; // adjust to change difficulty
  // move toward ball with some smoothing
  const targetY = ball.y - rightPaddle.h / 2;
  if (rightPaddle.y + rightPaddle.h / 2 < ball.y - 6) {
    rightPaddle.y += aiSpeed;
  } else if (rightPaddle.y + rightPaddle.h / 2 > ball.y + 6) {
    rightPaddle.y -= aiSpeed;
  }
  rightPaddle.y = clamp(rightPaddle.y, 0, HEIGHT - rightPaddle.h);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions (top & bottom)
  if (ball.y - ballR <= 0) {
    ball.y = ballR;
    ball.vy = -ball.vy;
  } else if (ball.y + ballR >= HEIGHT) {
    ball.y = HEIGHT - ballR;
    ball.vy = -ball.vy;
  }

  // Paddle collisions
  // Left paddle
  if (ball.x - ballR <= leftPaddle.x + leftPaddle.w) {
    if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.h) {
      // collided with left paddle
      handlePaddleCollision(leftPaddle);
    } else if (ball.x - ballR < 0) {
      // missed - point to computer
      computerScore++;
      computerScoreEl.textContent = computerScore;
      resetBall('right');
      return;
    }
  }

  // Right paddle
  if (ball.x + ballR >= rightPaddle.x) {
    if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.h) {
      handlePaddleCollision(rightPaddle);
    } else if (ball.x + ballR > WIDTH) {
      // missed - point to player
      playerScore++;
      playerScoreEl.textContent = playerScore;
      resetBall('left');
      return;
    }
  }
}

function handlePaddleCollision(paddle) {
  // Calculate relative intersection (-1 .. 1)
  const paddleCenter = paddle.y + paddle.h / 2;
  const relativeIntersect = (ball.y - paddleCenter) / (paddle.h / 2);
  const maxBounce = Math.PI / 4; // 45 degrees
  const bounceAngle = relativeIntersect * maxBounce;

  // increase speed slightly
  ball.speed = Math.min(ball.speed + 0.4, 12);

  const dir = (paddle === leftPaddle) ? 1 : -1;
  ball.vx = dir * ball.speed * Math.cos(bounceAngle);
  ball.vy = ball.speed * Math.sin(bounceAngle);

  // Nudge ball so it doesn't get stuck inside paddle
  if (paddle === leftPaddle) ball.x = leftPaddle.x + leftPaddle.w + ballR + 0.1;
  else ball.x = rightPaddle.x - ballR - 0.1;
}

function loop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  // center paddle to mouse y
  leftPaddle.y = clamp(y - leftPaddle.h / 2, 0, HEIGHT - leftPaddle.h);
  usingMouse = true;
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    running = !running;
    if (running) {
      // resume loop
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
    e.preventDefault();
    return;
  }
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    keys[e.code] = true;
    usingMouse = false;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
    keys[e.code] = false;
  }
});

// Start game
resetBall();
playerScore = 0;
computerScore = 0;
playerScoreEl.textContent = playerScore;
computerScoreEl.textContent = computerScore;
lastTime = performance.now();
requestAnimationFrame(loop);

// make responsive if canvas size changes (optional)
window.addEventListener('resize', () => {
  // keep fixed canvas size for consistent gameplay - could scale if desired
});