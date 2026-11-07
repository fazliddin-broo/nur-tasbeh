import { INITIAL_ZIKRS } from '../data/zikr-data.js';
import { authService } from './auth-service.js';

const STORAGE_KEYS = {
  ACTIVE_ZIKR: 'nur_active_zikr',
  COUNTS: 'nur_zikr_counts',
  DAILY_STATS: 'nur_daily_stats',
  VIDEOS: 'nur_custom_videos',
  CUSTOM_ZIKRS: 'nur_custom_zikrs',
  SETTINGS: 'nur_user_settings'
};

class DBService {
  constructor() {
    this.db = null;
    this.initIndexedDB();
  }

  initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('NurTasbihDB', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };
      request.onerror = (e) => {
        console.warn('IndexedDB failed, fallback to memory', e);
        resolve(null);
      };
    });
  }

  // Active Zikr state
  getActiveZikrId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ZIKR) || 'astaghfirullah';
  }

  setActiveZikrId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ZIKR, id);
  }

  // Counts for each zikr
  getCounts() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.COUNTS)) || {};
    } catch {
      return {};
    }
  }

  getCount(zikrId) {
    const counts = this.getCounts();
    return counts[zikrId] || 0;
  }

  setCount(zikrId, count) {
    const counts = this.getCounts();
    counts[zikrId] = Math.max(0, count);
    localStorage.setItem(STORAGE_KEYS.COUNTS, JSON.stringify(counts));
    this.recordTapForToday();
    authService.saveUserData(counts, this.getDailyStats());
  }

  incrementCount(zikrId) {
    const current = this.getCount(zikrId);
    const next = current + 1;
    this.setCount(zikrId, next);
    return next;
  }

  resetCount(zikrId) {
    this.setCount(zikrId, 0);
  }

  // Daily statistics and streak tracking
  getDailyStats() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_STATS)) || {
        totalAllTime: 0,
        days: {},
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0]
      };
    } catch {
      return { totalAllTime: 0, days: {}, streak: 1, lastActiveDate: '' };
    }
  }

  recordTapForToday() {
    const stats = this.getDailyStats();
    const today = new Date().toISOString().split('T')[0];

    stats.totalAllTime = (stats.totalAllTime || 0) + 1;
    stats.days[today] = (stats.days[today] || 0) + 1;

    // Calculate streak
    if (stats.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (stats.lastActiveDate === yesterday) {
        stats.streak = (stats.streak || 0) + 1;
      } else if (!stats.lastActiveDate) {
        stats.streak = 1;
      }
      stats.lastActiveDate = today;
    }

    localStorage.setItem(STORAGE_KEYS.DAILY_STATS, JSON.stringify(stats));
  }

  getTodayCount() {
    const stats = this.getDailyStats();
    const today = new Date().toISOString().split('T')[0];
    return stats.days[today] || 0;
  }

  getTotalCount() {
    const stats = this.getDailyStats();
    return stats.totalAllTime || 0;
  }

  getStreak() {
    const stats = this.getDailyStats();
    return stats.streak || 1;
  }

  // Custom Zikrs
  getAllZikrs() {
    try {
      const custom = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_ZIKRS)) || [];
      return [...INITIAL_ZIKRS, ...custom];
    } catch {
      return INITIAL_ZIKRS;
    }
  }

  addCustomZikr(zikr) {
    const custom = this.getCustomZikrs();
    const newZikr = {
      ...zikr,
      id: 'custom_' + Date.now(),
      presetCounts: [33, 100],
      isCustom: true
    };
    custom.unshift(newZikr);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_ZIKRS, JSON.stringify(custom));
    return newZikr;
  }

  getCustomZikrs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_ZIKRS)) || [];
    } catch {
      return [];
    }
  }

  // Videos
  getDefaultVideos() {
    return [
      {
        id: 'lecture-1',
        title: "Allohning va'dasi haqdir: Qiyomat va hisob-kitob",
        speaker: "Shayx Nuriddin Hoji domla",
        category: "Eslatma",
        date: "Bugun",
        duration: "01:10",
        url: "/videos/lecture-1.mp4",
        views: 1240,
        description: "Ushbu ibratli darsda oxirat kuni, hisob-kitob va har bir insonning o'z amallariga javobgarligi eslatiladi. Dunyo hayoti vaqtinchalik sinov bo'lib, vaqtni g'animat bilish, ezgu amallarni ko'paytirish, doimiy zikr va tavbada bo'lish najot kalitidir.",
        isFeatured: true
      }
    ];
  }

  async getAllVideos() {
    const defaults = this.getDefaultVideos();
    let customs = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      if (stored) {
        customs = JSON.parse(stored);
      }
    } catch (e) {}

    // Check IndexedDB for blob videos
    if (this.db) {
      try {
        const idbVideos = await new Promise((resolve) => {
          const tx = this.db.transaction('videos', 'readonly');
          const store = tx.objectStore('videos');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        idbVideos.forEach(v => {
          if (!customs.some(c => c.id === v.id)) {
            customs.push(v);
          }
        });
      } catch (err) {}
    }

    return [...defaults, ...customs];
  }

  async saveVideo(videoData) {
    const id = 'vid_' + Date.now();
    const newVideo = {
      id,
      title: videoData.title || "Yangi ibratli video",
      speaker: videoData.speaker || "Ustoz ma'ruzasi",
      category: videoData.category || "Ma'ruza",
      description: videoData.description || "Ushbu ibratli dars qalbni poklash, zikr va sunnatga amal qilish haqida ezgu nasihatlarni o'z ichiga oladi.",
      date: "Hozirgina",
      duration: videoData.duration || "01:00",
      url: videoData.url,
      blob: videoData.blob,
      views: 1
    };

    if (videoData.blob && this.db) {
      try {
        const tx = this.db.transaction('videos', 'readwrite');
        tx.objectStore('videos').put(newVideo);
      } catch (e) {
        console.warn('IDB write failed', e);
      }
    }

    // Save metadata to localStorage without big blob
    const meta = { ...newVideo };
    delete meta.blob;
    let customs = [];
    try {
      customs = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEOS)) || [];
    } catch {}
    customs.unshift(meta);
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(customs));

    return newVideo;
  }

  deleteVideo(videoId) {
    let customs = [];
    try {
      customs = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIDEOS)) || [];
      customs = customs.filter(v => v.id !== videoId);
      localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(customs));
    } catch {}

    if (this.db) {
      try {
        const tx = this.db.transaction('videos', 'readwrite');
        tx.objectStore('videos').delete(videoId);
      } catch (e) {}
    }
  }

  // Settings
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
        notificationsEnabled: false,
        reminderInterval: '60', // minutes
        morningReminder: true,
        eveningReminder: true,
        soundEnabled: true,
        hapticEnabled: true,
        themeVariant: 'celestial-dark'
      };
    } catch {
      return {
        notificationsEnabled: false,
        reminderInterval: '60',
        morningReminder: true,
        eveningReminder: true,
        soundEnabled: true,
        hapticEnabled: true,
        themeVariant: 'celestial-dark'
      };
    }
  }

  saveSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}

export const dbService = new DBService();
