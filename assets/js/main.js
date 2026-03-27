(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-video]').forEach((shell) => {
    const video = shell.querySelector('video');
    if (!video) return;

    const markReady = () => shell.classList.add('is-ready');
    const tryAutoplay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    video.addEventListener('loadeddata', () => {
      markReady();
      tryAutoplay();
    }, { once: true });

    video.addEventListener('canplay', () => {
      markReady();
      tryAutoplay();
    }, { once: true });

    // If neither source loads, keep the fallback overlay visible.
    // If the browser rejects the codec after sources are present, keep the overlay visible as well.
    video.addEventListener('error', () => {
      shell.classList.remove('is-ready');
    });
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
