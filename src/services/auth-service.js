// Authentication & Multi-Device Account Management Service
// Offline-first with LocalStorage + IndexedDB + Cloud Sync Adapter

const AUTH_STORAGE_KEY = 'nur_auth_user';
const USERS_REGISTRY_KEY = 'nur_registered_users';
const PENDING_SYNC_KEY = 'nur_pending_sync_queue';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
    this.cloudConfig = {
      supabaseUrl: localStorage.getItem('nur_supabase_url') || '',
      supabaseKey: localStorage.getItem('nur_supabase_key') || ''
    };
    this.loadSession();
    this.setupNetworkListener();
  }

  loadSession() {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  setupNetworkListener() {
    window.addEventListener('online', () => {
      console.log('Internet qayta ulandi. Sinxronizatsiya boshlanmoqda...');
      this.syncPendingData();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.notifyListeners();
    });
  }

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  isLoggedIn() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(fn => {
      try {
        fn(this.currentUser);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // Simple secure hash helper (SHA-256 via Web Crypto API)
  async hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback simple hash for older environments
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash);
  }

  getRegisteredUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_REGISTRY_KEY)) || {};
    } catch {
      return {};
    }
  }

  saveRegisteredUsers(users) {
    localStorage.setItem(USERS_REGISTRY_KEY, JSON.stringify(users));
  }

  /**
   * Ro'yxatdan o'tish (Sign Up)
   * @param {string} nickname - Foydalanuvchi nomi
   * @param {string} password - Kamida 8 ta belgili parol
   */
  async signUp(nickname, password) {
    const cleanNick = (nickname || '').trim().toLowerCase();
    
    if (!cleanNick || cleanNick.length < 3) {
      throw new Error("Nickname kamida 3 ta belgidan iborat bo'lishi kerak.");
    }
    if (!password || password.length < 8) {
      throw new Error("Parol kamida 8 ta belgidan iborat bo'lishi kerak.");
    }

    const users = this.getRegisteredUsers();
    // Case-insensitive check to prevent duplicate nicknames
    const existingNickKey = Object.keys(users).find(k => k.toLowerCase() === cleanNick);
    
    let userExists = !!existingNickKey;
    if (!userExists && this.cloudConfig.supabaseUrl) {
      const cloudUser = await this.fetchUserFromCloud(cleanNick);
      if (cloudUser) userExists = true;
    }

    if (userExists) {
      // Security requirement: Never leak or mention password status in error!
      // Only inform that the nickname already exists.
      throw new Error(`«${cleanNick}» nomli nickname allaqachon mavjud! Iltimos, boshqa nom tanlang yoki «Kirish» bo'limidan tizimga kiring.`);
    }

    const passwordHash = await this.hashPassword(password);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);

    const userRecord = {
      id: userId,
      nickname: cleanNick,
      displayName: cleanNick.charAt(0).toUpperCase() + cleanNick.slice(1),
      passwordHash,
      createdAt: new Date().toISOString(),
      zikrData: {
        counts: {},
        targets: {},
        dailyStats: {
          totalAllTime: 0,
          days: {},
          streak: 1
        }
      }
    };

    users[cleanNick] = userRecord;
    this.saveRegisteredUsers(users);

    // Set current active session
    this.currentUser = {
      id: userId,
      nickname: cleanNick,
      displayName: userRecord.displayName,
      createdAt: userRecord.createdAt
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));

    // Try cloud sync if configured
    await this.syncWithCloud(userRecord);

    this.notifyListeners();
    return this.currentUser;
  }

  /**
   * Tizimga kirish (Sign In)
   * @param {string} nickname
   * @param {string} password
   */
  async signIn(nickname, password) {
    const cleanNick = (nickname || '').trim().toLowerCase();

    if (!cleanNick) {
      throw new Error("Iltimos, nickname kiriting.");
    }
    if (!password) {
      throw new Error("Iltimos, parol kiriting.");
    }

    const users = this.getRegisteredUsers();
    let userRecord = users[cleanNick];

    // If not found locally, try fetching from Cloud Database (for cross-device phone -> laptop login!)
    if (!userRecord && this.cloudConfig.supabaseUrl) {
      userRecord = await this.fetchUserFromCloud(cleanNick);
      if (userRecord) {
        users[cleanNick] = userRecord;
        this.saveRegisteredUsers(users);
      }
    }

    if (!userRecord) {
      throw new Error(`«${cleanNick}» nomli foydalanuvchi topilmadi. Avval ro'yxatdan o'ting.`);
    }

    const passwordHash = await this.hashPassword(password);
    if (userRecord.passwordHash !== passwordHash) {
      throw new Error("Parol noto'g'ri kiritildi. Qaytadan urinib ko'ring.");
    }

    // Restore user data into local storage for seamless immediate use
    if (userRecord.zikrData) {
      if (userRecord.zikrData.counts) {
        localStorage.setItem('nur_zikr_counts', JSON.stringify(userRecord.zikrData.counts));
      }
      if (userRecord.zikrData.dailyStats) {
        localStorage.setItem('nur_daily_stats', JSON.stringify(userRecord.zikrData.dailyStats));
      }
    }

    this.currentUser = {
      id: userRecord.id,
      nickname: cleanNick,
      displayName: userRecord.displayName,
      createdAt: userRecord.createdAt
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));

    this.notifyListeners();
    return this.currentUser;
  }

  /**
   * Tizimdan chiqish (Sign Out)
   */
  signOut() {
    this.currentUser = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Foydalanuvchining yangilangan zikr ko'rsatkichlarini akountga saqlash
   */
  saveUserData(counts, dailyStats) {
    if (!this.currentUser) return;

    const cleanNick = this.currentUser.nickname;
    const users = this.getRegisteredUsers();
    const userRecord = users[cleanNick];

    if (userRecord) {
      userRecord.zikrData = {
        counts: counts || {},
        dailyStats: dailyStats || {}
      };
      userRecord.updatedAt = new Date().toISOString();
      users[cleanNick] = userRecord;
      this.saveRegisteredUsers(users);

      // Enqueue sync for cloud carry-over
      this.queueSync(userRecord);
    }
  }

  queueSync(userRecord) {
    try {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify({
        user: userRecord,
        timestamp: Date.now()
      }));
      if (this.isOnline()) {
        this.syncPendingData();
      }
    } catch (e) {
      console.warn('Queue sync error:', e);
    }
  }

  async syncPendingData() {
    try {
      const raw = localStorage.getItem(PENDING_SYNC_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && data.user) {
        await this.syncWithCloud(data.user);
        localStorage.removeItem(PENDING_SYNC_KEY);
      }
    } catch (e) {
      console.warn('Sync pending data error:', e);
    }
  }

  // Cloud backend sync implementation (Supabase / REST / Vercel KV)
  async syncWithCloud(userRecord) {
    if (!this.cloudConfig.supabaseUrl || !this.cloudConfig.supabaseKey) {
      // Local offline-first active; ready for cloud credentials whenever provided
      return false;
    }

    try {
      const endpoint = `${this.cloudConfig.supabaseUrl}/rest/v1/users_sync`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.cloudConfig.supabaseKey,
          'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          nickname: userRecord.nickname,
          password_hash: userRecord.passwordHash,
          display_name: userRecord.displayName,
          data: userRecord.zikrData,
          updated_at: new Date().toISOString()
        })
      });

      return res.ok;
    } catch (e) {
      console.warn('Cloud sync error (will retry automatically):', e);
      return false;
    }
  }

  async fetchUserFromCloud(cleanNick) {
    if (!this.cloudConfig.supabaseUrl || !this.cloudConfig.supabaseKey) {
      return null;
    }

    try {
      const endpoint = `${this.cloudConfig.supabaseUrl}/rest/v1/users_sync?nickname=eq.${cleanNick}&select=*`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': this.cloudConfig.supabaseKey,
          'Authorization': `Bearer ${this.cloudConfig.supabaseKey}`
        }
      });
      if (res.ok) {
        const rows = await res.json();
        if (rows && rows.length > 0) {
          const row = rows[0];
          return {
            id: row.id || ('usr_' + cleanNick),
            nickname: row.nickname,
            displayName: row.display_name || cleanNick,
            passwordHash: row.password_hash,
            createdAt: row.created_at,
            zikrData: row.data || {}
          };
        }
      }
    } catch (e) {
      console.warn('Fetch from cloud error:', e);
    }
    return null;
  }
}

export const authService = new AuthService();
