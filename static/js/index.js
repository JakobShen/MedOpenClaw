(function () {
  var VIDEO_CANDIDATES = [
    { ext: 'mp4', type: 'video/mp4' },
    { ext: 'MP4', type: 'video/mp4' },
    { ext: 'webm', type: 'video/webm' },
    { ext: 'WEBM', type: 'video/webm' },
    { ext: 'mov', type: 'video/quicktime' },
    { ext: 'MOV', type: 'video/quicktime' }
  ];

  function initCopyBibtex() {
    var button = document.querySelector('[data-copy-bibtex]');
    var code = document.getElementById('bibtex-code');
    if (!button || !code) return;

    var original = button.textContent;

    button.addEventListener('click', async function () {
      var text = code.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
      } catch (error) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        button.textContent = 'Copied';
      }

      window.setTimeout(function () {
        button.textContent = original;
      }, 1400);
    });
  }

  async function findExistingVideo(baseName) {
    for (var index = 0; index < VIDEO_CANDIDATES.length; index += 1) {
      var candidate = VIDEO_CANDIDATES[index];
      var src = './static/videos/' + baseName + '.' + candidate.ext;

      try {
        var response = await fetch(src, {
          method: 'HEAD',
          cache: 'no-store'
        });

        if (response.ok) {
          return {
            src: src,
            type: candidate.type
          };
        }
      } catch (error) {
        // Ignore and continue.
      }
    }

    return null;
  }

  function primeFirstFrame(video) {
    if (!video || video.dataset.framePrimed === '1') return;
    if (video.readyState < 2) return;

    video.dataset.framePrimed = '1';

    try {
      if (video.currentTime === 0) {
        video.currentTime = 0.001;
      }
    } catch (error) {
      // Some browsers may reject this before enough data is buffered.
    }
  }

  function tryAutoplay(video) {
    if (!video) return;
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        primeFirstFrame(video);
      });
    }
  }

  async function setupVideo(video, observer, prefersReducedMotion) {
    var baseName = video.dataset.video;
    if (!baseName) return;

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.autoplay = !prefersReducedMotion;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    video.addEventListener('loadeddata', function () {
      primeFirstFrame(video);

      if (!prefersReducedMotion && (video.dataset.priority === 'high' || video.dataset.inView === '1')) {
        tryAutoplay(video);
      }
    });

    video.addEventListener('pause', function () {
      primeFirstFrame(video);
    });

    video.addEventListener('error', function () {
      video.classList.add('video-load-failed');
    });

    var match = await findExistingVideo(baseName);
    if (!match) {
      video.classList.add('video-missing');
      return;
    }

    video.src = match.src;
    video.setAttribute('data-video-src', match.src);
    video.load();

    if (observer) {
      observer.observe(video);
    } else if (!prefersReducedMotion) {
      video.dataset.inView = '1';
      tryAutoplay(video);
    }
  }

  async function initVideos() {
    var videos = Array.prototype.slice.call(document.querySelectorAll('video[data-video]'));
    if (!videos.length) return;

    var prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var observer = null;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var video = entry.target;
            if (entry.isIntersecting) {
              video.dataset.inView = '1';
              tryAutoplay(video);
            } else {
              video.dataset.inView = '0';
              video.pause();
            }
          });
        },
        {
          threshold: 0.35,
          rootMargin: '120px 0px'
        }
      );
    }

    await Promise.all(
      videos.map(function (video) {
        return setupVideo(video, observer, prefersReducedMotion);
      })
    );
  }

  document.addEventListener('DOMContentLoaded', function () {
    initCopyBibtex();
    initVideos();
  });
})();
