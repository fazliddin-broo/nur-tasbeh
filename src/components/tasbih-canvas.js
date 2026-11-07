// High Performance Dynamic Dual-Mode Canvas Engine:
// 1. Desktop: Warm 4K Sunset Landscape with Flying Birds, Golden Sun Dust, and 3D Sliding Pearl Beads
// 2. Mobile: Serene Desert Oasis at Night with Falling Glowing Water Drops, Expanding Ripples, Sprouting Greens, Rain Showers, Date Palms, and Blooming Flowers (Inspired by Istighfar Desert Video)

import { soundEngine } from '../services/audio-service.js';
import { dbService } from '../services/db-service.js';

export class TasbihEngine {
  constructor(canvasElement, onCountChange, onMilestoneReached) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.onCountChange = onCountChange;
    this.onMilestoneReached = onMilestoneReached;

    // Viewport & Scaling
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // State & Visibility
    this.activeZikr = null;
    this.count = 0;
    this.target = 100;
    this.isVisible = true;

    // Desktop Sunset Scene Data
    this.beadOffset = 0;
    this.targetOffset = 0;
    this.particles = [];
    this.sunMotes = [];
    this.birds = [];

    // Mobile Oasis Scene Data
    this.stars = [];
    this.waterDrops = [];
    this.ripples = [];
    this.splashes = [];
    this.fireflies = [];
    this.rainDrops = [];

    // Sunset background image for Desktop
    this.bgImage = new Image();
    this.bgLoaded = false;
    this.bgImage.src = '/images/sunset-bg.jpg';
    this.bgImage.onload = () => {
      this.bgLoaded = true;
    };

    // Interaction State
    this.isDragging = false;
    this.dragStartX = 0;
    this.lastTouchX = 0;
    this.touchStartTime = 0;
    this.hasMoved = false;

