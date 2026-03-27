(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function tryVideoCandidates(video, shell, statusEl) {
    const baseName = video.dataset.videoName;
    if (!baseName) return;

    const candidates = [
      `assets/videos/${baseName}.mp4`,
      `${baseName}.mp4`,
      `videos/${baseName}.mp4`,
      `assets/videos/${baseName}.mov`,
      `${baseName}.mov`,
      `videos/${baseName}.mov`
    ];

    let index = 0;
    let settled = false;

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('error', onError);
      video.removeEventListener('stalled', onError);
      video.removeEventListener('abort', onError);
    };

    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      shell.classList.remove('is-missing');
      if (statusEl) statusEl.textContent = '';
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    const onError = () => {
      cleanup();
      index += 1;
      attempt();
    };

    const attempt = () => {
      if (settled) return;
      if (index >= candidates.length) {
        shell.classList.add('is-missing');
        if (statusEl) statusEl.textContent = 'Video unavailable.';
        return;
      }

      video.pause();
      video.removeAttribute('src');
      video.load();

      video.addEventListener('loadedmetadata', onReady, { once: true });
      video.addEventListener('canplay', onReady, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.addEventListener('stalled', onError, { once: true });
      video.addEventListener('abort', onError, { once: true });

      video.src = candidates[index];
      video.load();
    };

    attempt();
  }

  document.querySelectorAll('[data-video-shell]').forEach((shell) => {
    const video = shell.querySelector('video');
    const statusEl = shell.querySelector('.video-status');
    if (!video) return;
    tryVideoCandidates(video, shell, statusEl);
  });

  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  function openLightbox(source) {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = source.currentSrc || source.src;
    lightboxImage.alt = source.alt || '';
    lightboxCaption.textContent = source.dataset.caption || source.alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => {
      if (!lightbox.classList.contains('is-open')) {
        lightboxImage.src = '';
      }
    }, 180);
  }

  document.querySelectorAll('.zoomable').forEach((img) => {
    img.addEventListener('click', () => openLightbox(img));
  });

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  if (lightbox) {
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  const bibtexContent = document.getElementById('bibtex-content');
  const copyButton = document.getElementById('copy-bibtex');

  async function copyBibtex() {
    if (!bibtexContent || !copyButton) return;
    const text = bibtexContent.textContent || '';

    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = 'Copied';
      setTimeout(() => {
        copyButton.textContent = 'Copy BibTeX';
      }, 1600);
    } catch (error) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(bibtexContent);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      copyButton.textContent = 'Select and Copy';
      setTimeout(() => {
        copyButton.textContent = 'Copy BibTeX';
      }, 1800);
    }
  }

  if (copyButton) {
    copyButton.addEventListener('click', copyBibtex);
  }

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.16,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
})();
