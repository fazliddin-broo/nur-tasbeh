// Video Feed and Player Component
import { dbService } from '../services/db-service.js';
import { soundEngine } from '../services/audio-service.js';

export class VideoFeed {
  constructor(containerElement, onNavigateToDashboard) {
    this.container = containerElement;
    this.onNavigateToDashboard = onNavigateToDashboard;
    this.videos = [];
    this.activeVideo = null;
    this.modal = null;
    this.init();
  }

  async init() {
    this.createPlayerModal();
    await this.render();
  }

  async render() {
    this.videos = await dbService.getAllVideos();

    this.container.innerHTML = `
      <div class="video-feed-wrapper">
        <!-- Header Banner -->
        <div class="feed-header glass-card">
          <div class="flex items-center justify-between">
            <div>
              <span class="badge-amber">Ibratli Darslar & Eslatmalar</span>
              <h2 class="text-xl font-bold text-white mt-1">Qalblar Taskini</h2>
              <p class="text-xs text-white/60">Imonni quvvatlovchi va ibrat ulashuvchi qisqa ma'ruzalar</p>
            </div>
          </div>
        </div>

        <!-- Videos Grid -->
        <div class="video-grid">
          ${this.videos.map(v => this.renderVideoCard(v)).join('')}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderVideoCard(video) {
    return `
      <div class="video-card glass-card" data-video-id="${video.id}">
        <div class="video-thumbnail-container">
          <!-- Video preview with poster or subtle autoplay preview on hover -->
          <video class="video-thumb-preview" src="${video.url}" preload="metadata" muted playsinline></video>
          <div class="thumb-overlay">
            <div class="play-pulse-btn">
              <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <span class="video-duration-badge">${video.duration || '01:10'}</span>
          <span class="video-category-tag">${video.category || "Ma'ruza"}</span>
        </div>

        <div class="video-card-info">
          <h3 class="video-card-title">${video.title}</h3>
          <div class="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-xs text-white/60">
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-cyan-400 flex items-center justify-center text-[10px] text-white font-bold">
                ${video.speaker ? video.speaker.charAt(0) : 'U'}
              </div>
              <span class="truncate max-w-[140px] text-white/80">${video.speaker}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1 text-[11px] text-white/50">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                ${video.views || 1}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    const cards = this.container.querySelectorAll('.video-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-video-id');
        const video = this.videos.find(v => v.id === id);
        if (video) {
          this.openPlayer(video);
        }
      });
    });

    const addBtn = this.container.querySelector('#add-video-shortcut-btn');
    if (addBtn && this.onNavigateToDashboard) {
      addBtn.addEventListener('click', () => {
        this.onNavigateToDashboard();
      });
    }
  }

  createPlayerModal() {
    if (document.getElementById('nur-video-player-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'nur-video-player-modal';
    modal.className = 'video-player-modal hidden';
    modal.innerHTML = `
      <div class="video-modal-backdrop"></div>
      <div class="video-modal-dialog">
        <!-- Close Button -->
        <button id="close-player-btn" class="player-close-btn" aria-label="Yopish">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <!-- Video element -->
        <div class="player-video-box">
          <video id="main-player-video" playsinline controls loop></video>
        </div>

        <!-- Video Overlay Info -->
        <div class="player-meta-bar glass-card">
          <div class="player-meta-top">
            <div class="player-meta-heading">
              <span id="player-category" class="video-category-tag mb-1 inline-block">Ma'ruza</span>
              <h3 id="player-title" class="text-base font-bold text-white line-clamp-1"></h3>
              <p id="player-speaker" class="text-xs text-amber-300 mt-0.5 font-medium"></p>
            </div>
            <button id="player-share-btn" class="player-action-btn" title="Ulashish">
              <svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
              <span>Ulashish</span>
            </button>
          </div>
          <!-- Authentic Islamic Description -->
          <div class="player-description-box">
            <p id="player-description" class="player-description-text"></p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.modal = modal;

    // Attach modal close & actions
    const closeBtn = modal.querySelector('#close-player-btn');
    const backdrop = modal.querySelector('.video-modal-backdrop');
    const videoEl = modal.querySelector('#main-player-video');

    const closeModal = () => {
      videoEl.pause();
      modal.classList.add('hidden');
    };

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // Native Share button (Invokes iOS / Android native share sheet)
    const shareBtn = modal.querySelector('#player-share-btn');
    shareBtn.addEventListener('click', async () => {
      soundEngine.playSoftTap();
      if (!this.activeVideo) return;

      const shareData = {
        title: this.activeVideo.title,
        text: `${this.activeVideo.speaker} — «${this.activeVideo.title}»\n\n${this.activeVideo.description || ''}\n\nNur Tasbeh ilovasida tomosha qiling:`,
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          // User closed share sheet
        }
      } else {
        try {
          await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
          alert("Havola va tavsif nusxalandi! 📋");
        } catch {
          alert("Havola nusxalandi!");
        }
      }
    });
  }

  openPlayer(video) {
    this.activeVideo = video;
    soundEngine.playSoftTap();

    if (!this.modal) this.createPlayerModal();

    const videoEl = this.modal.querySelector('#main-player-video');
    const titleEl = this.modal.querySelector('#player-title');
    const speakerEl = this.modal.querySelector('#player-speaker');
    const categoryEl = this.modal.querySelector('#player-category');
    const descriptionEl = this.modal.querySelector('#player-description');

    if (titleEl) titleEl.textContent = video.title;
    if (speakerEl) speakerEl.textContent = video.speaker;
    if (categoryEl) categoryEl.textContent = video.category || "Ma'ruza";
    if (descriptionEl) {
      descriptionEl.textContent = video.description || "Ushbu ibratli dars qalbni poklash, zikr va sunnatga amal qilish haqida ezgu nasihatlarni o'z ichiga oladi.";
    }
    videoEl.src = video.url;

    this.modal.classList.remove('hidden');
    videoEl.play().catch(() => {});
  }
}
