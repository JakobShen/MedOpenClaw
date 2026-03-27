(function () {
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

  document.addEventListener('DOMContentLoaded', initCopyBibtex);
})();
