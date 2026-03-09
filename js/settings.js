/**
 * settings.js — Persistent settings and storage for Dad's Game Suite
 *
 * Wraps localStorage with safe get/set and type preservation.
 * Also provides per-game stats storage.
 *
 * Usage:
 *   Settings.get('soundEnabled', true)      // get with default
 *   Settings.set('soundEnabled', false)     // set and save
 *   Settings.get('fontSize', 'medium')
 *
 *   // Per-game stats
 *   Settings.saveStats('solitaire', { wins: 5, played: 12, bestTime: 342 })
 *   Settings.getStats('solitaire')          // returns saved object or {}
 */

const Settings = (() => {
  const PREFIX = 'congames:';

  function _key(name) {
    return PREFIX + name;
  }

  function get(name, defaultValue = null) {
    try {
      const raw = localStorage.getItem(_key(name));
      if (raw === null) return defaultValue;
      return JSON.parse(raw);
    } catch (e) {
      return defaultValue;
    }
  }

  function set(name, value) {
    try {
      localStorage.setItem(_key(name), JSON.stringify(value));
    } catch (e) {
      console.warn('Settings: localStorage write failed', e);
    }
  }

  function remove(name) {
    try {
      localStorage.removeItem(_key(name));
    } catch (e) {}
  }

  // ── Per-game stats ───────────────────────────────────────
  function getStats(gameId) {
    return get(`stats:${gameId}`, {
      played: 0,
      wins: 0,
      bestTime: null,  // seconds
    });
  }

  function saveStats(gameId, stats) {
    const current = getStats(gameId);
    const merged = { ...current, ...stats };
    set(`stats:${gameId}`, merged);
    return merged;
  }

  function recordWin(gameId, timeSeconds = null) {
    const stats = getStats(gameId);
    stats.played++;
    stats.wins++;
    if (timeSeconds !== null) {
      if (stats.bestTime === null || timeSeconds < stats.bestTime) {
        stats.bestTime = timeSeconds;
      }
    }
    saveStats(gameId, stats);
    return stats;
  }

  function recordLoss(gameId) {
    const stats = getStats(gameId);
    stats.played++;
    saveStats(gameId, stats);
    return stats;
  }

  // ── UI Preferences ───────────────────────────────────────
  const DEFAULTS = {
    soundEnabled: true,
    fontSize: 'medium',  // 'small' | 'medium' | 'large'
  };

  function getAll() {
    return Object.fromEntries(
      Object.entries(DEFAULTS).map(([k, def]) => [k, get(k, def)])
    );
  }

  function applyFontSize() {
    const size = get('fontSize', 'medium');
    const map = { small: '16px', medium: '18px', large: '21px' };
    document.documentElement.style.fontSize = map[size] || '18px';
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    applyFontSize();
  }

  return {
    get, set, remove,
    getStats, saveStats, recordWin, recordLoss,
    getAll, applyFontSize,
    init,
  };
})();