    this.initScene();
    this.setupListeners();
    this.resize();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initScene() {
    // Desktop Sunset Birds
    this.birds = [];
    for (let i = 0; i < 9; i++) {
      this.birds.push({
        x: Math.random() * (this.width + 400) - 200,
        y: this.height * 0.12 + Math.random() * (this.height * 0.32),
        speed: 0.65 + Math.random() * 0.6,
        size: 3.5 + Math.random() * 3.5,
        wingPhase: Math.random() * Math.PI * 2,
        wingSpeed: 0.08 + Math.random() * 0.04,
        altitudeDrift: (Math.random() - 0.5) * 0.15
      });
    }

    // Desktop Sun Motes
    this.sunMotes = [];
    for (let i = 0; i < 35; i++) {
      this.sunMotes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        radius: Math.random() * 2.2 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -0.2 - Math.random() * 0.4,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }

    // Mobile Oasis Stars
    this.stars = [];
    for (let i = 0; i < 65; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.68),
        size: Math.random() * 1.8 + 0.5,
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.03
      });
    }

    // Mobile Rain Drops
    this.rainDrops = [];
    for (let i = 0; i < 28; i++) {
      this.rainDrops.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.height * 0.8),
        len: 12 + Math.random() * 14,
        speed: 6 + Math.random() * 4,
        alpha: 0.18 + Math.random() * 0.25
      });
    }

    // Mobile Fireflies
    this.fireflies = [];
    for (let i = 0; i < 18; i++) {
      this.fireflies.push({
        x: this.width * 0.2 + Math.random() * (this.width * 0.6),
        y: this.height * 0.72 + Math.random() * (this.height * 0.22),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.35,
        radius: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  setVisible(visible) {
    this.isVisible = visible;
  }

  setZikr(zikr, count = null) {
    this.activeZikr = zikr;
    this.target = zikr.target || (zikr.isAsmaUlHusna ? 99 : 100);
    this.count = count !== null ? count : dbService.getCount(zikr.id);
    this.targetOffset = this.count;
    this.beadOffset = this.count;
    this.updateTrackMetrics();
  }

  setTarget(newTarget) {
    this.target = newTarget;
    if (this.onCountChange) {
      this.onCountChange(this.count, this.target);
    }
  }

  reset() {
    this.count = 0;
    this.targetOffset = 0;
    this.beadOffset = 0;
    this.waterDrops = [];
    this.ripples = [];
    if (this.activeZikr) {
      dbService.setCount(this.activeZikr.id, 0);
    }
    if (this.onCountChange) {
      this.onCountChange(this.count, this.target);
    }
  }

  increment() {
    this.count++;
    this.targetOffset = this.count;

    if (this.isMobile()) {
      soundEngine.playWaterDrop();
      this.spawnWaterDrop();
    } else {
      soundEngine.playBeadClick(this.count);
    }

    if (this.activeZikr) {
      dbService.setCount(this.activeZikr.id, this.count);
    }

    // Floating +1 indicator particle
    const pX = this.width / 2;
    const pY = this.isMobile() ? this.height * 0.46 : this.getBeadTrackY(0.5) - 35;
    this.spawnParticle(pX, pY);

    if (this.onCountChange) {
      this.onCountChange(this.count, this.target);
    }

    // Milestone completion check
    if (this.target > 0 && this.count % this.target === 0) {
      soundEngine.playCompletionChime();
      if (this.onMilestoneReached) {
        this.onMilestoneReached(this.count, this.target);
      }
    }
  }

  spawnWaterDrop() {
    const startX = this.width / 2 + (Math.random() - 0.5) * 8;
    const startY = this.height * 0.44; // Just below center count ring
    const poolCenterY = this.height * 0.81;

    this.waterDrops.push({
      x: startX,
      y: startY,
      targetY: poolCenterY + (Math.random() - 0.5) * 14,
      vy: 4.5,
      radius: 4.2,
      alpha: 1.0
    });
  }

  spawnParticle(x, y) {
    this.particles.push({
      x: x + (Math.random() - 0.5) * 14,
      y: y,
      vy: -2.0 - Math.random() * 0.8,
      vx: (Math.random() - 0.5) * 0.4,
      alpha: 1.0,
      scale: 1.0,
      text: '+1'
    });
  }

  setupListeners() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initScene();
    });

    const handleStart = (clientX, clientY) => {
      this.isDragging = true;
      this.dragStartX = clientX;
      this.lastTouchX = clientX;
      this.touchStartTime = Date.now();
      this.hasMoved = false;
    };

    const handleMove = (clientX, clientY) => {
      if (!this.isDragging) return;
      const dx = clientX - this.lastTouchX;
      if (Math.abs(clientX - this.dragStartX) > 8) {
        this.hasMoved = true;
      }
      this.lastTouchX = clientX;
      if (!this.isMobile()) {
        this.beadOffset -= dx * 0.015;
      }
    };

    const handleEnd = (clientX, clientY) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      const dt = Date.now() - this.touchStartTime;
      const totalDx = clientX - this.dragStartX;

      if (!this.isMobile() && this.hasMoved && totalDx < -30) {
        this.increment();
      } else if (!this.hasMoved && dt < 450) {
        this.increment();
      } else {
        this.targetOffset = this.count;
      }
    };

    this.canvas.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => handleEnd(e.clientX, e.clientY));

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (e.changedTouches.length > 0) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    }, { passive: true });
  }

  updateTrackMetrics() {
    let headerBottom = this.height * 0.28;
    let counterTop = this.height * 0.72;

    const headerEl = document.getElementById('active-zikr-box');
    const counterEl = document.getElementById('counter-ring-box');

    if (headerEl) {
      const hRect = headerEl.getBoundingClientRect();
      if (hRect.bottom > 0) {
        headerBottom = hRect.bottom;
      }
    }
    if (counterEl) {
      const cRect = counterEl.getBoundingClientRect();
      if (cRect.top > 0) {
        counterTop = cRect.top;
      }
    }

    const availableSpace = counterTop - headerBottom;
    if (availableSpace > 100) {
      // Comfortably centered between zikr header text and counter ring
      this.baseTrackY = headerBottom + (availableSpace * 0.46);
    } else {
      this.baseTrackY = Math.max(headerBottom + 45, this.height * 0.50);
    }
    this.sag = Math.min(20, this.height * 0.024);
  }

  getBeadTrackY(t) {
    if (typeof this.baseTrackY === 'undefined') {
      this.updateTrackMetrics();
    }
    return this.baseTrackY + Math.sin(t * Math.PI) * this.sag;
  }

  getBeadTrackX(t) {
    const margin = 20;
    return margin + t * (this.width - margin * 2);
  }

  isMobile() {
    return this.width <= 768;
  }

  animate() {
    const diff = this.targetOffset - this.beadOffset;
    this.beadOffset += diff * 0.18;

    this.frameCounter = (this.frameCounter || 0) + 1;
    if (this.frameCounter % 20 === 0) {
      this.updateTrackMetrics();
    }

    this.render();
    requestAnimationFrame(this.animate);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (this.isMobile()) {
      // -------------------------------------------------------------
      // MOBILE: Serene Desert Oasis Mode with Water Drops & Garden
      // -------------------------------------------------------------
      this.renderMobileOasis(ctx, w, h);
    } else {
      // -------------------------------------------------------------
      // DESKTOP: Warm 4K Sunset Landscape with Sliding Pearl Beads
      // -------------------------------------------------------------
      this.renderDesktopSunset(ctx, w, h);
    }

    // Shared: Floating +1 particles
    if (this.isVisible) {
      this.renderParticles(ctx);
    }
  }

  // =========================================================================
  // MOBILE OASIS ENGINE
  // =========================================================================
  renderMobileOasis(ctx, w, h) {
    const progress = Math.min(1.0, this.count / Math.max(1, this.target));

    // 1. Emerald Night Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.75);
    skyGrad.addColorStop(0, '#02120e');
    skyGrad.addColorStop(0.35, '#05221b');
    skyGrad.addColorStop(0.70, '#09362a');
    skyGrad.addColorStop(1, '#0e4536');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Twinkling Night Stars
    ctx.save();
    const now = Date.now() * 0.001;
    this.stars.forEach(s => {
      const alpha = 0.3 + 0.5 * Math.sin(now * s.twinkleSpeed * 10 + s.twinkleOffset);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 3. Glowing Crescent Moon (Right side)
    this.renderCrescentMoon(ctx, w * 0.82, h * 0.14, 22);

    // 4. Distant Mosque Silhouette (Left horizon)
    this.renderMosqueSilhouette(ctx, w * 0.16, h * 0.69);

    // 5. Rain Showers (When progress >= 25%)
    if (progress >= 0.25) {
      this.renderRain(ctx, w, h, progress);
    }

    // 6. Desert Earth Ground (Curves across bottom)
    const groundY = h * 0.70;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, h);
    groundGrad.addColorStop(0, '#1c150c');
    groundGrad.addColorStop(0.4, '#261b0f');
    groundGrad.addColorStop(1, '#130c06');

    ctx.fillStyle = groundGrad;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 15);
    ctx.quadraticCurveTo(w * 0.5, groundY - 12, w, groundY + 15);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // 7. Oasis Water Pool (Center bottom)
    const poolX = w * 0.5;
    const poolY = h * 0.81;
    const poolRx = w * 0.38;
    const poolRy = h * 0.085;

    this.renderOasisPool(ctx, poolX, poolY, poolRx, poolRy, progress);

    // 8. Oasis Flora Progression (Sprouts -> Palms -> Flowers)
    this.renderOasisFlora(ctx, poolX, poolY, poolRx, poolRy, progress);

    // 9. Falling Water Drops
    this.renderWaterDrops(ctx, poolY);

    // 10. Water Ripples & Splashes
    this.renderRipples(ctx);
    this.renderSplashes(ctx);

    // 11. Glowing Fireflies (When progress >= 75%)
    if (progress >= 0.75) {
      this.renderFireflies(ctx, poolX, poolY);
    }
  }

  renderCrescentMoon(ctx, cx, cy, radius) {
    ctx.save();
    // Soft outer glow
    const glow = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 2.8);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    glow.addColorStop(0.5, 'rgba(251, 191, 36, 0.12)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Crescent body
    ctx.fillStyle = '#fef3c7';
    ctx.shadowColor = '#fde68a';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0.4 * Math.PI, 1.6 * Math.PI, false);
    ctx.bezierCurveTo(cx - radius * 0.2, cy - radius * 0.7, cx - radius * 0.2, cy + radius * 0.7, cx + Math.cos(0.4 * Math.PI) * radius, cy + Math.sin(0.4 * Math.PI) * radius);
    ctx.fill();
    ctx.restore();
  }

  renderMosqueSilhouette(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(6, 26, 20, 0.85)';

    // Main dome
    ctx.beginPath();
    ctx.arc(x, y, 14, Math.PI, 0, false);
    ctx.fill();

    // Minaret on right of dome
    const mX = x + 24;
    ctx.fillRect(mX - 2.5, y - 28, 5, 28);
    // Minaret spire & crescent
    ctx.beginPath();
    ctx.moveTo(mX - 3.5, y - 28);
    ctx.lineTo(mX, y - 36);
    ctx.lineTo(mX + 3.5, y - 28);
    ctx.closePath();
    ctx.fill();

    // Dome crescent spire
    ctx.fillRect(x - 0.8, y - 19, 1.6, 6);
    ctx.restore();
  }

  renderRain(ctx, w, h, progress) {
    ctx.save();
    const rainIntensity = Math.min(1.0, (progress - 0.25) / 0.5);
    ctx.strokeStyle = `rgba(180, 230, 255, ${0.22 * rainIntensity})`;
    ctx.lineWidth = 1.0;

    this.rainDrops.forEach(r => {
      r.y += r.speed;
      if (r.y > h * 0.78) {
        r.y = h * 0.15;
        r.x = Math.random() * w;
      }

      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 2, r.y + r.len);
      ctx.stroke();
    });
    ctx.restore();
  }

  renderOasisPool(ctx, cx, cy, rx, ry, progress) {
    ctx.save();

    // Dry basin contour outline
    ctx.strokeStyle = 'rgba(56, 40, 24, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Basin interior gradient
    const basinGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
    basinGrad.addColorStop(0, '#0f0a04');
    basinGrad.addColorStop(0.85, '#171108');
    basinGrad.addColorStop(1, '#2b1e10');
    ctx.fillStyle = basinGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water level fills with progress (or minimum initial glistening reflection)
    const waterProgress = Math.max(0.08, progress);
    const curRx = rx * waterProgress;
    const curRy = ry * waterProgress;

    // Glowing turquoise water
    const waterGrad = ctx.createRadialGradient(cx, cy, curRy * 0.2, cx, cy, curRx);
    waterGrad.addColorStop(0, '#5eead4');
    waterGrad.addColorStop(0.4, '#14b8a6');
    waterGrad.addColorStop(0.8, '#0f766e');
    waterGrad.addColorStop(1, 'rgba(13, 78, 71, 0.85)');

    ctx.fillStyle = waterGrad;
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 18 * waterProgress;
    ctx.beginPath();
    ctx.ellipse(cx, cy, curRx, curRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Water caustic sheen reflection
    ctx.shadowBlur = 0;
    const sheenGrad = ctx.createLinearGradient(cx - curRx * 0.6, cy - curRy * 0.4, cx + curRx * 0.6, cy + curRy * 0.4);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    sheenGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.beginPath();
    ctx.ellipse(cx - curRx * 0.15, cy - curRy * 0.2, curRx * 0.65, curRy * 0.45, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderOasisFlora(ctx, cx, cy, rx, ry, progress) {
    ctx.save();

    // 1. Green grass sprouts around the pool rim (Starts at progress > 0.08)
    if (progress > 0.08) {
      const sproutAlpha = Math.min(1.0, (progress - 0.08) / 0.25);
      ctx.fillStyle = `rgba(52, 211, 153, ${sproutAlpha})`;

      const sproutPoints = [
        { angle: -0.85 * Math.PI, h: 10 },
        { angle: -0.65 * Math.PI, h: 14 },
        { angle: -0.35 * Math.PI, h: 12 },
        { angle: -0.15 * Math.PI, h: 9 },
        { angle: 0.15 * Math.PI, h: 11 },
        { angle: 0.45 * Math.PI, h: 13 },
        { angle: 0.85 * Math.PI, h: 12 }
      ];

      sproutPoints.forEach(pt => {
        const sx = cx + Math.cos(pt.angle) * (rx + 4);
        const sy = cy + Math.sin(pt.angle) * (ry + 3);
        const sproutHeight = pt.h * Math.min(1.0, progress * 1.5);

        ctx.beginPath();
        ctx.moveTo(sx - 2, sy);
        ctx.quadraticCurveTo(sx + 3, sy - sproutHeight, sx + 5, sy);
        ctx.fill();
      });
    }

    // 2. Date Palm Trees (Sprouts at 25%, tall at 50%+)
    if (progress >= 0.25) {
      const palmScale = Math.min(1.0, (progress - 0.25) / 0.4);
      // Left Palm Tree
      this.drawPalmTree(ctx, cx - rx * 0.95, cy - ry * 0.2, 55 * palmScale, -0.15);
      // Right Palm Tree
      this.drawPalmTree(ctx, cx + rx * 0.95, cy - ry * 0.2, 50 * palmScale, 0.18);
    }

    // 3. Blooming Flowers (Sprouts at 60%+)
    if (progress >= 0.60) {
      const flowerAlpha = Math.min(1.0, (progress - 0.60) / 0.3);
      this.drawFlower(ctx, cx - rx * 0.45, cy + ry * 0.85, '#f472b6', flowerAlpha);
      this.drawFlower(ctx, cx + rx * 0.35, cy + ry * 0.82, '#fde047', flowerAlpha);
      this.drawFlower(ctx, cx - rx * 0.75, cy + ry * 0.35, '#ffffff', flowerAlpha);
      this.drawFlower(ctx, cx + rx * 0.70, cy + ry * 0.40, '#fb923c', flowerAlpha);
    }

    ctx.restore();
  }

  drawPalmTree(ctx, x, y, height, leanAngle) {
    if (height < 10) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(leanAngle);

    // Trunk
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.moveTo(-3, 0);
    ctx.quadraticCurveTo(- leanAngle * 20, -height * 0.6, -1.5, -height);
    ctx.lineTo(1.5, -height);
    ctx.quadraticCurveTo(- leanAngle * 18, -height * 0.6, 3, 0);
    ctx.closePath();
    ctx.fill();

    // Palm Fronds
    ctx.fillStyle = '#059669';
    const topY = -height;
    const frondAngles = [-1.2, -0.6, 0, 0.6, 1.2];
    frondAngles.forEach(fa => {
      ctx.save();
      ctx.translate(0, topY);
      ctx.rotate(fa);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(12, -8, 24, 6);
      ctx.quadraticCurveTo(12, -2, 0, 0);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  }

  drawFlower(ctx, x, y, color, alpha) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    const r = 3.5;

    // 5 delicate petals
    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * r, y + Math.sin(ang) * r, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Flower center
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, y, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderWaterDrops(ctx, poolY) {
    ctx.save();
    for (let i = this.waterDrops.length - 1; i >= 0; i--) {
      const drop = this.waterDrops[i];
      drop.y += drop.vy;
      drop.vy += 0.38; // Gravity acceleration

      // Luminous water droplet
      const dropGrad = ctx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, drop.radius);
      dropGrad.addColorStop(0, '#ffffff');
      dropGrad.addColorStop(0.5, '#5eead4');
      dropGrad.addColorStop(1, 'rgba(45, 212, 191, 0.2)');

      ctx.fillStyle = dropGrad;
      ctx.shadowColor = '#5eead4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();

      // Droplet hits pool surface!
      if (drop.y >= drop.targetY) {
        // Spawn expanding ripple
        this.ripples.push({
          x: drop.x,
          y: drop.targetY,
          rx: 4,
          ry: 1.6,
          maxRx: 45 + Math.random() * 15,
          alpha: 0.9,
          growthRate: 1.4
        });

        // Spawn splash sparkles
        for (let s = 0; s < 4; s++) {
          this.splashes.push({
            x: drop.x,
            y: drop.targetY,
            vx: (Math.random() - 0.5) * 2.2,
            vy: -1.6 - Math.random() * 1.8,
            radius: 1.4,
            alpha: 1.0
          });
        }

        this.waterDrops.splice(i, 1);
      }
    }
    ctx.restore();
  }

  renderRipples(ctx) {
    ctx.save();
    ctx.shadowColor = '#2dd4bf';
    ctx.shadowBlur = 6;

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.rx += rip.growthRate;
      rip.ry += rip.growthRate * 0.35;
      rip.alpha -= 0.022;

      if (rip.alpha <= 0 || rip.rx >= rip.maxRx) {
        this.ripples.splice(i, 1);
        continue;
      }

      ctx.strokeStyle = `rgba(94, 234, 212, ${rip.alpha})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(rip.x, rip.y, rip.rx, rip.ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderSplashes(ctx) {
    ctx.save();
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += 0.22;
      sp.alpha -= 0.035;

      if (sp.alpha <= 0) {
        this.splashes.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(204, 251, 241, ${sp.alpha})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderFireflies(ctx, cx, cy) {
    ctx.save();
    const now = Date.now() * 0.002;
    this.fireflies.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      if (f.y < this.height * 0.60) {
        f.y = this.height * 0.88;
        f.x = cx + (Math.random() - 0.5) * (this.width * 0.6);
      }

      const glowAlpha = 0.3 + 0.6 * Math.sin(now * 3 + f.phase);
      ctx.fillStyle = `rgba(253, 230, 138, ${Math.max(0.1, glowAlpha)})`;
      ctx.shadowColor = '#fef08a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // =========================================================================
  // DESKTOP SUNSET ENGINE
  // =========================================================================
  renderDesktopSunset(ctx, w, h) {
    if (this.bgLoaded) {
      const imgRatio = this.bgImage.width / this.bgImage.height;
      const canvasRatio = w / h;
      let renderW, renderH, renderX, renderY;

      if (canvasRatio > imgRatio) {
        renderW = w;
        renderH = w / imgRatio;
        renderX = 0;
        renderY = (h - renderH) / 2;
      } else {
        renderH = h;
        renderW = h * imgRatio;
        renderX = (w - renderW) / 2;
        renderY = 0;
      }

      ctx.drawImage(this.bgImage, renderX, renderY, renderW, renderH);

      // Deep atmospheric contrast vignette
      const warmVignette = ctx.createLinearGradient(0, 0, 0, h);
      warmVignette.addColorStop(0, 'rgba(6, 3, 1, 0.75)');
      warmVignette.addColorStop(0.22, 'rgba(10, 5, 2, 0.50)');
      warmVignette.addColorStop(0.50, 'rgba(10, 5, 2, 0.20)');
      warmVignette.addColorStop(0.80, 'rgba(8, 4, 2, 0.50)');
      warmVignette.addColorStop(1, 'rgba(4, 2, 1, 0.85)');
      ctx.fillStyle = warmVignette;
      ctx.fillRect(0, 0, w, h);
    } else {
      const sunsetGrad = ctx.createLinearGradient(0, 0, 0, h);
      sunsetGrad.addColorStop(0, '#fdba74');
      sunsetGrad.addColorStop(0.4, '#ea580c');
      sunsetGrad.addColorStop(0.7, '#7c2d12');
      sunsetGrad.addColorStop(1, '#180a06');
      ctx.fillStyle = sunsetGrad;
      ctx.fillRect(0, 0, w, h);
    }

    // Animated Flying Birds Silhouette
    this.renderBirds(ctx, w, h);

    // Floating Sunbeam Golden Dust Particles
    this.renderSunMotes(ctx, w, h);

    // 3D Sliding Pearl Beads on Track (Desktop only)
    if (this.isVisible) {
      this.renderTrackLine(ctx);
      this.renderBeads(ctx);
      this.renderCenterIndicator(ctx, w);
    }
  }

  renderBirds(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(28, 14, 8, 0.88)';
    const time = Date.now() * 0.001;

    this.birds.forEach(bird => {
      bird.x += bird.speed;
      bird.y += bird.altitudeDrift;

      if (bird.x > w + 200) {
        bird.x = -150;
        bird.y = h * 0.12 + Math.random() * (h * 0.32);
      }

      const wingY = Math.sin(time * 8 * bird.speed + bird.wingPhase) * (bird.size * 0.9);
      const s = bird.size;

      ctx.beginPath();
      ctx.moveTo(bird.x, bird.y);
      ctx.quadraticCurveTo(bird.x - s * 0.8, bird.y - wingY, bird.x - s * 1.8, bird.y - wingY * 0.4);
      ctx.lineTo(bird.x - s * 0.4, bird.y);
      ctx.quadraticCurveTo(bird.x + s * 0.8, bird.y - wingY, bird.x + s * 1.8, bird.y - wingY * 0.4);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }

  renderSunMotes(ctx, w, h) {
    ctx.save();
    const time = Date.now() * 0.001;

    this.sunMotes.forEach(mote => {
      mote.x += mote.vx;
      mote.y += mote.vy;

      if (mote.y < -10) {
        mote.y = h + 10;
        mote.x = Math.random() * w;
      }
      if (mote.x < -10) mote.x = w + 10;
      if (mote.x > w + 10) mote.x = -10;

      const alphaPulse = mote.alpha * (0.6 + 0.4 * Math.sin(time * 2 + mote.pulseOffset));

      ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0, alphaPulse)})`;
      ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  renderTrackLine(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const steps = 40;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = this.getBeadTrackX(t);
      const y = this.getBeadTrackY(t);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  renderBeads(ctx) {
    const totalBeadsInChain = 33;
    const centerT = 0.5;
    const spacing = 0.042;
    const visibleRange = 12;

    for (let i = -visibleRange; i <= visibleRange; i++) {
      const beadIndex = Math.round(this.beadOffset) + i;
      const beadProgress = (beadIndex % totalBeadsInChain + totalBeadsInChain) % totalBeadsInChain;
      const t = centerT + (i - (this.beadOffset - Math.round(this.beadOffset))) * spacing;

      if (t < -0.05 || t > 1.05) continue;

      const x = this.getBeadTrackX(t);
      const y = this.getBeadTrackY(t);

      const distFromCenter = Math.abs(t - centerT);
      const scale = Math.max(0.65, 1.35 - distFromCenter * 2.2);
      const alpha = Math.max(0.15, 1.0 - distFromCenter * 2.4);

      const isMarker = beadProgress === 0;
      this.draw3DBead(ctx, x, y, scale, alpha, isMarker);
    }
  }

  draw3DBead(ctx, x, y, scale, alpha, isMarker) {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, Math.max(0.1, alpha));

    const radius = (isMarker ? 16 : 12.5) * scale;

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10 * scale;
    ctx.shadowOffsetY = 4 * scale;

    const grad = ctx.createRadialGradient(
      x - radius * 0.35,
      y - radius * 0.38,
      radius * 0.12,
      x,
      y,
      radius
    );

    if (isMarker) {
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.3, '#f59e0b');
      grad.addColorStop(0.8, '#b45309');
      grad.addColorStop(1, '#451a03');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#fef3c7');
      grad.addColorStop(0.65, '#d97706');
      grad.addColorStop(0.92, '#78350f');
      grad.addColorStop(1, '#291004');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Specular light ping
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x - radius * 0.32, y - radius * 0.35, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderCenterIndicator(ctx, w) {
    const cx = w * 0.5;
    const cy = this.getBeadTrackY(0.5);

    ctx.save();
    // Glassy target ring indicator
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2.0;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle pointer bead notch
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy - 32);
    ctx.lineTo(cx + 5, cy - 32);
    ctx.lineTo(cx, cy - 25);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderParticles(ctx) {
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.026;
      p.scale += 0.015;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = `rgba(254, 240, 138, ${p.alpha})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    }
    ctx.restore();
  }
}
