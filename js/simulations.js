/* ============================================================
   Physics Logic Lectures — Simulations Engine
   Shared utilities, base classes, and UI helpers for all
   interactive physics simulations.
   ============================================================ */

'use strict';

/* ── Color Palette (matches site CSS variables) ── */
const SIM_COLORS = {
  void:       '#06060c',
  voidLight:  '#0c0c18',
  surface:    '#101020',
  surfaceRaised: '#16162a',
  surfaceHover: '#1c1c36',
  electric:   '#00d4ff',
  electricDim:'#00a8cc',
  electricGlow:'rgba(0,212,255,0.15)',
  magenta:    '#ff2d7b',
  magentaDim: '#cc2462',
  lime:       '#00ff88',
  limeDim:    '#00cc6d',
  violet:     '#8b5cf6',
  violetDim:  '#7040e0',
  gold:       '#fbbf24',
  textPrimary:'#eef0f6',
  textSecondary:'#a0a4b8',
  textMuted:  '#636780',
  gridLine:   'rgba(0,212,255,0.06)',
  gridLineBright: 'rgba(0,212,255,0.12)',
  white:      '#ffffff',
  red:        '#ff4466',
  orange:     '#ff9933',
};

/* ── Helpers ── */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function degToRad(d) { return d * Math.PI / 180; }
function radToDeg(r) { return r * 180 / Math.PI; }
function formatNum(n, decimals = 2) {
  if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(decimals);
  return Number(n.toFixed(decimals)).toString();
}

/* ── Canvas Setup ── */
function setupCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  return { canvas, ctx, resize, getWidth: () => canvas.width / (window.devicePixelRatio || 1), getHeight: () => canvas.height / (window.devicePixelRatio || 1) };
}

/* ── Grid Drawing ── */
function drawGrid(ctx, w, h, spacing = 40) {
  ctx.save();
  ctx.strokeStyle = SIM_COLORS.gridLine;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += spacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y <= h; y += spacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  ctx.restore();
}

