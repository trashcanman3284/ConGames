/**
 * router.js — Screen navigation for Con se Speletjies
 *
 * Screens are divs with class "screen" and a data-screen attribute.
 * Usage:
 *   Router.go('welcome')       // navigate to a screen
 *   Router.back()              // go back one step
 *   Router.current()           // returns current screen id
 */

const Router = (() => {
  let _history = ['welcome'];
  let _onLeave = {};   // { screenId: callbackFn } — called before leaving
  let _onEnter = {};   // { screenId: callbackFn } — called after arriving

  function getEl(id) {
    return document.querySelector(`[data-screen="${id}"]`);
  }

  function go(screenId, opts = {}) {
    const current = _history[_history.length - 1];
    if (current === screenId && !opts.force) return;

    // Call onLeave for current screen
    if (_onLeave[current]) {
      try { _onLeave[current](); } catch (e) { console.warn('Router onLeave error:', e); }
    }

    // Hide current
    const fromEl = getEl(current);
    if (fromEl) fromEl.classList.remove('active');

    // Push history (unless replacing)
    if (opts.replace) {
      _history[_history.length - 1] = screenId;
    } else {
      _history.push(screenId);
    }

    // Show next
    const toEl = getEl(screenId);
    if (!toEl) {
      console.error(`Router: no screen found with data-screen="${screenId}"`);
      return;
    }
    toEl.classList.add('active');

    // Call onEnter for new screen
    if (_onEnter[screenId]) {
      try { _onEnter[screenId](opts.params); } catch (e) { console.warn('Router onEnter error:', e); }
    }
  }

  function back() {
    if (_history.length <= 1) return;
    _history.pop();
    const target = _history[_history.length - 1];
    go(target, { replace: true, force: true });
  }

  function current() {
    return _history[_history.length - 1];
  }

  function onLeave(screenId, fn) {
    _onLeave[screenId] = fn;
  }

  function onEnter(screenId, fn) {
    _onEnter[screenId] = fn;
  }

  // Handle Android back button / browser back
  window.addEventListener('popstate', () => {
    if (_history.length > 1) back();
  });

  return { go, back, current, onLeave, onEnter };
})();
