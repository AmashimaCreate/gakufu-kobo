(() => {
  'use strict';

  const workspace = document.getElementById('workspace');
  const statusText = document.getElementById('previewStatusText');
  const notice = document.getElementById('startupNotice');
  let ready = false;

  function setState(state, message) {
    if (!workspace || !statusText || !notice) return;
    workspace.dataset.appState = state;
    workspace.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
    statusText.textContent = message;
    notice.hidden = state !== 'error';
  }

  const timeout = window.setTimeout(() => {
    if (!ready) setState('error', '読み込みに失敗しました');
  }, 12000);

  window.MusicPaperBoot = {
    ready() {
      ready = true;
      window.clearTimeout(timeout);
      setState('ready', 'ライブプレビュー');
    },
    fail() {
      if (ready) return;
      window.clearTimeout(timeout);
      setState('error', '読み込みに失敗しました');
    }
  };

  window.addEventListener('error', () => window.MusicPaperBoot.fail(), true);
  window.addEventListener('unhandledrejection', () => window.MusicPaperBoot.fail());
})();
