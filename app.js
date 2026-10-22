/**
 * AIRstylus — Interactive Application Engine
 * Hand landmark simulation, 1€ filter comparator, calibration sandbox,
 * and Anthropic-style theme management.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLandmarkSimulator();
  initFilterSandbox();
  initCalibrationLab();
  initCodeShowcase();
  initFaqAccordion();
});

/* ===================================================================
   1. Theme Management (Anthropic Warm Ivory <-> Warm Charcoal)
   =================================================================== */
function initTheme() {
  const themeBtn = document.getElementById('themeToggleBtn');
  const storedTheme = localStorage.getItem('airstylus-theme') || 'light';
  
  applyTheme(storedTheme);

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'light' ? 'dark' : 'light';
      applyTheme(next);
      localStorage.setItem('airstylus-theme', next);
    });
  }
}

function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.innerHTML = `<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
    }
  } else {
    document.documentElement.removeAttribute('data-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.innerHTML = `<path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }
}

/* ===================================================================
   2. Interactive 21-Point Landmark Simulation
   =================================================================== */
function initLandmarkSimulator() {
  const canvas = document.getElementById('landmarkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let currentMode = 'move'; // 'move', 'left_click', 'right_click', 'drag', 'scroll', 'zoom'
  let mouseX = 0;
  let mouseY = 0;
  let isMouseOver = false;
  let animTime = 0;

  // MediaPipe Hand Topology Connections (21 Landmarks)
  const connections = [
    // Palm base
    [0, 1], [0, 5], [0, 17], [5, 9], [9, 13], [13, 17],
    // Thumb
    [1, 2], [2, 3], [3, 4],
    // Index
    [5, 6], [6, 7], [7, 8],
    // Middle
    [9, 10], [10, 11], [11, 12],
    // Ring
    [13, 14], [14, 15], [15, 16],
    // Pinky
    [17, 18], [18, 19], [19, 20]
  ];

  // Base neutral hand landmarks normalized [-1, 1] relative to wrist (0, 0)
  const baseLandmarks = [
    { x: 0, y: 1.2 },    // 0: Wrist
    // Thumb
    { x: -0.4, y: 0.9 }, // 1: CMC
    { x: -0.7, y: 0.6 }, // 2: MCP
    { x: -0.9, y: 0.3 }, // 3: IP
    { x: -1.0, y: 0.0 }, // 4: TIP
    // Index
    { x: -0.45, y: 0.35 },// 5: MCP
    { x: -0.48, y: -0.2 },// 6: PIP
    { x: -0.50, y: -0.6 },// 7: DIP
    { x: -0.52, y: -0.95 },// 8: TIP
    // Middle
    { x: -0.1, y: 0.3 }, // 9: MCP
    { x: -0.1, y: -0.3 },// 10: PIP
    { x: -0.1, y: -0.75 },// 11: DIP
    { x: -0.1, y: -1.15 },// 12: TIP
    // Ring
    { x: 0.25, y: 0.35 }, // 13: MCP
    { x: 0.28, y: -0.2 }, // 14: PIP
    { x: 0.30, y: -0.65 },// 15: DIP
    { x: 0.32, y: -1.0 }, // 16: TIP
    // Pinky
    { x: 0.55, y: 0.45 }, // 17: MCP
    { x: 0.62, y: 0.0 },  // 18: PIP
    { x: 0.67, y: -0.35 },// 19: DIP
    { x: 0.70, y: -0.7 }  // 20: TIP
  ];

  // Handle Resize & HiDPI
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Mouse interaction inside canvas
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    isMouseOver = true;
  });

  canvas.addEventListener('mouseleave', () => {
    isMouseOver = false;
  });

  // Mode button triggers
  const modeButtons = document.querySelectorAll('.mode-btn');
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
      updateGestureDetails(currentMode);
    });
  });

  function updateGestureDetails(mode) {
    const title = document.getElementById('gestureTitle');
    const desc = document.getElementById('gestureDesc');
    const rule = document.getElementById('gestureRule');
    const param1 = document.getElementById('gParam1');
    const param2 = document.getElementById('gParam2');

    const details = {
      move: {
        title: 'Open Palm Traverse',
        desc: 'Relaxed hand position. The centroid of the palm (wrist + MCP ring) directly guides the system pointer. Adaptive One-Euro filtering keeps the pointer rock-solid at rest while zero-lag tracking fast arm sweeps.',
        rule: 'palm_centroid = mean(landmarks[0, 5, 9, 17])\nsmoothing: adaptive_lowpass(fc=1.2Hz)',
        p1: 'Pointer Tracking',
        p2: '< 11.4 ms'
      },
      left_click: {
        title: 'Thumb + Index Pinch (Left Click)',
        desc: 'Quick touch between tip of thumb (Landmark 4) and tip of index finger (Landmark 8). Dual-stage hysteresis guarantees zero click bounce or stutter even with slight hand tremors.',
        rule: 'dist(thumb_tip, index_tip) < pinch_threshold\nhysteresis: threshold_high=0.05, threshold_low=0.038',
        p1: 'Left Mouse Down/Up',
        p2: 'Hysteresis Locked'
      },
      right_click: {
        title: 'Thumb + Middle Pinch (Right Click)',
        desc: 'Natural touch between tip of thumb (Landmark 4) and tip of middle finger (Landmark 12). Instantly triggers Windows context menus with zero accidental left-click interference.',
        rule: 'dist(thumb_tip, middle_tip) < pinch_threshold\nis_secondary_action = true',
        p1: 'Right Mouse Down/Up',
        p2: 'Contextual Dispatch'
      },
      drag: {
        title: 'Sustained Pinch (Drag & Drop)',
        desc: 'Holding the thumb + index pinch beyond 350 milliseconds seamlessly locks the cursor into drag mode. Move windows, drag files across folders, or draw continuous strokes.',
        rule: 'if pinch_duration > click_hold_seconds (0.35s):\n    mouse_event(MOUSEEVENTF_LEFTDOWN, hold=True)',
        p1: 'Inertial Drag Lock',
        p2: 'Hold > 350 ms'
      },
      scroll: {
        title: 'Two-Finger Travel (Kinetic Scroll)',
        desc: 'Index and middle fingers extended in parallel. Moving the hand up or down dynamically drives Windows vertical mouse wheel events with smooth velocity accumulation.',
        rule: 'dy = (index_y + middle_y)/2 - prev_y\nSendInput(MOUSEEVENTF_WHEEL, dy * scroll_sensitivity)',
        p1: 'Kinetic Vertical Wheel',
        p2: 'Accumulated Delta'
      },
      zoom: {
        title: 'Bilateral Distance (Two-Hand Zoom)',
        desc: 'Bring both hands into the camera view. Spreading or closing the distance between the two index fingertips triggers high-precision Windows native Ctrl + Wheel optical zoom.',
        rule: 'span = dist(left_index_tip, right_index_tip)\nSendInput(VK_CONTROL, MOUSEEVENTF_WHEEL, span_delta)',
        p1: 'Bilateral Ctrl+Zoom',
        p2: 'Two Hands Detected'
      }
    };

    const d = details[mode] || details.move;
    if (title) title.textContent = d.title;
    if (desc) desc.textContent = d.desc;
    if (rule) rule.textContent = d.rule;
    if (param1) param1.textContent = d.p1;
    if (param2) param2.textContent = d.p2;
  }

  // Animation Loop
  function render() {
    animTime += 0.03;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Compute Center Hand Position
    let cx = w / 2;
    let cy = h / 2 + 30;

    if (isMouseOver) {
      cx += (mouseX - cx) * 0.12;
      cy += (mouseY - cy) * 0.12;
    } else {
      cx += Math.sin(animTime * 0.8) * 35;
      cy += Math.cos(animTime * 1.1) * 20;
    }

    const scale = Math.min(w, h) * 0.19;

    // Build Current Frame Landmarks based on gesture mode
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const boneColor = isDark ? 'rgba(235, 142, 116, 0.45)' : 'rgba(204, 90, 54, 0.4)';
    const jointColor = isDark ? '#EB8E74' : '#CC5A36';
    const jointGlow = isDark ? 'rgba(235, 142, 116, 0.35)' : 'rgba(204, 90, 54, 0.25)';

    // Handle Dual Hand Mode for 'zoom'
    if (currentMode === 'zoom') {
      const separation = 90 + Math.sin(animTime * 2) * 55;
      drawHand(cx - separation, cy, scale * 0.85, 'left', 0);
      drawHand(cx + separation, cy, scale * 0.85, 'right', 0);

      // Draw Distance Span Line
      const leftTipX = cx - separation + (baseLandmarks[8].x * scale * 0.85);
      const leftTipY = cy + (baseLandmarks[8].y * scale * 0.85);
      const rightTipX = cx + separation - (baseLandmarks[8].x * scale * 0.85);
      const rightTipY = cy + (baseLandmarks[8].y * scale * 0.85);

      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#D97757';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(leftTipX, leftTipY);
      ctx.lineTo(rightTipX, rightTipY);
      ctx.stroke();

      // Span distance tag
      ctx.fillStyle = isDark ? '#FAF8F5' : '#191816';
      ctx.font = '600 11px JetBrains Mono';
      ctx.textAlign = 'center';
      const zoomPct = Math.round(100 + ((separation - 90) / 55) * 45);
      ctx.fillText(`ZOOM: ${zoomPct}% (Ctrl + Wheel)`, cx, (leftTipY + rightTipY) / 2 - 12);
      ctx.restore();
    } else {
      drawHand(cx, cy, scale, 'right', animTime);
    }

    // Telemetry Text
    const teleEl = document.getElementById('telemetryData');
    if (teleEl) {
      const latency = (10.8 + Math.sin(animTime * 3) * 0.9).toFixed(1);
      const fps = (59.6 + Math.cos(animTime * 4) * 0.5).toFixed(0);
      teleEl.innerHTML = `STATUS: TRACKING ACTIVE<br>MODEL: MediaPipe 21-PT 3D<br>FPS: ${fps} | LATENCY: ${latency}ms<br>GESTURE: ${currentMode.toUpperCase()}`;
    }

    requestAnimationFrame(render);
  }

  function drawHand(centerX, centerY, handScale, side, t) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const boneColor = isDark ? 'rgba(235, 142, 116, 0.5)' : 'rgba(204, 90, 54, 0.45)';
    const jointColor = isDark ? '#EB8E74' : '#CC5A36';

    const pts = baseLandmarks.map((pt, idx) => {
      let x = (side === 'left' ? -pt.x : pt.x) * handScale;
      let y = pt.y * handScale;

      // Apply mode deformations
      if (currentMode === 'left_click') {
        // Pinch thumb tip (4) and index tip (8) together
        if (idx === 4) {
          x = -0.35 * handScale;
          y = -0.75 * handScale;
        } else if (idx === 8) {
          x = -0.38 * handScale;
          y = -0.78 * handScale;
        }
      } else if (currentMode === 'right_click') {
        // Pinch thumb tip (4) and middle tip (12) together
        if (idx === 4) {
          x = -0.15 * handScale;
          y = -0.8 * handScale;
        } else if (idx === 12) {
          x = -0.12 * handScale;
          y = -0.85 * handScale;
        }
      } else if (currentMode === 'drag') {
        // Pinched and holding
        if (idx === 4 || idx === 8) {
          x = -0.36 * handScale + Math.sin(t * 3) * 12;
          y = -0.76 * handScale;
        }
      } else if (currentMode === 'scroll') {
        // Index & Middle extended, oscillating vertically
        const scrollDelta = Math.sin(t * 4) * 24;
        if ([5,6,7,8, 9,10,11,12].includes(idx)) {
          y += scrollDelta;
        }
        // Curl ring & pinky slightly
        if ([15, 16, 19, 20].includes(idx)) {
          y += 35;
        }
      }

      return {
        x: centerX + x,
        y: centerY + y
      };
    });

    // Draw Skeleton Bones
    ctx.strokeStyle = boneColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([i, j]) => {
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[j].x, pts[j].y);
      ctx.stroke();
    });

    // Draw Joints
    pts.forEach((pt, idx) => {
      const isTip = [4, 8, 12, 16, 20].includes(idx);
      const radius = isTip ? 4.5 : 3;

      // Glow on tips
      if (isTip) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius * 2.4, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(235, 142, 116, 0.25)' : 'rgba(204, 90, 54, 0.18)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#FFF' : jointColor;
      ctx.fill();
      ctx.strokeStyle = jointColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Ripple effect on pinch
    if (currentMode === 'left_click' || currentMode === 'drag') {
      const pX = (pts[4].x + pts[8].x) / 2;
      const pY = (pts[4].y + pts[8].y) / 2;
      const rippleR = ((t * 40) % 25) + 6;
      ctx.beginPath();
      ctx.arc(pX, pY, rippleR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(204, 90, 54, ${1 - (rippleR / 30)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  requestAnimationFrame(render);
}

/* ===================================================================
   3. One-Euro Adaptive Filter Interactive Sandbox
   =================================================================== */
function initFilterSandbox() {
  const sandbox = document.getElementById('sandboxArea');
  const simCursor = document.getElementById('simCursor');
  const filterBtns = document.querySelectorAll('.filter-toggle-btn');
  const meterFill = document.getElementById('meterFill');
  const meterVal = document.getElementById('meterVal');

  if (!sandbox || !simCursor) return;

  let isFiltered = true;
  let targetX = 150;
  let targetY = 150;
  let currentX = 150;
  let currentY = 150;
  let prevRawX = 150;
  let prevRawY = 150;

  // One-Euro Filter State Variables
  let xHat = 150;
  let yHat = 150;
  let dxHat = 0;
  let dyHat = 0;
  const minCutoff = 1.0;
  const beta = 0.007;
  const dCutoff = 1.0;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isFiltered = btn.dataset.filter === 'filtered';
      if (meterFill && meterVal) {
        if (isFiltered) {
          meterFill.classList.remove('noisy');
          meterVal.textContent = '0.03px RMS (Rock Solid)';
        } else {
          meterFill.classList.add('noisy');
          meterVal.textContent = '0.86px RMS (Raw Jitter)';
        }
      }
    });
  });

  sandbox.addEventListener('mousemove', (e) => {
    const rect = sandbox.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
  });

  // Target hover effects
  const targets = sandbox.querySelectorAll('.sandbox-target');
  function checkTargetCollisions(x, y) {
    targets.forEach(t => {
      const rect = t.getBoundingClientRect();
      const parentRect = sandbox.getBoundingClientRect();
      const tX = rect.left - parentRect.left;
      const tY = rect.top - parentRect.top;
      if (x >= tX && x <= tX + rect.width && y >= tY && y <= tY + rect.height) {
        t.classList.add('hovered');
      } else {
        t.classList.remove('hovered');
      }
    });
  }

  targets.forEach(t => {
    t.addEventListener('click', () => {
      t.classList.add('clicked');
      setTimeout(() => t.classList.remove('clicked'), 300);
    });
  });

  function updateCursor() {
    let rawX = targetX;
    let rawY = targetY;

    // Simulate authentic webcam sensor noise when unfiltered
    if (!isFiltered) {
      const jitterAmount = 4.2;
      rawX += (Math.random() - 0.5) * jitterAmount * 2;
      rawY += (Math.random() - 0.5) * jitterAmount * 2;
      currentX = rawX;
      currentY = rawY;
    } else {
      // 1-Euro Adaptive Filter Algorithm
      const dt = 1 / 60;
      const dx = (targetX - prevRawX) / dt;
      const dy = (targetY - prevRawY) / dt;
      prevRawX = targetX;
      prevRawY = targetY;

      // Filter derivative
      const alphaD = getAlpha(dt, dCutoff);
      dxHat = alphaD * dx + (1 - alphaD) * dxHat;
      dyHat = alphaD * dy + (1 - alphaD) * dyHat;

      // Dynamic Cutoff based on velocity
      const velocity = Math.sqrt(dxHat * dxHat + dyHat * dyHat);
      const cutoff = minCutoff + beta * velocity;
      const alpha = getAlpha(dt, cutoff);

      xHat = alpha * targetX + (1 - alpha) * xHat;
      yHat = alpha * targetY + (1 - alpha) * yHat;

      currentX = xHat;
      currentY = yHat;
    }

    simCursor.style.transform = `translate(${currentX}px, ${currentY}px)`;
    checkTargetCollisions(currentX, currentY);

    requestAnimationFrame(updateCursor);
  }

  function getAlpha(dt, cutoff) {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  requestAnimationFrame(updateCursor);
}

/* ===================================================================
   4. Calibration & Settings Tuning Lab
   =================================================================== */
function initCalibrationLab() {
  const sensSlider = document.getElementById('sliderSens');
  const smoothSlider = document.getElementById('sliderSmooth');
  const edgeSlider = document.getElementById('sliderEdge');
  const pinchSlider = document.getElementById('sliderPinch');

  const sensVal = document.getElementById('valSens');
  const smoothVal = document.getElementById('valSmooth');
  const edgeVal = document.getElementById('valEdge');
  const pinchVal = document.getElementById('valPinch');
  const jsonPreview = document.getElementById('jsonPreview');
  const calibBox = document.getElementById('calibBox');

  function updateConfig() {
    const s = parseFloat(sensSlider ? sensSlider.value : 1.0);
    const sm = parseFloat(smoothSlider ? smoothSlider.value : 0.5);
    const e = parseFloat(edgeSlider ? edgeSlider.value : 0.45);
    const p = parseFloat(pinchSlider ? pinchSlider.value : 0.05);

    if (sensVal) sensVal.textContent = s.toFixed(1);
    if (smoothVal) smoothVal.textContent = sm.toFixed(2);
    if (edgeVal) edgeVal.textContent = e.toFixed(2);
    if (pinchVal) pinchVal.textContent = p.toFixed(3);

    // Update Visualizer Box dimensions based on edge pad and sensitivity
    if (calibBox) {
      const padPct = Math.min(25, e * 35);
      calibBox.style.top = `${padPct}%`;
      calibBox.style.bottom = `${padPct}%`;
      calibBox.style.left = `${padPct}%`;
      calibBox.style.right = `${padPct}%`;
    }

    if (jsonPreview) {
      const configObj = {
        calibration: {
          x_min: 0.066,
          x_max: 0.985,
          y_min: 0.470,
          y_max: 0.918,
          invert_x: false,
          invert_y: false
        },
        settings: {
          sensitivity: s,
          smoothing: sm,
          edge_ease: e,
          edge_pad: 0.08,
          pinch_threshold: p,
          pinch_hysteresis: 0.012,
          click_hold_seconds: 0.35,
          scroll_sensitivity: 1.0,
          enable_two_hand: true,
          camera_index: 0,
          flip_preview: false
        }
      };
      jsonPreview.textContent = JSON.stringify(configObj, null, 2);
    }
  }

  [sensSlider, smoothSlider, edgeSlider, pinchSlider].forEach(sl => {
    if (sl) sl.addEventListener('input', updateConfig);
  });

  const copyConfigBtn = document.getElementById('copyConfigBtn');
  if (copyConfigBtn && jsonPreview) {
    copyConfigBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(jsonPreview.textContent).then(() => {
        copyConfigBtn.textContent = 'Copied!';
        setTimeout(() => copyConfigBtn.textContent = 'Copy JSON', 2000);
      });
    });
  }

  updateConfig();
}

