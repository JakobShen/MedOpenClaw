window.HELP_IMPROVE_VIDEOJS = false;

document.addEventListener('DOMContentLoaded', function () {
  var mainVideo = document.getElementById('main-showcase-video');
  if (!mainVideo) return;

  var playPromise = mainVideo.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(function () {
      // Autoplay can be blocked by the browser. Controls remain available.
    });
  }
});
