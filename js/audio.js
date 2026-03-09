/**
 * audio.js — Shared audio module for Dad's Game Suite
 *
 * Usage:
 *   Audio.play('word_found')         // play a registered sound
 *   Audio.play('board_finished')
 *   Audio.setEnabled(false)          // mute all sounds
 *   Audio.isEnabled()                // returns bool
 *   Audio.register('flip', 'sounds/flip.mp3')  // register custom sound
 */

const Audio = (() => {
  // Pre-loaded sound buffers
  const _sounds = {};
  let _enabled = true;
  let _ctx = null;  // AudioContext — created on first interaction (iOS/Android requirement)

  // Built-in sounds — paths relative to project root
  const BUILT_IN = {
    word_found:     'word_found.mp3',
    board_finished: 'board_finished.mp3',
  };

  function _getContext() {
    if (!_ctx) {
      try {
        _ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Audio: Web Audio API not available', e);
      }
    }
    return _ctx;
  }

  function register(name, path) {
    _sounds[name] = { path, buffer: null, loading: false };
  }

  function _load(name) {
    const sound = _sounds[name];
    if (!sound || sound.buffer || sound.loading) return;
    sound.loading = true;

    const ctx = _getContext();
    if (!ctx) return;

    fetch(sound.path)
      .then(r => r.arrayBuffer())
      .then(data => ctx.decodeAudioData(data))
      .then(buffer => {
        sound.buffer = buffer;
        sound.loading = false;
      })
      .catch(e => {
        sound.loading = false;
        console.warn(`Audio: failed to load "${name}" from ${sound.path}`, e);
      });
  }

  function play(name, opts = {}) {
    if (!_enabled) return;

    const sound = _sounds[name];
    if (!sound) {
      console.warn(`Audio: unknown sound "${name}"`);
      return;
    }

    const ctx = _getContext();
    if (!ctx) return;

    // Resume suspended context (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!sound.buffer) {
      _load(name);
      return; // Will be ready next time
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = sound.buffer;

      // Optional: volume control
      if (opts.volume !== undefined) {
        const gainNode = ctx.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, opts.volume));
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
      } else {
        source.connect(ctx.destination);
      }

      source.start(0);
    } catch (e) {
      console.warn(`Audio: error playing "${name}"`, e);
    }
  }

  function preloadAll() {
    Object.keys(_sounds).forEach(name => _load(name));
  }

  function setEnabled(val) {
    _enabled = !!val;
    Settings.set('soundEnabled', _enabled);
  }

  function isEnabled() {
    return _enabled;
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    // Load saved preference
    _enabled = Settings.get('soundEnabled', true);

    // Register built-in sounds
    Object.entries(BUILT_IN).forEach(([name, path]) => register(name, path));

    // Preload on first user interaction (required for mobile)
    const preloadOnce = () => {
      preloadAll();
      document.removeEventListener('touchstart', preloadOnce);
      document.removeEventListener('click', preloadOnce);
    };
    document.addEventListener('touchstart', preloadOnce, { once: true });
    document.addEventListener('click', preloadOnce, { once: true });
  }

  return { init, register, play, preloadAll, setEnabled, isEnabled };
})();
