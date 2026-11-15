// ============================================================================
// Nur Tasbeh — Unified Authentication & Account Management Service
// ============================================================================

const SESSION_KEY = 'nur_session_v2';
const LEGACY_SESSION_KEY = 'nur_auth_user';
const LOCAL_USERS_KEY = 'nur_registered_users';
const STAMP_KEY = 'nur_data_updated';

export const DATA_KEYS = {
  counts: 'nur_zikr_counts',
  dailyStats: 'nur_daily_stats'
};

const CLOUD = {
  url: (import.meta.env?.VITE_SUPABASE_URL || '').replace(/\/+$/, ''),
  key: import.meta.env?.VITE_SUPABASE_ANON_KEY || ''
};

const EMAIL_DOMAIN = 'users.nurtasbeh.app';
// Allow letters, digits, underscore, dot, hyphen, and apostrophe (e.g. muad'dib)
const NICK_RE = /^[a-z0-9_.'’-]{3,24}$/;

/** Storage key for a given base key, isolated per user (guest = no suffix). */
export function scopedKey(base, userId) {
  return userId ? `${base}::${userId}` : base;
}

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeNick(nickname) {
  return (nickname || '')
    .trim()
    .replace(/^@+/, '')
    .replace(/[’`]/g, "'")
    .toLowerCase();
}

function nickToEmail(nick) {
  const local = /^[a-z0-9_.]+$/.test(nick)
    ? nick
    : 'x' + Array.from(new TextEncoder().encode(nick)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${local}@${EMAIL_DOMAIN}`;
}

function displayNameOf(nick, customName) {
  const cleanName = (customName || '').trim();
  if (cleanName) return cleanName;
  return nick ? nick.charAt(0).toUpperCase() + nick.slice(1) : '';
}

class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

class AuthService {
  constructor() {
    this.session = null;          // { mode, user, accessToken, refreshToken, expiresAt }
    this.listeners = [];
    this.syncState = 'idle';      // idle | syncing | synced | offline | error
    this.lastSyncedAt = null;
    this._pushTimer = null;
    this._refreshing = null;

    this.loadSession();
    this.setupListeners();

    if (this.isCloudSession()) {
      setTimeout(() => this.pull(), 300);
    }
  }

  get cloudEnabled() {
    return !!(CLOUD.url && CLOUD.key);
  }

  // --------------------------------------------------------------------------
  // Session & Migration
  // --------------------------------------------------------------------------

  loadSession() {
    this.session = readJSON(SESSION_KEY);

    // Seamless one-time migration from legacy v1 session (`nur_auth_user`)
    if (!this.session) {
      const legacy = readJSON(LEGACY_SESSION_KEY);
      if (legacy && legacy.id && legacy.nickname) {
        const nick = normalizeNick(legacy.nickname);
        const users = this.getLocalUsers();
        const existingKey = Object.keys(users).find(k => normalizeNick(k) === nick);
        const record = (existingKey ? users[existingKey] : null) || {
          id: legacy.id,
          nickname: nick,
          displayName: legacy.displayName || displayNameOf(nick),
          createdAt: legacy.createdAt || new Date().toISOString()
        };
        const userId = record.id || legacy.id;
        record.id = userId;
        record.nickname = nick;
        users[nick] = record;
        if (existingKey && existingKey !== nick) delete users[existingKey];
        writeJSON(LOCAL_USERS_KEY, users);

        // Migrate any data stored inside the legacy user record or unscoped keys
        this.restoreLegacyRecordData(record, userId);
        this.moveGuestDataToUser(userId);

        this.session = {
          mode: 'local',
          user: {
            id: userId,
            nickname: nick,
            displayName: record.displayName || legacy.displayName || displayNameOf(nick),
            createdAt: record.createdAt || legacy.createdAt || new Date().toISOString()
          }
        };
        writeJSON(SESSION_KEY, this.session);
      }
    }
    localStorage.removeItem(LEGACY_SESSION_KEY);

    if (this.session && !this.session.user) {
      this.session = null;
    }
    this.syncState = this.session ? 'synced' : 'idle';
  }

  saveSession(session) {
    this.session = session;
    if (session) {
      writeJSON(SESSION_KEY, session);
      this.lastSyncedAt = new Date();
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  setupListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      if (this.isCloudSession()) this.flush();
      this.emit('status');
    });
    window.addEventListener('offline', () => {
      if (this.isCloudSession()) this.setSyncState('offline');
      else this.emit('status');
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isCloudSession()) this.pull();
      if (document.visibilityState === 'hidden' && this.isCloudSession()) this.flush();
    });

    window.addEventListener('storage', (e) => {
      if (e.key === SESSION_KEY) {
        this.loadSession();
        this.emit('session');
      }
    });
  }

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  isLoggedIn() {
    return !!this.session;
  }

  isCloudSession() {
    return !!(this.session && this.session.mode === 'cloud' && this.cloudEnabled);
  }

  getCurrentUser() {
    return this.session ? this.session.user : null;
  }

  getUserId() {
    return this.session ? this.session.user.id : null;
  }

  /** Returns list of known accounts on this device for quick 1-tap selection. */
  getSavedAccounts() {
    const users = this.getLocalUsers();
    return Object.values(users)
      .filter(u => u && u.nickname)
      .map(u => ({
        nickname: u.nickname,
        displayName: u.displayName || displayNameOf(u.nickname),
        lastLoginAt: u.lastLoginAt || u.updatedAt || u.createdAt || ''
      }))
      .sort((a, b) => (b.lastLoginAt || '').localeCompare(a.lastLoginAt || ''));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(type) {
    const user = this.getCurrentUser();
    this.listeners.forEach(fn => {
      try { fn(user, { type }); } catch (e) { console.error(e); }
    });
  }

  setSyncState(state) {
    if (this.syncState === state) return;
    this.syncState = state;
    if (state === 'synced') this.lastSyncedAt = new Date();
    this.emit('status');
  }

  // --------------------------------------------------------------------------
  // Validation
  // --------------------------------------------------------------------------

  validateNickname(nick) {
    if (!nick) throw new AuthError("Iltimos, login (nickname) kiriting.");
    if (nick.length < 3 || nick.length > 24) {
      throw new AuthError("Login 3 tadan 24 tagacha belgidan iborat bo'lishi kerak.");
    }
    if (!NICK_RE.test(nick)) {
      throw new AuthError("Loginda faqat lotin harflari, raqamlar hamda «_», «.» belgilaridan foydalaning.");
    }
  }

  validatePassword(password) {
    if (!password) throw new AuthError("Iltimos, parol kiriting.");
    if (password.length < 6) {
      throw new AuthError("Parol kamida 6 ta belgidan iborat bo'lishi kerak.");
    }
  }

  // --------------------------------------------------------------------------
  // Public API: signUp / signIn / signOut / resetPassword / updateProfile
  // --------------------------------------------------------------------------

  async signUp(nicknameOrObj, passwordArg, displayNameArg) {
    let rawNick = nicknameOrObj;
    let password = passwordArg;
    let displayName = displayNameArg;

    if (typeof nicknameOrObj === 'object' && nicknameOrObj !== null) {
      rawNick = nicknameOrObj.nickname;
      password = nicknameOrObj.password;
      displayName = nicknameOrObj.displayName;
    }

    const nick = normalizeNick(rawNick);
    this.validateNickname(nick);
    this.validatePassword(password);

    if (this.cloudEnabled) {
      await this.cloudSignUp(nick, password, displayName);
    } else {
      await this.localSignUp(nick, password, displayName);
    }

    // Carry over any zikrs counted while in guest mode into the new account
    this.mergeGuestDataIntoUser(this.getUserId());
    this.touchStamp();
    this.syncLocalUserSnapshot();

    if (this.isCloudSession()) {
      await this.push().catch(() => {});
    }

    this.emit('session');
    return this.getCurrentUser();
  }

  async signIn(nickname, password) {
    const nick = normalizeNick(nickname);
    if (!nick) throw new AuthError("Iltimos, login (nickname) kiriting.");
    if (!password) throw new AuthError("Iltimos, parolni kiriting.");

    if (this.cloudEnabled) {
      await this.cloudSignIn(nick, password);
      await this.pull({ silent: true });
    } else {
      await this.localSignIn(nick, password);
    }

    // Merge any zikrs counted as guest right before signing in
    this.mergeGuestDataIntoUser(this.getUserId());
    this.touchStamp();
    this.syncLocalUserSnapshot();

    if (this.isCloudSession()) {
      await this.push().catch(() => {});
    }

    this.emit('session');
    return this.getCurrentUser();
  }

  async signOut() {
    clearTimeout(this._pushTimer);
    this.syncLocalUserSnapshot();

    if (this.isCloudSession()) {
      await this.push().catch(() => {});
      this.cloudRequest('/auth/v1/logout', { method: 'POST', auth: true }).catch(() => {});
    }

    this.saveSession(null);
    this.syncState = 'idle';
    this.lastSyncedAt = null;
    this.emit('session');
  }

  /** Forgot password recovery: resets password for an existing account. */
  async resetPassword(nickname, newPassword) {
    const nick = normalizeNick(nickname);
    if (!nick) throw new AuthError("Iltimos, login (nickname) kiriting.");
    this.validatePassword(newPassword);

    const users = this.getLocalUsers();
    const key = Object.keys(users).find(k => normalizeNick(k) === nick);
    const record = key ? users[key] : null;

    if (!record) {
      throw new AuthError(`«@${nick}» nomli akkaunt topilmadi. Avval ro'yxatdan o'ting.`, 'not_found');
    }

    record.passwordHash = await this.hashPassword(newPassword);
    record.updatedAt = new Date().toISOString();
    record.lastLoginAt = record.updatedAt;
    users[nick] = record;
    if (key && key !== nick) delete users[key];
    writeJSON(LOCAL_USERS_KEY, users);

    // Automatically sign the user in after password reset
    this.restoreLegacyRecordData(record, record.id);
    this.saveSession({ mode: 'local', user: this.publicUser(record) });
    this.mergeGuestDataIntoUser(record.id);
    this.syncState = 'synced';
    this.emit('session');
    return this.getCurrentUser();
  }

  /** Update display name and/or password for the currently logged-in user. */
  async updateProfile({ displayName, newPassword } = {}) {
    if (!this.session) throw new AuthError("Avval tizimga kiring.");
    const user = this.session.user;
    const nick = user.nickname;
    const users = this.getLocalUsers();
    const record = users[nick] || {
      id: user.id,
      nickname: nick,
      displayName: user.displayName,
      createdAt: user.createdAt
    };

    if (typeof displayName === 'string' && displayName.trim()) {
      record.displayName = displayName.trim();
      this.session.user.displayName = record.displayName;
    }

    if (newPassword) {
      this.validatePassword(newPassword);
      record.passwordHash = await this.hashPassword(newPassword);
    }

    record.updatedAt = new Date().toISOString();
    users[nick] = record;
    writeJSON(LOCAL_USERS_KEY, users);
    this.saveSession(this.session);
    this.emit('session');
    return this.getCurrentUser();
  }

  // --------------------------------------------------------------------------
  // Local Account Storage & Password Hashing
  // --------------------------------------------------------------------------

  async hashPassword(password) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash);
  }

  getLocalUsers() {
    return readJSON(LOCAL_USERS_KEY, {}) || {};
  }

  async localSignUp(nick, password, customDisplayName) {
    const users = this.getLocalUsers();
    const existingKey = Object.keys(users).find(k => normalizeNick(k) === nick);
    if (existingKey) {
      throw new AuthError(`«@${nick}» logini band. Boshqa nom tanlang yoki «Kirish» bo'limidan kiring.`, 'nick_taken');
    }

    const now = new Date().toISOString();
    const record = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      nickname: nick,
      displayName: displayNameOf(nick, customDisplayName),
      passwordHash: await this.hashPassword(password),
      createdAt: now,
      lastLoginAt: now
    };
    users[nick] = record;
    writeJSON(LOCAL_USERS_KEY, users);

    this.saveSession({ mode: 'local', user: this.publicUser(record) });
    this.syncState = 'synced';
  }

  async localSignIn(nick, password) {
    const users = this.getLocalUsers();
    const key = Object.keys(users).find(k => normalizeNick(k) === nick);
    const record = key ? users[key] : null;

    if (!record) {
      throw new AuthError(`«@${nick}» nomli akkaunt topilmadi. «Ro'yxatdan o'tish» bo'limidan yangi akkaunt oching.`, 'not_found');
    }

    const hash = await this.hashPassword(password);
    if (record.passwordHash !== hash) {
      throw new AuthError("Parol noto'g'ri kiritildi. Qayta urinib ko'ring yoki «Parolni unutdingizmi?» tugmasini bosing.", 'invalid_credentials');
    }

    record.lastLoginAt = new Date().toISOString();
    users[nick] = record;
    writeJSON(LOCAL_USERS_KEY, users);

    this.restoreLegacyRecordData(record, record.id);
    this.saveSession({ mode: 'local', user: this.publicUser(record) });
    this.syncState = 'synced';
  }

  publicUser(record) {
    return {
      id: record.id,
      nickname: record.nickname,
      displayName: record.displayName || displayNameOf(record.nickname),
      createdAt: record.createdAt
    };
  }

  /** Keep a snapshot of user's scoped data inside `nur_registered_users` as well for redundancy. */
  syncLocalUserSnapshot() {
    if (!this.session || !this.session.user) return;
    const { id, nickname } = this.session.user;
    const users = this.getLocalUsers();
    const record = users[nickname];
    if (!record) return;

    const { counts, dailyStats } = this.readUserData(id);
    record.zikrData = { counts, dailyStats: dailyStats || {} };
    record.updatedAt = new Date().toISOString();
    users[nickname] = record;
    writeJSON(LOCAL_USERS_KEY, users);
  }

  restoreLegacyRecordData(record, targetUserId) {
    const z = record && record.zikrData;
    if (!z || !targetUserId) return;
    const countsKey = scopedKey(DATA_KEYS.counts, targetUserId);
    const statsKey = scopedKey(DATA_KEYS.dailyStats, targetUserId);

    const existingCounts = readJSON(countsKey, {});
    if ((!existingCounts || Object.keys(existingCounts).length === 0) && z.counts && Object.keys(z.counts).length > 0) {
      writeJSON(countsKey, z.counts);
    }
    const existingStats = readJSON(statsKey, null);
    if ((!existingStats || !existingStats.totalAllTime) && z.dailyStats && z.dailyStats.totalAllTime > 0) {
      writeJSON(statsKey, z.dailyStats);
    }
  }

  /** Used during one-time legacy v1 migration: moves unscoped data to the logged-in user and clears guest keys. */
  moveGuestDataToUser(targetUserId) {
    if (!targetUserId) return;
    this.mergeGuestDataIntoUser(targetUserId);
  }

  /**
   * Merges any zikrs counted while logged out (guest) into `targetUserId`'s scoped storage,
   * then clears the guest keys so logging out later shows a clean guest state.
   */
  mergeGuestDataIntoUser(targetUserId) {
    if (!targetUserId) return;

    const guestCounts = readJSON(DATA_KEYS.counts, null);
    const guestStats = readJSON(DATA_KEYS.dailyStats, null);

    if (guestCounts && typeof guestCounts === 'object' && Object.keys(guestCounts).length > 0) {
      const userCountsKey = scopedKey(DATA_KEYS.counts, targetUserId);
      const userCounts = readJSON(userCountsKey, {}) || {};
      const userHadSameData = JSON.stringify(userCounts) === JSON.stringify(guestCounts);

      if (!userHadSameData) {
        for (const [zikrId, cnt] of Object.entries(guestCounts)) {
          const n = Number(cnt) || 0;
          if (n > 0) {
            userCounts[zikrId] = (Number(userCounts[zikrId]) || 0) + n;
          }
        }
        writeJSON(userCountsKey, userCounts);
      }
      localStorage.removeItem(DATA_KEYS.counts);
    }

    if (guestStats && typeof guestStats === 'object' && (guestStats.totalAllTime > 0 || Object.keys(guestStats.days || {}).length > 0)) {
      const userStatsKey = scopedKey(DATA_KEYS.dailyStats, targetUserId);
      const userStats = readJSON(userStatsKey, null);

      if (!userStats || !userStats.totalAllTime) {
        writeJSON(userStatsKey, guestStats);
      } else if (JSON.stringify(userStats) !== JSON.stringify(guestStats)) {
        userStats.totalAllTime = (Number(userStats.totalAllTime) || 0) + (Number(guestStats.totalAllTime) || 0);
        userStats.days = userStats.days || {};
        for (const [day, val] of Object.entries(guestStats.days || {})) {
          userStats.days[day] = (Number(userStats.days[day]) || 0) + (Number(val) || 0);
        }
        if ((guestStats.streak || 0) > (userStats.streak || 0)) {
          userStats.streak = guestStats.streak;
        }
        if ((guestStats.lastActiveDate || '') > (userStats.lastActiveDate || '')) {
          userStats.lastActiveDate = guestStats.lastActiveDate;
        }
        writeJSON(userStatsKey, userStats);
      }
      localStorage.removeItem(DATA_KEYS.dailyStats);
    }
  }

  // --------------------------------------------------------------------------
  // Cloud Accounts (Supabase Auth REST API when configured)
  // --------------------------------------------------------------------------

  async cloudRequest(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
    if (!this.isOnline()) {
      throw new AuthError("Internet aloqasi yo'q. Ulanishni tekshirib, qayta urinib ko'ring.", 'offline');
    }
    let token = CLOUD.key;
    if (auth) token = await this.getValidAccessToken();

    let res;
    try {
      res = await fetch(CLOUD.url + path, {
        method,
        headers: {
          apikey: CLOUD.key,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });
    } catch {
      throw new AuthError("Serverga ulanib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.", 'network');
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!res.ok) {
      const msg = (data && (data.msg || data.error_description || data.message || data.error)) || `HTTP ${res.status}`;
      const err = new AuthError(String(msg), (data && (data.error_code || data.code)) || res.status);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  applyCloudAuth(data, nick, customDisplayName) {
    if (!data || !data.access_token || !data.user) {
      throw new AuthError("Akkaunt tasdiqlash xatoligi yuz berdi.", 'email_confirmation');
    }
    const meta = data.user.user_metadata || {};
    const nickname = meta.nickname || nick;
    this.saveSession({
      mode: 'cloud',
      user: {
        id: data.user.id,
        nickname,
        displayName: customDisplayName || meta.display_name || displayNameOf(nickname),
        createdAt: data.user.created_at
      },
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    });
    this.setSyncState('synced');
  }

  async cloudSignUp(nick, password, customDisplayName) {
    try {
      const disp = displayNameOf(nick, customDisplayName);
      const data = await this.cloudRequest('/auth/v1/signup', {
        method: 'POST',
        body: {
          email: nickToEmail(nick),
          password,
          data: { nickname: nick, display_name: disp }
        }
      });
      if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new AuthError('exists', 'user_already_exists');
      }
      this.applyCloudAuth(data, nick, disp);
    } catch (e) {
      if (e.code === 'user_already_exists' || /already\s+(registered|exists)/i.test(e.message)) {
        throw new AuthError(`«@${nick}» logini band. Boshqa nom tanlang yoki «Kirish» orqali kiring.`, 'nick_taken');
      }
      if (e.code === 'weak_password') {
        throw new AuthError("Parol juda oddiy. Uzunroq parol tanlang.", 'weak_password');
      }
      throw e;
    }
  }

  async cloudSignIn(nick, password) {
    try {
      const data = await this.cloudRequest('/auth/v1/token?grant_type=password', {
        method: 'POST',
        body: { email: nickToEmail(nick), password }
      });
      this.applyCloudAuth(data, nick);
    } catch (e) {
      if (e.code !== 'invalid_credentials' && e.status !== 400) throw e;

      const legacy = this.getLocalUsers()[nick];
      if (legacy && legacy.passwordHash === await this.hashPassword(password)) {
        await this.cloudSignUp(nick, password, legacy.displayName).catch(err => {
          if (err.code === 'nick_taken') {
            throw new AuthError("Login yoki parol noto'g'ri.", 'invalid_credentials');
          }
          throw err;
        });
        const newId = this.getUserId();
        this.copyDataIfEmpty(legacy.id, newId);
        this.restoreLegacyRecordData(legacy, newId);
        this.touchStamp();
        await this.push();
        return;
      }
      throw new AuthError("Login yoki parol noto'g'ri.", 'invalid_credentials');
    }
  }

  async getValidAccessToken() {
    const s = this.session;
    if (!s || s.mode !== 'cloud') throw new AuthError('Not signed in', 'no_session');
    if (s.expiresAt && Date.now() < s.expiresAt - 60_000) return s.accessToken;

    if (!this._refreshing) {
      this._refreshing = (async () => {
        try {
          const data = await this.cloudRequest('/auth/v1/token?grant_type=refresh_token', {
            method: 'POST',
            body: { refresh_token: s.refreshToken }
          });
          this.saveSession({
            ...this.session,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + (data.expires_in || 3600) * 1000
          });
          return data.access_token;
        } catch (e) {
          if (e.status === 400 || e.status === 401) {
            this.setSyncState('error');
            throw new AuthError("Sessiya muddati tugadi. Iltimos, qayta kiring.", 'session_expired');
          }
          throw e;
        } finally {
          this._refreshing = null;
        }
      })();
    }
    return this._refreshing;
  }

  // --------------------------------------------------------------------------
  // Data Sync Helpers
  // --------------------------------------------------------------------------

  readUserData(userId) {
    return {
      counts: readJSON(scopedKey(DATA_KEYS.counts, userId), {}) || {},
      dailyStats: readJSON(scopedKey(DATA_KEYS.dailyStats, userId), null)
    };
  }

  writeUserData(userId, { counts, dailyStats }) {
    writeJSON(scopedKey(DATA_KEYS.counts, userId), counts || {});
    if (dailyStats) writeJSON(scopedKey(DATA_KEYS.dailyStats, userId), dailyStats);
  }

  copyDataIfEmpty(fromUserId, toUserId) {
    if (!toUserId || fromUserId === toUserId) return;
    Object.values(DATA_KEYS).forEach(base => {
      const src = localStorage.getItem(scopedKey(base, fromUserId));
      const dstKey = scopedKey(base, toUserId);
      if (src && !localStorage.getItem(dstKey)) localStorage.setItem(dstKey, src);
    });
  }

  getStamp(userId = this.getUserId()) {
    return localStorage.getItem(scopedKey(STAMP_KEY, userId)) || '';
  }

  touchStamp(userId = this.getUserId(), iso = new Date().toISOString()) {
    localStorage.setItem(scopedKey(STAMP_KEY, userId), iso);
  }

  /** Called by db-service whenever the user's zikr count changes. */
  notifyDataChanged() {
    if (!this.session) return;
    this.touchStamp();
    this.syncLocalUserSnapshot();

    if (!this.isCloudSession()) {
      this.setSyncState('synced');
      return;
    }

    clearTimeout(this._pushTimer);
    if (!this.isOnline()) {
      this.setSyncState('offline');
      return;
    }
    this.setSyncState('syncing');
    this._pushTimer = setTimeout(() => this.push().catch(() => {}), 1500);
  }

  flush() {
    clearTimeout(this._pushTimer);
    return this.push().catch(() => {});
  }

  async push() {
    if (!this.isCloudSession()) return false;
    const userId = this.getUserId();
    const { counts, dailyStats } = this.readUserData(userId);
    const stamp = this.getStamp(userId) || new Date().toISOString();

    try {
      this.setSyncState('syncing');
      await this.cloudRequest('/rest/v1/user_data?on_conflict=user_id', {
        method: 'POST',
        auth: true,
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: {
          user_id: userId,
          nickname: this.session.user.nickname,
          counts,
          daily_stats: dailyStats || {},
          updated_at: stamp
        }
      });
      this.setSyncState('synced');
      return true;
    } catch (e) {
      this.setSyncState(e.code === 'offline' || e.code === 'network' ? 'offline' : 'error');
      throw e;
    }
  }

  async pull({ silent = false } = {}) {
    if (!this.isCloudSession()) return;
    const userId = this.getUserId();
    try {
      this.setSyncState('syncing');
      const rows = await this.cloudRequest(
        `/rest/v1/user_data?user_id=eq.${encodeURIComponent(userId)}&select=counts,daily_stats,updated_at`,
        { auth: true }
      );
      const remote = Array.isArray(rows) ? rows[0] : null;
      const localStamp = this.getStamp(userId);

      if (remote && (!localStamp || new Date(remote.updated_at) > new Date(localStamp))) {
        this.writeUserData(userId, { counts: remote.counts, dailyStats: remote.daily_stats });
        this.touchStamp(userId, remote.updated_at);
        this.setSyncState('synced');
        if (!silent) this.emit('data');
      } else if (!remote || new Date(localStamp) > new Date(remote.updated_at)) {
        await this.push();
      } else {
        this.setSyncState('synced');
      }
    } catch (e) {
      this.setSyncState(e.code === 'offline' || e.code === 'network' ? 'offline' : 'error');
    }
  }
}

export const authService = new AuthService();
