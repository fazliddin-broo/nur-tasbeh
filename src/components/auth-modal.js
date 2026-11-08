// Auth and User Profile Modal Component (Clean Vanilla CSS Design)
import { authService } from '../services/auth-service.js';
import { dbService } from '../services/db-service.js';
import { soundEngine } from '../services/audio-service.js';

export class AuthModal {
  constructor(onAuthSuccess) {
    this.onAuthSuccess = onAuthSuccess;
    this.modal = null;
    this.activeTab = 'signup'; // 'signup' or 'signin'
    this.init();
  }

  init() {
    this.createModalDOM();
    this.attachEvents();
    this.updateUserUI();

    // Listen to external auth changes (like login on another tab or online sync)
    authService.subscribe(() => {
      this.updateUserUI();
    });
  }

  createModalDOM() {
    let existing = document.getElementById('auth-modal');
    if (existing) existing.remove();

    this.modal = document.createElement('div');
    this.modal.id = 'auth-modal';
    this.modal.className = 'auth-modal-backdrop hidden';

    this.modal.innerHTML = `
      <div class="auth-modal-container glass-card">
        <!-- Close Button -->
        <button id="auth-modal-close" class="auth-close-btn" title="Yopish">
          <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Unauthenticated Form View -->
        <div id="auth-form-view" class="auth-view-content">
          <div class="auth-header-center">
            <div class="auth-badge-icon flex items-center justify-center mb-1">
              <img src="/icons/icon-192.png" alt="Nur Tasbeh Logo" class="w-16 h-16 rounded-2xl shadow-2xl ring-1 ring-amber-400/40 object-cover" />
            </div>
            <h3 id="auth-modal-title" class="auth-title-text">Nur Tasbeh Akounti</h3>
            <p class="auth-subtitle-text">
              Telefon va noutbukingizda zikrlarni bir xil sanang va yo'qotmang
            </p>
          </div>

          <!-- Auth Tabs -->
          <div class="auth-tabs-pill">
            <button id="auth-tab-signup" class="auth-tab-btn active">Ro'yxatdan o'tish</button>
            <button id="auth-tab-signin" class="auth-tab-btn">Kirish</button>
          </div>

          <!-- Error Alert Banner -->
          <div id="auth-error-alert" class="auth-alert-box hidden">
            <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="auth-error-text" class="auth-alert-message"></span>
          </div>

          <!-- Form Fields -->
          <form id="auth-form" class="auth-form-body" onsubmit="return false;">
            <!-- Nickname -->
            <div class="auth-field-group">
              <label for="auth-input-nickname" class="auth-label">O'zingizga Nickname tanlang:</label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">@</span>
                <input 
                  type="text" 
                  id="auth-input-nickname" 
                  class="auth-input" 
                  placeholder="masalan: muad'dib" 
                  autocomplete="username"
                  required 
                />
              </div>
            </div>

            <!-- Password -->
            <div class="auth-field-group">
              <label for="auth-input-password" class="auth-label">Parol (kamida 8 ta belgi):</label>
              <div class="auth-input-wrapper">
                <input 
                  type="password" 
                  id="auth-input-password" 
                  class="auth-input auth-input-pwd" 
                  placeholder="••••••••" 
                  autocomplete="current-password"
                  required 
                />
                <button type="button" id="auth-toggle-pwd" class="auth-pwd-toggle" title="Parolni ko'rsatish">
                  <svg id="auth-eye-icon" class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
              </div>
              <div id="auth-pwd-hint" class="auth-pwd-meter">
                <span id="auth-pwd-indicator-dot" class="auth-meter-dot"></span>
                <span id="auth-pwd-indicator-text">Kamida 8 ta belgi kiriting</span>
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="auth-submit-btn" class="auth-submit-btn">
              <span id="auth-submit-text">Akount yaratish</span>
              <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </button>
          </form>
        </div>

        <!-- Authenticated Profile View (Clean, Luxurious Glass Card) -->
        <div id="auth-profile-view" class="auth-view-content hidden">
          <!-- Top Avatar & Name Section -->
          <div class="profile-header-center">
            <div id="profile-avatar-circle" class="profile-avatar-large">
              <span id="profile-avatar-initial" class="profile-avatar-letter">M</span>
            </div>
            <h3 id="profile-display-name" class="profile-name-text">Muad'dib</h3>
            <div class="profile-handle-badge">
              <span id="profile-nickname-handle">@muad'dib</span>
            </div>
          </div>

          <!-- Stats Overview Card -->
          <div class="profile-stats-card">
            <div class="profile-stats-row">
              <div class="profile-stats-left">
                <span class="profile-stats-label">Jami aytilgan zikrlar</span>
                <div class="profile-stats-number-wrap">
                  <span id="profile-total-zikrs" class="profile-stats-number">0</span>
                  <span class="profile-stats-unit">ta</span>
                </div>
              </div>
              <div class="profile-stats-icon-badge">
                <svg class="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>

            <div class="profile-sync-divider"></div>

            <div class="profile-sync-status-row">
              <span class="profile-sync-text">Qurilmalararo holat:</span>
              <span class="profile-sync-badge-pill">
                <span class="profile-sync-pulse-dot"></span>
                <span>Doimiy sinxronlash faol</span>
              </span>
            </div>
          </div>

          <!-- Friendly Explanation Note -->
          <p class="profile-info-note">
            Siz ushbu akountingiz orqali telefon va kompyuteringizda bir xil hisobni davom ettirasiz. Internet yo'q joyda ham zikrlar xavfsiz saqlanadi va carry-over bo'ladi.
          </p>

          <!-- Sign Out Button -->
          <button id="auth-signout-btn" class="profile-signout-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Akountdan chiqish</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  attachEvents() {
    // Close modal
    const closeBtn = document.getElementById('auth-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Tab switcher (Sign Up vs Sign In)
    const tabSignup = document.getElementById('auth-tab-signup');
    const tabSignin = document.getElementById('auth-tab-signin');
    const submitText = document.getElementById('auth-submit-text');

    if (tabSignup && tabSignin) {
      tabSignup.addEventListener('click', () => {
        this.activeTab = 'signup';
        tabSignup.classList.add('active');
        tabSignin.classList.remove('active');
        if (submitText) submitText.textContent = "Akount yaratish";
        this.hideError();
      });

      tabSignin.addEventListener('click', () => {
        this.activeTab = 'signin';
        tabSignin.classList.add('active');
        tabSignup.classList.remove('active');
        if (submitText) submitText.textContent = "Tizimga kirish";
        this.hideError();
      });
    }

    // Password visibility toggle
    const pwdToggle = document.getElementById('auth-toggle-pwd');
    const pwdInput = document.getElementById('auth-input-password');
    if (pwdToggle && pwdInput) {
      pwdToggle.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
      });
    }

    // Password validation indicator
    if (pwdInput) {
      pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        const dot = document.getElementById('auth-pwd-indicator-dot');
        const text = document.getElementById('auth-pwd-indicator-text');
        if (!dot || !text) return;

        if (val.length === 0) {
          dot.className = 'auth-meter-dot';
          text.textContent = 'Kamida 8 ta belgi kiriting';
          text.style.color = 'rgba(255, 255, 255, 0.4)';
        } else if (val.length < 8) {
          dot.className = 'auth-meter-dot warning';
          text.textContent = `${val.length}/8 ta belgi kiritildi`;
          text.style.color = '#fbbf24';
        } else {
          dot.className = 'auth-meter-dot success';
          text.textContent = `Parol mos keladi (${val.length} ta belgi) ✓`;
          text.style.color = '#34d399';
        }
      });
    }

    // Form submit
    const submitBtn = document.getElementById('auth-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.handleSubmit());
    }

    const form = document.getElementById('auth-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    // Sign out button
    const signoutBtn = document.getElementById('auth-signout-btn');
    if (signoutBtn) {
      signoutBtn.addEventListener('click', () => {
        authService.signOut();
        this.updateUserUI();
        this.close();
      });
    }

    // Top Navigation Account Pill Click
    const navAccountBtn = document.getElementById('nav-btn-account');
    if (navAccountBtn) {
      navAccountBtn.addEventListener('click', () => {
        this.open();
      });
    }
  }

  async handleSubmit() {
    const nickInput = document.getElementById('auth-input-nickname');
    const pwdInput = document.getElementById('auth-input-password');
    const submitBtn = document.getElementById('auth-submit-btn');

    const nickname = (nickInput ? nickInput.value : '').trim();
    const password = pwdInput ? pwdInput.value : '';

    this.hideError();

    if (!nickname) {
      this.showError("Iltimos, o'zingizga nickname tanlang.");
      return;
    }
    if (!password) {
      this.showError("Iltimos, parolni kiriting.");
      return;
    }
    if (this.activeTab === 'signup' && password.length < 8) {
      this.showError("Parol kamida 8 ta belgidan iborat bo'lishi shart!");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.6';
    }

    try {
      if (this.activeTab === 'signup') {
        await authService.signUp(nickname, password);
      } else {
        await authService.signIn(nickname, password);
      }

      soundEngine.playSoftTap();
      this.updateUserUI();
      if (this.onAuthSuccess) {
        this.onAuthSuccess();
      }
      this.close();
    } catch (err) {
      this.showError(err.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
      }
    }
  }

  showError(msg) {
    const alert = document.getElementById('auth-error-alert');
    const text = document.getElementById('auth-error-text');
    if (alert && text) {
      text.textContent = msg;
      alert.classList.remove('hidden');
    }
  }

  hideError() {
    const alert = document.getElementById('auth-error-alert');
    if (alert) alert.classList.add('hidden');
  }

  open() {
    this.updateUserUI();
    this.hideError();
    if (this.modal) {
      this.modal.classList.remove('hidden');
    }
  }

  close() {
    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  updateUserUI() {
    const isLogged = authService.isLoggedIn();
    const user = authService.getCurrentUser();

    // Toggle Form vs Profile View in Modal
    const formView = document.getElementById('auth-form-view');
    const profileView = document.getElementById('auth-profile-view');

    if (formView && profileView) {
      formView.classList.toggle('hidden', isLogged);
      profileView.classList.toggle('hidden', !isLogged);
    }

    // If logged in, populate profile card
    if (isLogged && user) {
      const nameEl = document.getElementById('profile-display-name');
      const nickEl = document.getElementById('profile-nickname-handle');
      const initialEl = document.getElementById('profile-avatar-initial');
      const totalEl = document.getElementById('profile-total-zikrs');

      if (nameEl) nameEl.textContent = user.displayName || user.nickname;
      if (nickEl) nickEl.textContent = '@' + user.nickname;
      if (initialEl) initialEl.textContent = (user.displayName || user.nickname).charAt(0).toUpperCase();
      if (totalEl) totalEl.textContent = dbService.getTotalCount().toLocaleString();
    }

    // Update Top Navigation Account Button
    const statusText = document.getElementById('user-display-status');
    const syncDot = document.getElementById('sync-dot-indicator');
    if (statusText) {
      if (isLogged && user) {
        statusText.textContent = user.displayName || user.nickname;
      } else {
        statusText.textContent = "Kirish";
      }
    }
    if (syncDot) {
      syncDot.className = isLogged ? 'sync-dot-online' : 'sync-dot-offline';
    }
  }
}