/* ── Arrow Drawing ── */
function drawArrow(ctx, x1, y1, x2, y2, color, headSize = 10, lineWidth = 2) {
  const dx = x2 - x1, dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headSize * Math.cos(angle - 0.4), y2 - headSize * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headSize * Math.cos(angle + 0.4), y2 - headSize * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/* ── Rounded Rect ── */
function roundRect(ctx, x, y, w, h, r) {
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
}

/* ── Bar Chart Drawing ── */
function drawBarChart(ctx, x, y, w, h, bars, maxVal) {
  // bars: [{label, value, color}]
  const barW = w / bars.length * 0.6;
  const gap = w / bars.length * 0.4;
  const stepW = w / bars.length;

  ctx.save();
  ctx.font = '11px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';

  bars.forEach((bar, i) => {
    const bx = x + i * stepW + (stepW - barW) / 2;
    const barH = (bar.value / maxVal) * h;
    const by = y + h - barH;

    // Bar
    ctx.fillStyle = bar.color;
    ctx.globalAlpha = 0.3;
    roundRect(ctx, bx, by, barW, barH, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = bar.color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, barW, barH, 4);
    ctx.stroke();

    // Value
    ctx.fillStyle = bar.color;
    ctx.fillText(formatNum(bar.value, 1) + ' J', bx + barW / 2, by - 6);

    // Label
    ctx.fillStyle = SIM_COLORS.textSecondary;
    ctx.fillText(bar.label, bx + barW / 2, y + h + 16);
  });
  ctx.restore();
}

/* ── Graph Plotter (real-time line graph) ── */
class GraphPlotter {
  constructor(maxPoints = 300) {
    this.maxPoints = maxPoints;
    this.datasets = {}; // {name: {data:[], color, label}}
  }
  addDataset(name, color, label) {
    this.datasets[name] = { data: [], color, label };
  }
  push(name, value) {
    const ds = this.datasets[name];
    if (!ds) return;
    ds.data.push(value);
    if (ds.data.length > this.maxPoints) ds.data.shift();
  }
  clear() {
    Object.values(this.datasets).forEach(ds => ds.data = []);
  }
  draw(ctx, x, y, w, h, yMin, yMax) {
    ctx.save();
    // Background
    ctx.fillStyle = 'rgba(6,6,12,0.6)';
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill();
    ctx.strokeStyle = SIM_COLORS.gridLineBright;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 8);
    ctx.stroke();

    // Grid lines
    ctx.strokeStyle = SIM_COLORS.gridLine;
    ctx.lineWidth = 0.5;
    const ySteps = 4;
    for (let i = 0; i <= ySteps; i++) {
      const gy = y + (h / ySteps) * i;
      ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke();
    }

    // Zero line
    if (yMin < 0 && yMax > 0) {
      const zy = y + h * (yMax / (yMax - yMin));
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, zy); ctx.lineTo(x + w, zy); ctx.stroke();
    }

    // Data
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    Object.values(this.datasets).forEach(ds => {
      if (ds.data.length < 2) return;
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ds.data.forEach((v, i) => {
        const px = x + (i / (this.maxPoints - 1)) * w;
        const py = y + h - ((v - yMin) / (yMax - yMin)) * h;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
    ctx.restore();

    // Legend
    ctx.font = '11px "Space Grotesk", sans-serif';
    let lx = x + 10;
    Object.values(this.datasets).forEach(ds => {
      ctx.fillStyle = ds.color;
      ctx.fillRect(lx, y + 8, 14, 3);
      ctx.fillStyle = SIM_COLORS.textSecondary;
      ctx.textAlign = 'left';
      ctx.fillText(ds.label, lx + 18, y + 14);
      lx += ctx.measureText(ds.label).width + 36;
    });

    // Y-axis labels
    ctx.fillStyle = SIM_COLORS.textMuted;
    ctx.font = '10px "DM Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatNum(yMax, 1), x - 4, y + 10);
    ctx.fillText(formatNum(yMin, 1), x - 4, y + h);

    ctx.restore();
  }
}

/* ── Simulation Base Controller ── */
class SimController {
  constructor(canvasId) {
    const setup = setupCanvas(canvasId);
    this.canvas = setup.canvas;
    this.ctx = setup.ctx;
    this.resizeFn = setup.resize;
    this.getWidth = setup.getWidth;
    this.getHeight = setup.getHeight;

    this.running = false;
    this.time = 0;
    this.dt = 1 / 60;
    this.animId = null;
    this.lastTimestamp = 0;
    this.speed = 1;

    this._bindButtons();
    window.addEventListener('resize', () => {
      this.resizeFn();
      this.draw();
    });
  }

  _bindButtons() {
    const playBtn = document.getElementById('btn-play');
    const pauseBtn = document.getElementById('btn-pause');
    const resetBtn = document.getElementById('btn-reset');

    if (playBtn) playBtn.addEventListener('click', () => this.play());
    if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
    if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
  }

  play() {
    if (this.running) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this._loop();
    this._updateButtons();
  }

  pause() {
    this.running = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this._updateButtons();
  }

  reset() {
    this.pause();
    this.time = 0;
    this.onReset();
    this.draw();
    this._updateButtons();
  }

  _loop() {
    if (!this.running) return;
    this.animId = requestAnimationFrame((ts) => {
      const elapsed = (ts - this.lastTimestamp) / 1000;
      this.lastTimestamp = ts;
      const dt = Math.min(elapsed, 0.05) * this.speed;
      this.time += dt;
      this.update(dt);
      this.draw();
      this._loop();
    });
  }

  _updateButtons() {
    const playBtn = document.getElementById('btn-play');
    const pauseBtn = document.getElementById('btn-pause');
    if (playBtn) playBtn.classList.toggle('active', this.running);
    if (pauseBtn) pauseBtn.classList.toggle('active', !this.running);
  }

  // Override these
  update(dt) {}
  draw() {}
  onReset() {}
}

/* ── Slider Binding Helper ── */
function bindSlider(id, displayId, callback, transform) {
  const slider = document.getElementById(id);
  const display = document.getElementById(displayId);
  if (!slider) return;

  function update() {
    let val = parseFloat(slider.value);
    if (transform) val = transform(val);
    if (display) display.textContent = typeof val === 'number' ? formatNum(val) : val;
    if (callback) callback(val);
  }
  slider.addEventListener('input', update);
  update();
  return slider;
}

/* ── Display Value Helper ── */
function setDisplay(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof value === 'number' ? formatNum(value) : value;
}

/* ── Explanation Panel Helper ── */
function setExplanation(text) {
  const el = document.getElementById('explanation-text');
  if (el) el.innerHTML = text;
}
