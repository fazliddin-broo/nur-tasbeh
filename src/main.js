// Main Controller and View Router
import { TasbihEngine } from './components/tasbih-canvas.js';
import { ZikrSelector } from './components/zikr-selector.js';
import { VideoFeed } from './components/video-feed.js';
import { AuthModal } from './components/auth-modal.js';
import { soundEngine } from './services/audio-service.js';
import { dbService } from './services/db-service.js';
import { authService } from './services/auth-service.js';
import { notificationService } from './services/notification-service.js';
import { ALLAH_99_NAMES } from './data/names-of-allah.js';
import { ASMA_UL_HUSNA_SEQUENTIAL } from './data/zikr-data.js';

class NurTasbihApp {
  constructor() {
    this.canvas = document.getElementById('tasbih-canvas');
    this.tasbihEngine = null;
    this.zikrSelector = null;
    this.videoFeed = null;
    this.authModal = null;
    this.currentView = 'tasbeh';
    this.activeZikr = null;

    this.init();
  }

  async init() {
    // 1. Initialize notification system
    notificationService.init();

    // 2. Register Service Worker for PWA (with instant update handling)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          reg.update();
        }).catch(err => {
          console.warn('SW registration info:', err);
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      });
    }

    // 3. Setup initial zikr data
    const allZikrs = dbService.getAllZikrs();
    const activeZikrId = dbService.getActiveZikrId();
    this.activeZikr = allZikrs.find(z => z.id === activeZikrId) || allZikrs[0];

    // 4. Initialize Dual-Mode Tasbih Physics & Canvas Engine
    this.tasbihEngine = new TasbihEngine(
      this.canvas,
      (count, target) => this.onCountUpdate(count, target),
      (count, target) => this.onMilestoneReached(count, target)
    );

    // 5. Initialize Components
    this.zikrSelector = new ZikrSelector((selectedZikr) => {
      this.setActiveZikr(selectedZikr);
    });

    const videoRoot = document.getElementById('video-feed-root');
    this.videoFeed = new VideoFeed(videoRoot);

    this.authModal = new AuthModal(() => {
      // On login/signup success, reload user's counts
      const currentActiveId = dbService.getActiveZikrId();
      const current = dbService.getAllZikrs().find(z => z.id === currentActiveId) || this.activeZikr;
      this.setActiveZikr(current);
      notificationService.showToast("Zikrlaringiz hisobi muvaffaqiyatli yuklandi 🟢", 'info');
    });

    // 6. Set initial active zikr
    this.setActiveZikr(this.activeZikr);

    // 7. Attach Navigation, Fullscreen Tap, Mode Switcher, and Controls
    this.setupNavigation();
    this.setupTasbihControls();
    this.setupModeSwitcher();
    this.setupFullscreenTap();
    this.setupSafariPrompt();
  }

  setActiveZikr(zikr) {
    this.activeZikr = zikr;
    dbService.setActiveZikrId(zikr.id);
    const count = dbService.getCount(zikr.id);

    const asmaBadgeBox = document.getElementById('asma-badge-box');
    if (asmaBadgeBox) {
      asmaBadgeBox.classList.toggle('hidden', !zikr.isAsmaUlHusna);
    }

    // Update Mode Switcher tab active states
    const btnModeZikr = document.getElementById('btn-mode-zikr');
    const btnModeAsma = document.getElementById('btn-mode-asma');
    if (btnModeZikr && btnModeAsma) {
      btnModeZikr.classList.toggle('active', !zikr.isAsmaUlHusna);
      btnModeAsma.classList.toggle('active', !!zikr.isAsmaUlHusna);
    }

    const target = zikr.isAsmaUlHusna ? 99 : (zikr.target || 100);
    document.getElementById('target-pill-value').textContent = target;

    // Update DOM text first, then update canvas physics metrics
    this.onCountUpdate(count, target);
    this.tasbihEngine.setZikr(zikr, count);
  }

  setupModeSwitcher() {
    const btnModeZikr = document.getElementById('btn-mode-zikr');
    const btnModeAsma = document.getElementById('btn-mode-asma');

    if (btnModeZikr) {
      btnModeZikr.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEngine.playSoftTap();
        if (this.activeZikr && this.activeZikr.isAsmaUlHusna) {
          const coreZikrs = dbService.getAllZikrs();
          const firstCore = coreZikrs.find(z => !z.isAsmaUlHusna) || coreZikrs[0];
          this.setActiveZikr(firstCore);
        } else {
          // Open pure zikr catalog
          this.zikrSelector.open('all');
        }
      });
    }

    if (btnModeAsma) {
      btnModeAsma.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEngine.playSoftTap();
        this.setActiveZikr(ASMA_UL_HUSNA_SEQUENTIAL);
      });
    }
  }

  onCountUpdate(count, target) {
    const countEl = document.getElementById('active-count-text');
    const targetEl = document.getElementById('active-target-text');
    const progressBar = document.getElementById('counter-progress-bar');

    if (countEl) countEl.textContent = count.toLocaleString();
    if (targetEl) targetEl.textContent = `/ ${target.toLocaleString()}`;

    // SVG Progress Bar Stroke
    if (progressBar) {
      const circumference = 2 * Math.PI * 44; // 276.46
      const progress = target > 0 ? (count % target) / target : 0;
      const offset = circumference - (progress * circumference);
      progressBar.style.strokeDasharray = `${circumference}`;
      progressBar.style.strokeDashoffset = `${offset}`;
    }

    // Dynamic Asma ul-Husna sequential name rotation (1 to 99)
    if (this.activeZikr && this.activeZikr.isAsmaUlHusna) {
      const currentNameIdx = (count % 99);
      const nameData = ALLAH_99_NAMES[currentNameIdx] || ALLAH_99_NAMES[0];

      const currentNumEl = document.getElementById('asma-current-num');
      if (currentNumEl) currentNumEl.textContent = nameData.id;

      const arabicEl = document.getElementById('zikr-arabic');
      const transEl = document.getElementById('zikr-transliteration');
      const meanEl = document.getElementById('zikr-meaning');

      if (arabicEl) arabicEl.textContent = nameData.arabic;
      if (transEl) transEl.textContent = `${nameData.id}. ${nameData.transliteration}`;
      if (meanEl) meanEl.textContent = nameData.meaning;
    } else if (this.activeZikr) {
      const arabicEl = document.getElementById('zikr-arabic');
      const transEl = document.getElementById('zikr-transliteration');
      const meanEl = document.getElementById('zikr-meaning');

      if (arabicEl) arabicEl.textContent = this.activeZikr.arabic;
      if (transEl) transEl.textContent = this.activeZikr.transliteration;
      if (meanEl) meanEl.textContent = this.activeZikr.meaning;
    }
  }

  onMilestoneReached(count, target) {
    const blessingEl = document.getElementById('milestone-blessing');
    if (!blessingEl) return;

    let verseArabic = 'تَقَبَّلَ اللَّهُ مِنَّا وَمِنكُم';
    let verseSubtitle = '';
    
    const milestoneMod = target >= 100 ? count % 100 : count;
    if (milestoneMod === 25) {
      verseArabic = 'يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا';
      verseSubtitle = 'Surah Hud 11:52';
    } else if (milestoneMod === 50) {
      verseArabic = 'وَيَزِدْكُمْ قُوَّةً إِلَىٰ قُوَّتِكُمْ';
      verseSubtitle = 'Surah Hud 11:52';
    } else if (milestoneMod === 75) {
      verseArabic = 'يُمَتِّعْكُم مَّتَاعًا حَسَنًا';
      verseSubtitle = 'Surah Hud 11:3';
    }

    blessingEl.innerHTML = `<span class="font-arabic text-emerald-300 text-base drop-shadow-md">${verseArabic}</span>${verseSubtitle ? `<span class="block text-[10px] text-white/60 tracking-wider uppercase mt-0.5">${verseSubtitle}</span>` : ''}`;

    blessingEl.classList.remove('hidden');
    blessingEl.style.animation = 'none';
    blessingEl.offsetHeight; // trigger reflow
    blessingEl.style.animation = null;

    setTimeout(() => {
      blessingEl.classList.add('hidden');
    }, 2800);
  }

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn:not(.account-pill-btn)');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetView = btn.getAttribute('data-target');
        soundEngine.playSoftTap();
        this.switchView(targetView);
      });
    });
  }

  switchView(viewName) {
    if (viewName === 'zikrlar') {
      this.zikrSelector.open('all');
      return;
    }

    this.currentView = viewName;

    // Update nav tab buttons
    document.querySelectorAll('.nav-tab-btn:not(.account-pill-btn)').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === viewName);
    });

    // Views mapping
    const views = {
      tasbeh: document.getElementById('view-tasbeh'),
      videolar: document.getElementById('view-videolar')
    };

    Object.keys(views).forEach(key => {
      if (views[key]) {
        if (key === viewName) {
          views[key].classList.remove('hidden');
          views[key].classList.add('active');
        } else {
          views[key].classList.add('hidden');
          views[key].classList.remove('active');
        }
      }
    });

    // Control canvas bead rendering: only show beads in Tasbeh view
    if (this.tasbihEngine) {
      this.tasbihEngine.setVisible(viewName === 'tasbeh');
    }
  }

  // Sensitive Screen Tapping: Any tap on empty screen area counts!
  setupFullscreenTap() {
    const tasbehView = document.getElementById('view-tasbeh');
    if (!tasbehView) return;

    tasbehView.addEventListener('click', (e) => {
      // Ignore if clicking on interactive controls or modals
      const isInteractive = e.target.closest('button, a, input, select, textarea, .ctrl-btn, .nav-tab-btn, .zikr-drawer-modal, .active-zikr-header, .tasbeh-mode-switcher, .auth-modal-container');
      if (isInteractive) return;

      // Click is on background / empty area -> increment count!
      this.tasbihEngine.increment();
    });
  }

  setupTasbihControls() {
    // Header click to open clean zikr drawer
    const zikrBox = document.getElementById('active-zikr-box');
    if (zikrBox) {
      zikrBox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.zikrSelector.open('all');
      });
    }

    // Counter ring click -> increment
    const ringBox = document.getElementById('counter-ring-box');
    if (ringBox) {
      ringBox.addEventListener('click', (e) => {
        e.stopPropagation();
        this.tasbihEngine.increment();
      });
    }

    // Reset button
    const resetBtn = document.getElementById('btn-reset-count');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEngine.playSoftTap();
        if (confirm("Hisoblagichni qayta nollashni istaysizmi?")) {
          this.tasbihEngine.reset();
        }
      });
    }

    // Target cycle button
    const targetCycleBtn = document.getElementById('btn-target-cycle');
    if (targetCycleBtn) {
      targetCycleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        soundEngine.playSoftTap();
        
        if (this.activeZikr && this.activeZikr.isAsmaUlHusna) {
          notificationService.showToast("99 ism uchun mo'ljal 99 ta belgilangan", 'info');
          return;
        }

        const currentTarget = this.tasbihEngine.target;
        const userInput = prompt("Zikr uchun mo'ljal sonini kiriting (masalan: 33, 100, 500, 1000, 40000):", currentTarget);

        if (userInput !== null) {
          const parsed = parseInt(userInput.replace(/\s+/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) {
            document.getElementById('target-pill-value').textContent = parsed.toLocaleString();
            this.tasbihEngine.setTarget(parsed);
            notificationService.showToast(`Yangi mo'ljal: ${parsed.toLocaleString()} ta belgilandi 🎯`, 'info');
            return;
          }
        }

        // Quick cycling fallback if user leaves empty or presses OK on default
        const presets = [33, 99, 100, 300, 1000];
        const nextIdx = (presets.indexOf(currentTarget) + 1) % presets.length;
        const nextTarget = presets[nextIdx] || 100;
        document.getElementById('target-pill-value').textContent = nextTarget;
        this.tasbihEngine.setTarget(nextTarget);
      });
    }

    // Sound toggle button
    const soundBtn = document.getElementById('btn-sound-toggle');
    const iconOn = document.getElementById('icon-sound-on');
    const iconOff = document.getElementById('icon-sound-off');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isEnabled = soundEngine.toggleSound();
        iconOn.classList.toggle('hidden', !isEnabled);
        iconOff.classList.toggle('hidden', isEnabled);
        notificationService.showToast(isEnabled ? "Ovoz yoqildi" : "Ovoz o'chirildi", 'info');
      });
    }

    // Notification request prompt
    const notifBtn = document.getElementById('btn-notification-prompt');
    if (notifBtn) {
      notifBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        soundEngine.playSoftTap();
        await notificationService.requestPermission();
      });
    }
  }

  setupSafariPrompt() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone === true;
    const tip = document.getElementById('safari-pwa-tip');
    const closeTip = document.getElementById('close-safari-tip');

    if (isIOS && !isStandalone && tip) {
      setTimeout(() => {
        tip.classList.remove('hidden');
      }, 3000);
    }

    if (closeTip && tip) {
      closeTip.addEventListener('click', () => {
        tip.classList.add('hidden');
      });
    }
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  new NurTasbihApp();
});
