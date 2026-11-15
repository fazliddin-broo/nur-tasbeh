// ============================================================================
// Auth & User Profile Modal — Standard Modern App Login / Sign Up / Profile
// ============================================================================
import { authService } from '../services/auth-service.js';
import { dbService } from '../services/db-service.js';
import { soundEngine } from '../services/audio-service.js';
import { notificationService } from '../services/notification-service.js';

const EYE_OPEN = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>';
const EYE_OFF = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>';

export class AuthModal {
  constructor(onAuthChange) {
    this.onAuthChange = onAuthChange;
    this.modal = null;
    this.mode = 'signin'; // 'signin' | 'signup' | 'reset'
    this.busy = false;
    this.editOpen = false;
    this.init();
  }

  init() {
    this.createModalDOM();
    this.attachEvents();
    this.updateUserUI();
    authService.subscribe(() => this.updateUserUI());
  }

  $(id) {
    return document.getElementById(id);
  }

  createModalDOM() {
    const existing = this.$('auth-modal');
    if (existing) existing.remove();

    this.modal = document.createElement('div');
    this.modal.id = 'auth-modal';
    this.modal.className = 'auth-modal-backdrop hidden';
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');

    this.modal.innerHTML = `
      <div class="auth-modal-container glass-card">
        <button type="button" id="auth-modal-close" class="auth-close-btn" aria-label="Yopish">
          <svg class="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- ============ SIGN IN / SIGN UP / PASSWORD RESET ============ -->
        <div id="auth-form-view" class="auth-view-content">
          <div class="auth-header-center">
            <div class="auth-logo-wrap">
              <img src="/icons/icon-192.png" alt="Nur Tasbeh" class="auth-logo-img" />
            </div>
            <h3 id="auth-modal-title" class="auth-title-text">Tizimga kirish</h3>
            <p id="auth-modal-subtitle" class="auth-subtitle-text">Akkauntingizga kiring va zikrlaringizni davom ettiring</p>
          </div>

          <!-- Mode Tabs -->
          <div id="auth-tabs-bar" class="auth-tabs-pill" role="tablist">
            <button type="button" id="auth-tab-signin" class="auth-tab-btn active" role="tab">Kirish</button>
            <button type="button" id="auth-tab-signup" class="auth-tab-btn" role="tab">Ro'yxatdan o'tish</button>
          </div>

          <!-- Quick Saved Accounts Picker (shown in Sign In mode when accounts exist) -->
          <div id="auth-saved-wrap" class="auth-saved-wrap hidden">
            <span class="auth-saved-label">Saqlangan akkauntlar:</span>
            <div id="auth-saved-list" class="auth-saved-list"></div>
          </div>

          <!-- Error / Info Alert Banner -->
          <div id="auth-error-alert" class="auth-alert-box hidden" role="alert">
            <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="auth-error-text" class="auth-alert-message"></span>
          </div>

          <form id="auth-form" class="auth-form-body" novalidate>
            <!-- Display Name (Sign Up only) -->
            <div id="auth-name-group" class="auth-field-group hidden">
              <label for="auth-input-name" class="auth-label">Ismingiz</label>
              <div class="auth-input-wrapper">
                <input type="text" id="auth-input-name" class="auth-input auth-input-plain" placeholder="Masalan: Fazliddin"
                  autocomplete="name" maxlength="32" />
              </div>
            </div>

            <!-- Nickname / Login -->
            <div class="auth-field-group">
              <label for="auth-input-nickname" class="auth-label">Login (Nickname)</label>
              <div class="auth-input-wrapper">
                <span class="auth-input-icon">@</span>
                <input type="text" id="auth-input-nickname" class="auth-input" placeholder="username"
                  autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="24" />
              </div>
              <p id="auth-nick-hint" class="auth-field-hint hidden">Lotin harflari, raqamlar, «_» yoki «.» (3–24 ta belgi)</p>
            </div>

            <!-- Password -->
            <div class="auth-field-group">
              <div class="auth-label-row">
                <label id="auth-password-label" for="auth-input-password" class="auth-label">Parol</label>
                <button type="button" id="auth-forgot-btn" class="auth-forgot-link">Parolni unutdingizmi?</button>
              </div>
              <div class="auth-input-wrapper">
                <input type="password" id="auth-input-password" class="auth-input auth-input-pwd" placeholder="••••••••"
                  autocomplete="current-password" />
                <button type="button" class="auth-pwd-toggle" data-target="auth-input-password" aria-label="Parolni ko'rsatish">
                  <svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">${EYE_OPEN}</svg>
                </button>
              </div>
              <div id="auth-pwd-hint" class="auth-pwd-meter hidden">
                <span id="auth-pwd-indicator-dot" class="auth-meter-dot"></span>
                <span id="auth-pwd-indicator-text">Kamida 6 ta belgi</span>
              </div>
            </div>

            <!-- Confirm Password (Sign Up & Reset only) -->
            <div id="auth-confirm-group" class="auth-field-group hidden">
              <label for="auth-input-confirm" class="auth-label">Parolni tasdiqlang</label>
              <div class="auth-input-wrapper">
                <input type="password" id="auth-input-confirm" class="auth-input auth-input-pwd" placeholder="••••••••"
                  autocomplete="new-password" />
                <button type="button" class="auth-pwd-toggle" data-target="auth-input-confirm" aria-label="Parolni ko'rsatish">
                  <svg class="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">${EYE_OPEN}</svg>
                </button>
              </div>
            </div>

            <button type="submit" id="auth-submit-btn" class="auth-submit-btn">
              <span id="auth-submit-spinner" class="auth-spinner hidden"></span>
              <span id="auth-submit-text">Kirish</span>
            </button>
          </form>

          <p class="auth-switch-text">
            <span id="auth-switch-label">Akkauntingiz yo'qmi?</span>
            <button type="button" id="auth-switch-btn" class="auth-switch-link">Ro'yxatdan o'tish</button>
          </p>
        </div>

        <!-- ============ AUTHENTICATED PROFILE VIEW ============ -->
        <div id="auth-profile-view" class="auth-view-content hidden">
          <div class="profile-header-center">
            <div class="profile-avatar-large">
              <span id="profile-avatar-initial" class="profile-avatar-letter">N</span>
            </div>
            <h3 id="profile-display-name" class="profile-name-text"></h3>
            <div class="profile-handle-badge"><span id="profile-nickname-handle"></span></div>
          </div>

          <!-- 3-Column Stats Summary -->
          <div class="profile-stats-card">
            <div class="profile-metrics-grid">
              <div class="profile-metric-box">
                <span class="profile-metric-val" id="profile-today-zikrs">0</span>
                <span class="profile-metric-lbl">Bugun</span>
              </div>
              <div class="profile-metric-divider"></div>
              <div class="profile-metric-box">
                <span class="profile-metric-val profile-metric-highlight" id="profile-total-zikrs">0</span>
                <span class="profile-metric-lbl">Jami zikrlar</span>
              </div>
              <div class="profile-metric-divider"></div>
              <div class="profile-metric-box">
                <span class="profile-metric-val" id="profile-streak-days">1 kun</span>
                <span class="profile-metric-lbl">Faol seriya</span>
              </div>
            </div>

            <div class="profile-sync-divider"></div>

            <div class="profile-sync-status-row">
              <span class="profile-sync-text">Akkaunt holati:</span>
              <span id="profile-sync-pill" class="profile-sync-badge-pill" data-tone="ok">
                <span class="profile-sync-pulse-dot"></span>
                <span id="profile-sync-label">Faol • Saqlangan</span>
              </span>
            </div>
          </div>

          <!-- Toggle Edit Profile Section -->
          <button type="button" id="profile-edit-toggle-btn" class="profile-secondary-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            <span>Profil va parolni tahrirlash</span>
          </button>

          <!-- Collapsible Edit Profile Form -->
          <form id="profile-edit-form" class="profile-edit-box hidden" novalidate>
            <div class="auth-field-group">
              <label for="profile-edit-name" class="auth-label">Ismingiz</label>
              <input type="text" id="profile-edit-name" class="auth-input auth-input-plain" placeholder="Ismingiz" maxlength="32" />
            </div>
            <div class="auth-field-group">
              <label for="profile-edit-pwd" class="auth-label">Yangi parol (o'zgartirish uchun)</label>
              <input type="password" id="profile-edit-pwd" class="auth-input auth-input-plain" placeholder="Bo'sh qoldirsangiz o'zgarmaydi" autocomplete="new-password" />
            </div>
            <div class="profile-edit-actions">
              <button type="button" id="profile-edit-cancel" class="profile-cancel-btn">Bekor qilish</button>
              <button type="submit" class="profile-save-btn">Saqlash</button>
            </div>
          </form>

          <!-- Sign Out Button -->
          <button type="button" id="auth-signout-btn" class="profile-signout-btn">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            <span>Akkauntdan chiqish</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.modal);
  }

  attachEvents() {
    this.$('auth-modal-close').addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) this.close();
    });

    this.$('auth-tab-signin').addEventListener('click', () => this.setMode('signin'));
    this.$('auth-tab-signup').addEventListener('click', () => this.setMode('signup'));
    this.$('auth-forgot-btn').addEventListener('click', () => this.setMode('reset'));
    this.$('auth-switch-btn').addEventListener('click', () => {
      if (this.mode === 'signin') this.setMode('signup');
      else this.setMode('signin');
    });

    // Show / hide password
    this.modal.querySelectorAll('.auth-pwd-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = this.$(btn.dataset.target);
        if (!input) return;
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.querySelector('svg').innerHTML = show ? EYE_OFF : EYE_OPEN;
      });
    });

    // Live password meter
    this.$('auth-input-password').addEventListener('input', () => this.updatePasswordHint());

    // Clear error banner on input
    ['auth-input-name', 'auth-input-nickname', 'auth-input-password', 'auth-input-confirm'].forEach(id => {
      const el = this.$(id);
      if (el) el.addEventListener('input', () => this.hideError());
    });

    // Single form submit handler
    this.$('auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Edit profile toggle & save
    this.$('profile-edit-toggle-btn').addEventListener('click', () => {
      this.toggleEditProfile(!this.editOpen);
    });
    this.$('profile-edit-cancel').addEventListener('click', () => {
      this.toggleEditProfile(false);
    });
    this.$('profile-edit-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProfileSave();
    });

    // Sign out
    this.$('auth-signout-btn').addEventListener('click', () => this.handleSignOut());

    // Top Navigation Account Button
    const navAccountBtn = this.$('nav-btn-account');
    if (navAccountBtn) navAccountBtn.addEventListener('click', () => this.open());
  }

  toggleEditProfile(open) {
    this.editOpen = open;
    const form = this.$('profile-edit-form');
    const toggleBtn = this.$('profile-edit-toggle-btn');
    if (!form || !toggleBtn) return;

    form.classList.toggle('hidden', !open);
    toggleBtn.classList.toggle('hidden', open);

    if (open) {
      const user = authService.getCurrentUser();
      this.$('profile-edit-name').value = user ? (user.displayName || '') : '';
      this.$('profile-edit-pwd').value = '';
      this.$('profile-edit-name').focus();
    }
  }

  async handleProfileSave() {
    const displayName = this.$('profile-edit-name').value.trim();
    const newPassword = this.$('profile-edit-pwd').value;

    try {
      await authService.updateProfile({ displayName, newPassword });
      soundEngine.playSoftTap();
      this.toggleEditProfile(false);
      this.updateUserUI();
      notificationService.showToast(
        newPassword ? "Profil va parol yangilandi ✓" : "Profil ma'lumotlari saqlandi ✓",
        'info'
      );
    } catch (err) {
      notificationService.showToast(err.message || "Xatolik yuz berdi", 'info');
    }
  }

  renderSavedAccounts() {
    const wrap = this.$('auth-saved-wrap');
    const list = this.$('auth-saved-list');
    if (!wrap || !list) return;

    const accounts = authService.getSavedAccounts();
    if (this.mode !== 'signin' || accounts.length === 0) {
      wrap.classList.add('hidden');
      return;
    }

    wrap.classList.remove('hidden');
    list.innerHTML = accounts.slice(0, 4).map(acc => `
      <button type="button" class="auth-saved-chip" data-nick="${acc.nickname}">
        <span class="auth-saved-avatar">${(acc.displayName || acc.nickname).charAt(0).toUpperCase()}</span>
        <span class="auth-saved-name">@${acc.nickname}</span>
      </button>
    `).join('');

    list.querySelectorAll('.auth-saved-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const nick = chip.getAttribute('data-nick') || '';
        this.$('auth-input-nickname').value = nick;
        this.hideError();
        this.$('auth-input-password').focus();
      });
    });
  }

  setMode(mode, { keepNick = true } = {}) {
    this.mode = mode;
    const isSignin = mode === 'signin';
    const isSignup = mode === 'signup';
    const isReset = mode === 'reset';

    this.$('auth-tabs-bar').classList.toggle('hidden', isReset);
    this.$('auth-tab-signin').classList.toggle('active', isSignin);
    this.$('auth-tab-signup').classList.toggle('active', isSignup);

    if (isSignin) {
      this.$('auth-modal-title').textContent = 'Tizimga kirish';
      this.$('auth-modal-subtitle').textContent = 'Akkauntingizga kiring va zikrlaringizni davom ettiring';
      this.$('auth-password-label').textContent = 'Parol';
      this.$('auth-submit-text').textContent = 'Kirish';
      this.$('auth-switch-label').textContent = "Akkauntingiz yo'qmi?";
      this.$('auth-switch-btn').textContent = "Ro'yxatdan o'tish";
    } else if (isSignup) {
      this.$('auth-modal-title').textContent = "Ro'yxatdan o'tish";
      this.$('auth-modal-subtitle').textContent = 'Yangi akkaunt yarating — barcha zikrlaringiz saqlanib boradi';
      this.$('auth-password-label').textContent = 'Parol';
      this.$('auth-submit-text').textContent = "Ro'yxatdan o'tish";
      this.$('auth-switch-label').textContent = 'Akkauntingiz bormi?';
      this.$('auth-switch-btn').textContent = 'Kirish';
    } else {
      this.$('auth-modal-title').textContent = 'Parolni tiklash';
      this.$('auth-modal-subtitle').textContent = "Loginingizni kiriting va yangi parol o'rnating";
      this.$('auth-password-label').textContent = 'Yangi parol';
      this.$('auth-submit-text').textContent = 'Parolni yangilash';
      this.$('auth-switch-label').textContent = 'Esingizga tushdimi?';
      this.$('auth-switch-btn').textContent = 'Kirishga qaytish';
    }

    this.$('auth-name-group').classList.toggle('hidden', !isSignup);
    this.$('auth-forgot-btn').classList.toggle('hidden', !isSignin);
    this.$('auth-confirm-group').classList.toggle('hidden', isSignin);
    this.$('auth-nick-hint').classList.toggle('hidden', !isSignup);
    this.$('auth-pwd-hint').classList.toggle('hidden', isSignin);
    this.$('auth-input-password').setAttribute('autocomplete', isSignin ? 'current-password' : 'new-password');

    if (!keepNick) {
      this.$('auth-input-nickname').value = '';
      this.$('auth-input-name').value = '';
    }
    this.$('auth-input-password').value = '';
    this.$('auth-input-confirm').value = '';
    this.updatePasswordHint();
    this.renderSavedAccounts();
    this.hideError();
  }

  updatePasswordHint() {
    const val = this.$('auth-input-password').value;
    const dot = this.$('auth-pwd-indicator-dot');
    const text = this.$('auth-pwd-indicator-text');
    if (!dot || !text) return;

    if (!val.length) {
      dot.className = 'auth-meter-dot';
      text.textContent = 'Kamida 6 ta belgi';
      text.style.color = 'rgba(255, 255, 255, 0.45)';
    } else if (val.length < 6) {
      dot.className = 'auth-meter-dot warning';
      text.textContent = `${val.length}/6 ta belgi`;
      text.style.color = '#fbbf24';
    } else {
      dot.className = 'auth-meter-dot success';
      text.textContent = 'Parol yaroqli ✓';
      text.style.color = '#34d399';
    }
  }

  setBusy(busy) {
    this.busy = busy;
    const btn = this.$('auth-submit-btn');
    btn.disabled = busy;
    btn.classList.toggle('is-loading', busy);
    this.$('auth-submit-spinner').classList.toggle('hidden', !busy);
  }

  async handleSubmit() {
    if (this.busy) return;
    this.hideError();

    const displayName = this.$('auth-input-name').value.trim();
    const nickname = this.$('auth-input-nickname').value.trim();
    const password = this.$('auth-input-password').value;
    const confirmPwd = this.$('auth-input-confirm').value;

    if (!nickname) return this.showError('Iltimos, login (nickname) kiriting.', 'auth-input-nickname');
    if (!password) return this.showError('Iltimos, parolni kiriting.', 'auth-input-password');

    if (this.mode === 'signup' || this.mode === 'reset') {
      if (password.length < 6) {
        return this.showError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.", 'auth-input-password');
      }
      if (password !== confirmPwd) {
        return this.showError('Kiritilgan parollar bir-biriga mos emas.', 'auth-input-confirm');
      }
    }

    this.setBusy(true);
    try {
      const actionMode = this.mode;
      if (actionMode === 'signup') {
        await authService.signUp({ nickname, password, displayName });
      } else if (actionMode === 'reset') {
        await authService.resetPassword(nickname, password);
      } else {
        await authService.signIn(nickname, password);
      }

      soundEngine.playSoftTap();
      this.$('auth-input-password').value = '';
      this.$('auth-input-confirm').value = '';
      this.updateUserUI();
      this.close();

      const user = authService.getCurrentUser();
      const greetName = user ? (user.displayName || user.nickname) : '';
      if (actionMode === 'signup') {
        notificationService.showToast(`Xush kelibsiz, ${greetName}! Akkaunt yaratildi 🟢`, 'info');
      } else if (actionMode === 'reset') {
        notificationService.showToast("Parol muvaffaqiyatli yangilandi va tizimga kirildi 🟢", 'info');
      } else {
        notificationService.showToast(`Xush kelibsiz, ${greetName}! Zikrlaringiz yuklandi 🟢`, 'info');
      }

      if (this.onAuthChange) this.onAuthChange(actionMode);
    } catch (err) {
      this.showError(err.message || "Xatolik yuz berdi. Qaytadan urinib ko'ring.");
    } finally {
      this.setBusy(false);
    }
  }

  async handleSignOut() {
    const btn = this.$('auth-signout-btn');
    btn.disabled = true;
    try {
      await authService.signOut();
      soundEngine.playSoftTap();
      this.toggleEditProfile(false);
      this.setMode('signin', { keepNick: false });
      this.updateUserUI();
      this.close();
      notificationService.showToast("Akkauntdan chiqdingiz", 'info');
      if (this.onAuthChange) this.onAuthChange('signout');
    } finally {
      btn.disabled = false;
    }
  }

  showError(msg, focusId) {
    this.$('auth-error-text').textContent = msg;
    this.$('auth-error-alert').classList.remove('hidden');
    if (focusId && this.$(focusId)) this.$(focusId).focus();
  }

  hideError() {
    this.$('auth-error-alert').classList.add('hidden');
  }

  open() {
    this.toggleEditProfile(false);
    if (!authService.isLoggedIn()) {
      this.setMode('signin', { keepNick: true });
    }
    this.updateUserUI();
    this.hideError();
    this.modal.classList.remove('hidden');

    if (!authService.isLoggedIn()) {
      setTimeout(() => {
        const nick = this.$('auth-input-nickname');
        if (nick) (nick.value ? this.$('auth-input-password') : nick).focus();
      }, 60);
    }
  }

  close() {
    this.modal.classList.add('hidden');
    this.hideError();
  }

  updateUserUI() {
    const isLogged = authService.isLoggedIn();
    const user = authService.getCurrentUser();

    this.$('auth-form-view').classList.toggle('hidden', isLogged);
    this.$('auth-profile-view').classList.toggle('hidden', !isLogged);

    if (isLogged && user) {
      const name = user.displayName || user.nickname;
      this.$('profile-display-name').textContent = name;
      this.$('profile-nickname-handle').textContent = '@' + user.nickname;
      this.$('profile-avatar-initial').textContent = name.charAt(0).toUpperCase();

      this.$('profile-today-zikrs').textContent = dbService.getTodayCount().toLocaleString();
      this.$('profile-total-zikrs').textContent = dbService.getTotalCount().toLocaleString();
      this.$('profile-streak-days').textContent = `${dbService.getStreak()} kun`;

      const pill = this.$('profile-sync-pill');
      const label = this.$('profile-sync-label');
      if (authService.syncState === 'syncing') {
        pill.dataset.tone = 'busy';
        label.textContent = 'Sinxronlanmoqda…';
      } else {
        pill.dataset.tone = 'ok';
        label.textContent = 'Faol • Saqlangan';
      }
    } else {
      this.renderSavedAccounts();
    }

    // Top navigation account pill
    const statusText = this.$('user-display-status');
    const syncDot = this.$('sync-dot-indicator');
    if (statusText) {
      statusText.textContent = isLogged && user ? (user.displayName || user.nickname) : 'Kirish';
    }
    if (syncDot) {
      syncDot.className = isLogged ? 'sync-dot-online' : 'sync-dot-offline';
    }
  }
}
