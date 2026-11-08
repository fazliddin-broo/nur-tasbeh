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
      },
      {
        id: 'lecture-2',
        title: "«Astaghfirulloh» zikrining fazilati va qalblar taskini",
        speaker: "Qiroat & Zikr",
        category: "Zikr & Duo",
        date: "Kecha",
        duration: "01:30",
        url: "/videos/lecture-2.mp4",
        views: 980,
        description: "Doimiy istig'for aytish — qalbni gunohlardan poklash, rizqni kengaytirish va g'am-tashvishlardan xalos bo'lishning buyuk kalitidir. Payg'ambarimiz (s.a.v.) kuniga 70 dan ortiq istig'for aytganlari sunnatdir.",
        isFeatured: false
      },
      {
        id: 'lecture-3',
        title: "Payg'ambarimiz (s.a.v.) xonadonlari va go'zal odob-axloq",
        speaker: "Shayx Nuriddin Hoji domla",
        category: "Ibratli Hikmat",
        date: "2 kun oldin",
        duration: "01:46",
        url: "/videos/lecture-3.mp4",
        views: 1540,
        description: "Payg'ambarimiz Muhammad alayhissalom xonadonlari, ahli baytlari va u zotning avlodlarining yuksak odob-axloqi, kamtarligi va bir-birlariga bo'lgan samimiy ehtiromi haqidagi ibratli ma'ruza.",
        isFeatured: false
      },
      {
        id: 'lecture-4',
        title: "Alloh taoloning yagonaligi va ulug'vorligi (Tavhid)",
        speaker: "Shayx Nuriddin Hoji domla",
        category: "Ma'ruza",
        date: "3 kun oldin",
        duration: "01:49",
        url: "/videos/lecture-4.mp4",
        views: 2100,
        description: "Alloh taoloning go'zal ismlari va oliy sifatlari, U Zotning yagonaligi, hech bir sherigi va yordamchisi yo'qligi haqidagi sof Ahli Sunna val-Jamoa aqidasiga asoslangan purma'no dars.",
        isFeatured: false
      },
      {
        id: 'lecture-5',
        title: "Ruhiy tarbiya: Taqvo va qalb pokligi",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ruhiy tarbiya",
        date: "Yangi",
        duration: "01:09",
        url: "/videos/lecture-5.mp4",
        views: 2263,
        description: "Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining «Ruhiy tarbiya» darslaridan: Taqvo — qalbni gunohlardan saqlash, Allohning buyruqlariga ixlos bilan itoat etish va qalbiy halovatga erishish asosidir.",
        isFeatured: false
      },
      {
        id: 'lecture-6',
        title: "Ilm va axloq: Mo'minning asl fazilati",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ilm & Odob",
        date: "Yangi",
        duration: "00:36",
        url: "/videos/lecture-6.mp4",
        views: 5246,
        description: "Ilm olish va unga amal qilish, ota-onaga ehtirom hamda jamiyatga manfaatli inson bo'lish haqidagi Shayx hazratlarining qimmatli nasihatlari.",
        isFeatured: false
      },
      {
        id: 'lecture-7',
        title: "Ibratli meros: Qalblarga yo'l topgan hikmatlar",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ibrat",
        date: "Yangi",
        duration: "00:57",
        url: "/videos/lecture-7.mp4",
        views: 4417,
        description: "Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining ibratli hayot yo'li, ilmga bo'lgan cheksiz muhabbatlari va xalqimizga qoldirgan boy ma'naviy xazinasi.",
        isFeatured: false
      },
      {
        id: 'lecture-8',
        title: "Yaxshilik va ezgulik yo'li: Mo'minning burchi",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Hikmat",
        date: "Yangi",
        duration: "01:22",
        url: "/videos/lecture-8.mp4",
        views: 36508,
        description: "Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining ezgu amallar, insonlarga yaxshilik ulashish va har bir daqiqani Alloh roziligi uchun sarflash haqidagi chuqur ma'noli da'vatlari.",
        isFeatured: false
      },
      {
        id: 'lecture-9',
        title: "Taqvo haqiqati: Nafsni poklash va saqlanish",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ruhiy tarbiya",
        date: "Yangi",
        duration: "01:43",
        url: "/videos/lecture-9.mp4",
        views: 2080,
        description: "«Ruhiy tarbiya» darslari silsilasidan: Haqiqiy taqvo insonning nafs balolaridan saqlanishi, haromdan tiyilishi va qalbini faqat Parvardigor muhabbatiga to'ldirishidir.",
        isFeatured: false
      },
      {
        id: 'lecture-10',
        title: "Ixlos va niyat: Amallarning qabul bo'lish sharti",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ibratli Hikmat",
        date: "Yangi",
        duration: "02:45",
        url: "/videos/lecture-10.mp4",
        views: 6948,
        description: "Har bir ezgu amal niyatga bog'liqdir. Shayx hazratlari ixlosning qadr-qimmati, riyodan saqlanish va faqat Alloh taolo uchun xolis amal qilish lozimligi haqida tushuntiradilar.",
        isFeatured: false
      },
      {
        id: 'lecture-11',
        title: "Qalb xotirjamligi: Zikr va toat lazzati",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ruhiy tarbiya",
        date: "Yangi",
        duration: "01:43",
        url: "/videos/lecture-11.mp4",
        views: 4175,
        description: "«Ruhiy tarbiya» darslaridan: Qalblar faqat Allohning zikri bilan orom topadi. Toat va ibodat lazzatini his etgan qalb dunyo hoyu-havaslariga aldanmaydi.",
        isFeatured: false
      },
      {
        id: 'lecture-12',
        title: "G'aflatdan uyg'onish: Umr ne'matining qadri",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ruhiy tarbiya",
        date: "Yangi",
        duration: "02:32",
        url: "/videos/lecture-12.mp4",
        views: 3022,
        description: "«Ruhiy tarbiya» darslaridan: Inson umri eng qimmatbaho sarmoyadir. Shayx hazratlari g'aflat uyqusidan uyg'onish, vaqtni qadrlash va solih amallar bilan umrni ziynatlashga chaqiradilar.",
        isFeatured: false
      },
      {
        id: 'lecture-13',
        title: "Go'zal xulq: Islomning jamoli",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Odob & Axloq",
        date: "Yangi",
        duration: "01:14",
        url: "/videos/lecture-13.mp4",
        views: 3438,
        description: "Shayx Muhammad Sodiq Muhammad Yusuf hazratlarining mo'minning go'zal xulqi, xushmuomalaligi va jamiyatdagi namunali odobi haqidagi ta'sirli eslatmasi.",
        isFeatured: false
      },
      {
        id: 'lecture-14',
        title: "Tavba eshigi: Umid va mag'firat",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Eslatma",
        date: "Yangi",
        duration: "01:02",
        url: "/videos/lecture-14.mp4",
        views: 1871,
        description: "Alloh taoloning rahmati keng, mag'firati cheksizdir. Har bir banda chin dildan tavba qilib, Unga yuzlansa, gunohlari kechirilishi haqidagi ibratli nasihat.",
        isFeatured: false
      },
      {
        id: 'lecture-15',
        title: "Sabr va shukr: Mo'minning ikki qanoti",
        speaker: "Shayx Muhammad Sodiq Muhammad Yusuf",
        category: "Ibratli Hikmat",
        date: "Yangi",
        duration: "02:05",
        url: "/videos/lecture-15.mp4",
        views: 6064,
        description: "Hayotdagi har qanday sinovda sabr qilish va berilgan cheksiz ne'matlarga shukr qilish — mo'min qalbining eng yuksak fazilatidir. Shayx hazratlarining purhikmat darslaridan.",
        isFeatured: false
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