/* ===================================================================
   5. Architecture Code Showcase
   =================================================================== */
function initCodeShowcase() {
  const tabs = document.querySelectorAll('.code-tab');
  const codeBody = document.getElementById('codeSnippet');
  const copyBtn = document.getElementById('copyCodeBtn');

  const snippets = {
    'smoothing.py': `# app/core/smoothing.py
import math

class OneEuroFilter:
    """Adaptive low-pass filter (Casiez et al., CHI 2012).
    Eliminates jitter when resting, minimal lag during rapid sweeps.
    """
    def __init__(self, min_cutoff=1.0, beta=0.007, d_cutoff=1.0):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff
        self.x_prev = None
        self.dx_prev = 0.0

    def filter(self, x, dt):
        if self.x_prev is None:
            self.x_prev = x
            return x
        # Filter the derivative
        dx = (x - self.x_prev) / dt
        a_d = self._alpha(dt, self.d_cutoff)
        dx_hat = a_d * dx + (1.0 - a_d) * self.dx_prev
        self.dx_prev = dx_hat

        # Adapt cutoff frequency to velocity
        cutoff = self.min_cutoff + self.beta * abs(dx_hat)
        a = self._alpha(dt, cutoff)
        x_hat = a * x + (1.0 - a) * self.x_prev
        self.x_prev = x_hat
        return x_hat

    @staticmethod
    def _alpha(dt, cutoff):
        tau = 1.0 / (2.0 * math.pi * cutoff)
        return 1.0 / (1.0 + tau / dt)`,

    'gestures.py': `# app/core/gestures.py
from app.core.smoothing import Hysteresis

class GestureEngine:
    def __init__(self, settings):
        self.settings = settings
        # Dual-threshold hysteresis prevents click bounce
        self.left_pinch = Hysteresis(
            settings.pinch_threshold, 
            settings.pinch_hysteresis
        )
        self.right_pinch = Hysteresis(
            settings.pinch_threshold, 
            settings.pinch_hysteresis
        )
        self._drag_time = None

    def update(self, hand):
        # 4 = Thumb Tip, 8 = Index Tip, 12 = Middle Tip
        d_left = norm(hand.landmarks[4] - hand.landmarks[8])
        d_right = norm(hand.landmarks[4] - hand.landmarks[12])

        is_left = self.left_pinch.update(d_left)
        is_right = self.right_pinch.update(d_right)
        return is_left, is_right`,

    'mouse.py': `# app/core/mouse.py
import ctypes
from ctypes import wintypes

# Win32 SendInput direct kernel event injection
MOUSEEVENTF_MOVE = 0x0001
MOUSEEVENTF_LEFTDOWN = 0x0002
MOUSEEVENTF_LEFTUP = 0x0004
MOUSEEVENTF_ABSOLUTE = 0x8000

def move_cursor_absolute(x: int, y: int, screen_w: int, screen_h: int):
    # Map to normalized 0..65535 coordinates
    norm_x = int(x * 65535 / screen_w)
    norm_y = int(y * 65535 / screen_h)
    inp = Input(
        type=INPUT_MOUSE,
        mi=MouseInput(
            dx=norm_x, dy=norm_y,
            dwFlags=MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE
        )
    )
    ctypes.windll.user32.SendInput(1, ctypes.byref(inp), ctypes.sizeof(inp))`
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const file = tab.dataset.file;
      if (codeBody && snippets[file]) {
        codeBody.textContent = snippets[file];
      }
    });
  });

  if (copyBtn && codeBody) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(codeBody.textContent).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy Code', 2000);
      });
    });
  }
}

/* ===================================================================
   6. FAQ Accordion
   =================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) {
          item.classList.add('open');
        }
      });
    }
  });
}
