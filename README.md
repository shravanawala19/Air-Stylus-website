# AIRstylus — Official Website

> **Turn your webcam into an air mouse.** Natural spatial cursor control for Windows 10 & 11, powered by MediaPipe hand landmarks and adaptive One-Euro filtering. Zero extra hardware required.

Designed with an **Anthropic-inspired editorial aesthetic**: warm paper palette, refined typography (*Newsreader*, *Instrument Serif*, *Plus Jakarta Sans*, *JetBrains Mono*), terracotta accents, and interactive browser simulations.

---

## 🌟 Key Features

- **21-Point Landmark Simulation**: Interactive HTML5 canvas demonstrating MediaPipe 3D hand tracking across 6 distinct gesture states:
  - Open Palm (Cursor Traverse)
  - Index Pinch (Left Click with Hysteresis)
  - Middle Pinch (Right Click)
  - Sustained Pinch (Drag & Drop Lock)
  - Two-Finger Travel (Kinetic Scroll)
  - Bilateral Span (Two-Hand Zoom)
- **1€ Adaptive Filter Playground**: Interactive sandbox comparing raw webcam jitter (`~0.86px RMS`) against adaptive low-pass filtered motion (`~0.03px RMS`).
- **Interactive Calibration Lab**: Dynamic 4-corner bounding box visualizer with real-time sliders for Sensitivity, Smoothing, Edge Padding, and Pinch Threshold that generates live JSON matching `config.json`.
- **System Architecture Deep Dive**: Technical breakdown of the decoupled threaded capture (`camera.py`), BlazeHand ML tracking (`tracking.py`), One-Euro smoothing (`smoothing.py`), and raw Win32 `SendInput` ctypes injection (`mouse.py`).
- **Warm Light & Dark Mode**: Persistent theme toggle matching Anthropic's signature ivory paper and charcoal night colorways.
- **Direct Installer Download**: Connected to the official Windows standalone setup package (`AIRstylus-Setup-1.0.0.exe`).

---

## 🚀 Quick Start (Local Development)

Because this website uses pure modern HTML5, CSS3, and JavaScript, no build step or package installation is required:

```bash
# Using Python
python -m http.server 3000

# Or using Node.js / npx
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in any browser.

---

## 📦 Project Structure

```
AIRstylus-website/
├── index.html          # Semantic HTML5 structure & SEO metadata
├── styles.css          # Anthropic-style CSS design system & responsiveness
├── app.js              # Landmark kinematics, 1€ filter sandbox, theme engine
├── hero-preview.jpg    # High-resolution desktop showcase visual
├── gesture-guide.jpg   # Editorial hand gesture reference diagram
├── logo.png            # High-resolution brand logo (1024x1024 RGBA)
├── favicon.ico         # Application icon
└── README.md           # Documentation
```

---

## 💻 Download AIRstylus

- **Platform**: Windows 10 & 11 (64-bit)
- **Installer**: [Download AIRstylus-Setup-1.0.0.exe](https://www.mediafire.com/file/g4fqw6yk5i1ogcv/AIRstylus-Setup-1.0.0.exe/file)
- **Hardware**: Any standard 720p/1080p USB or integrated webcam
