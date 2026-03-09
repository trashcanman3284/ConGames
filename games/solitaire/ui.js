/**
 * Solitaire UI -- Complete game interaction layer
 * Wires SolitaireEngine to the DOM: rendering, tap-tap, drag-drop, timer, settings, modals
 */
var SolitaireUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────

  var _els = {};                  // DOM cache
  var _timerInterval = null;      // Timer interval ID
  var _elapsedSeconds = 0;        // Timer seconds
  var _selectedCard = null;       // { zone, col, cardIndex, el }
  var _isAutoCompleting = false;  // Block input during auto-complete
  var _isDragging = false;        // Currently dragging?
  var _dragState = null;          // { startX, startY, cards, originZone, originCol, originCardIndex, floatEl }
  var _gameStarted = false;       // Has at least one move been made
  var _preventClick = false;      // Prevent click after drag

  // ── DOM cache helper ──────────────────────────────────────

  function el(id) {
    if (!_els[id]) {
      _els[id] = document.getElementById(id);
    }
    return _els[id];
  }

  // ── Initialization ────────────────────────────────────────

  function init() {
    _els = {};
    _selectedCard = null;
    _isAutoCompleting = false;
    _isDragging = false;
    _dragState = null;
    _gameStarted = false;
    _preventClick = false;
    _elapsedSeconds = 0;

    // Wire buttons
    el('sol-undo-btn').addEventListener('click', onUndoClick);
    el('sol-newgame-btn').addEventListener('click', onNewGameClick);
    el('sol-settings-btn').addEventListener('click', onSettingsOpen);
    el('sol-settings-close').addEventListener('click', onSettingsClose);
    el('sol-draw1-btn').addEventListener('click', function() { startGame(1); });
    el('sol-draw3-btn').addEventListener('click', function() { startGame(3); });
    el('sol-win-newgame').addEventListener('click', function() {
      hideOverlay('sol-win-overlay');
      onNewGameClick();
    });
    el('sol-win-home').addEventListener('click', function() {
      hideOverlay('sol-win-overlay');
      Router.go('welcome');
    });

    // Wire settings toggles
    el('sol-toggle-hints').addEventListener('change', function() {
      Settings.set('sol-show-hints', this.checked);
      clearHighlights();
    });
    el('sol-toggle-timer').addEventListener('change', function() {
      Settings.set('sol-show-timer', this.checked);
      el('sol-timer').style.display = this.checked ? '' : 'none';
    });
    el('sol-toggle-moves').addEventListener('change', function() {
      Settings.set('sol-show-moves', this.checked);
      el('sol-moves').style.display = this.checked ? '' : 'none';
    });
    el('sol-toggle-scoring').addEventListener('change', function() {
      Settings.set('sol-scoring', this.checked);
      el('sol-score').style.display = this.checked ? '' : 'none';
    });

    // Check saved draw mode
    var savedDrawMode = Settings.get('sol-draw-mode', null);
    if (savedDrawMode) {
      startGame(parseInt(savedDrawMode, 10));
    } else {
      showOverlay('sol-draw-modal');
    }
  }

  function cleanup() {
    stopTimer();
    _selectedCard = null;
    _isAutoCompleting = false;
    _isDragging = false;
    _dragState = null;

    // Remove button listeners
    var undoBtn = el('sol-undo-btn');
    if (undoBtn) undoBtn.removeEventListener('click', onUndoClick);
    var newBtn = el('sol-newgame-btn');
    if (newBtn) newBtn.removeEventListener('click', onNewGameClick);

    _els = {};
  }

  // ── Game lifecycle ────────────────────────────────────────

  function startGame(drawMode) {
    // Record loss if game was in progress
    if (_gameStarted) {
      Settings.recordLoss('solitaire');
      if (typeof refreshStats === 'function') refreshStats();
    }

    // Save draw mode preference
    Settings.set('sol-draw-mode', drawMode);

    // Start new engine game
    SolitaireEngine.newGame(drawMode);

    // Reset UI state
    _selectedCard = null;
    _isAutoCompleting = false;
    _isDragging = false;
    _dragState = null;
    _gameStarted = false;
    _elapsedSeconds = 0;

    // Reset timer display
    stopTimer();
    el('sol-timer').textContent = '0:00';

    // Apply settings visibility
    applySettingsVisibility();

    // Hide modals
    hideOverlay('sol-draw-modal');
    hideOverlay('sol-win-overlay');
    hideOverlay('sol-settings-modal');

    // Clean up any win animation
    var winAnim = el('sol-win-animation');
    if (winAnim) {
      winAnim.style.display = 'none';
      winAnim.innerHTML = '';
    }

    // Render the board
    render();
  }

  function applySettingsVisibility() {
    var showTimer = Settings.get('sol-show-timer', true);
    var showMoves = Settings.get('sol-show-moves', true);
    var showScoring = Settings.get('sol-scoring', true);
    var showHints = Settings.get('sol-show-hints', true);

    el('sol-timer').style.display = showTimer ? '' : 'none';
    el('sol-moves').style.display = showMoves ? '' : 'none';
    el('sol-score').style.display = showScoring ? '' : 'none';

    // Sync toggle checkboxes
    el('sol-toggle-hints').checked = showHints;
    el('sol-toggle-timer').checked = showTimer;
    el('sol-toggle-moves').checked = showMoves;
    el('sol-toggle-scoring').checked = showScoring;
  }

  // ── Overlay helpers ───────────────────────────────────────

  function showOverlay(id) {
    var overlay = el(id);
    if (overlay) overlay.classList.add('active');
  }

  function hideOverlay(id) {
    var overlay = el(id);
    if (overlay) overlay.classList.remove('active');
  }

  // ── Core Rendering ────────────────────────────────────────

  function render() {
    var state = SolitaireEngine.getState();
    if (!state) return;

    renderStock(state);
    renderWaste(state);
    renderFoundations(state);
    renderTableau(state);
    updateHeader(state);
  }

  function renderStock(state) {
    var pile = el('sol-stock');
    pile.innerHTML = '';

    if (state.stock.length > 0) {
      var card = CardRenderer.createCard('A', 'spades', false);
      card.style.cursor = 'pointer';
      card.addEventListener('click', handleStockTap);
      addTouchHandlersToStock(card);
      pile.appendChild(card);
    } else {
      var ph = CardRenderer.createPlaceholder();
      ph.style.cursor = 'pointer';
      ph.addEventListener('click', handleStockTap);
      pile.appendChild(ph);
    }
  }

  function renderWaste(state) {
    var pile = el('sol-waste');
    pile.innerHTML = '';

    if (state.waste.length === 0) {
      pile.appendChild(CardRenderer.createPlaceholder());
      return;
    }

    // Show up to 3 cards spread in draw-3 mode
    var drawMode = state.drawMode || 1;
    var showCount = drawMode === 3 ? Math.min(3, state.waste.length) : 1;
    var startIndex = state.waste.length - showCount;

    for (var i = startIndex; i < state.waste.length; i++) {
      var c = state.waste[i];
      var cardEl = CardRenderer.createCard(c.rank, c.suit, true);
      var isTop = (i === state.waste.length - 1);

      // Offset spread for draw-3
      if (showCount > 1 && i < state.waste.length - 1) {
        cardEl.style.position = 'absolute';
        cardEl.style.left = ((i - startIndex) * 18) + 'px';
        cardEl.style.zIndex = i - startIndex;
        cardEl.style.pointerEvents = 'none';
      } else if (showCount > 1) {
        cardEl.style.position = 'absolute';
        cardEl.style.left = ((i - startIndex) * 18) + 'px';
        cardEl.style.zIndex = i - startIndex;
      }

      if (isTop) {
        cardEl.setAttribute('data-zone', 'waste');
        cardEl.setAttribute('data-card-index', String(state.waste.length - 1));
        cardEl.addEventListener('click', makeCardTapHandler('waste', -1, state.waste.length - 1));
        addDragHandlers(cardEl, 'waste', -1, state.waste.length - 1);
      }

      pile.appendChild(cardEl);
    }

    // Set pile to relative for absolute children
    if (showCount > 1) {
      pile.style.position = 'relative';
      // Ensure pile wide enough
      pile.style.minWidth = ((showCount - 1) * 18 + 70) + 'px';
    } else {
      pile.style.position = '';
      pile.style.minWidth = '';
    }
  }

  function renderFoundations(state) {
    for (var f = 0; f < 4; f++) {
      var pile = el('sol-f' + f);
      pile.innerHTML = '';

      var found = state.foundations[f];
      if (found.length === 0) {
        var ph = CardRenderer.createPlaceholder();
        ph.setAttribute('data-zone', 'foundation');
        ph.setAttribute('data-col', String(f));
        ph.addEventListener('click', makeFoundationTapHandler(f));
        pile.appendChild(ph);
      } else {
        var topCard = found[found.length - 1];
        var cardEl = CardRenderer.createCard(topCard.rank, topCard.suit, true);
        cardEl.setAttribute('data-zone', 'foundation');
        cardEl.setAttribute('data-col', String(f));
        cardEl.setAttribute('data-card-index', String(found.length - 1));
        cardEl.addEventListener('click', makeCardTapHandler('foundation', f, found.length - 1));
        addDragHandlers(cardEl, 'foundation', f, found.length - 1);
        pile.appendChild(cardEl);
      }
    }
  }

  function renderTableau(state) {
    // Calculate available height for dynamic compression
    var viewportHeight = window.innerHeight;
    var headerHeight = 56;
    var topRowHeight = el('sol-top-row') ? el('sol-top-row').offsetHeight : 140;
    var tableauPadding = 16;
    var availableHeight = viewportHeight - headerHeight - topRowHeight - tableauPadding;

    for (var c = 0; c < 7; c++) {
      var colEl = el('sol-col' + c);
      colEl.innerHTML = '';
      colEl.classList.remove('valid-target');

      var col = state.tableau[c];

      if (col.length === 0) {
        var ph = CardRenderer.createPlaceholder();
        ph.setAttribute('data-zone', 'tableau');
        ph.setAttribute('data-col', String(c));
        ph.addEventListener('click', makeEmptyColumnTapHandler(c));
        colEl.appendChild(ph);
        continue;
      }

      // Calculate overlap for tall columns
      // Card aspect ratio is 5:7, so card height is roughly colWidth * 1.4
      var colWidth = colEl.offsetWidth || 100;
      var cardHeight = colWidth * 1.4;
      var defaultFaceDownOverlap = cardHeight * 0.18; // shows 18% of face-down
      var defaultFaceUpOverlap = cardHeight * 0.25;   // shows 25% of face-up

      var faceDownCount = 0;
      var faceUpCount = 0;
      for (var ci = 0; ci < col.length; ci++) {
        if (col[ci].faceUp) faceUpCount++;
        else faceDownCount++;
      }

      var neededHeight = cardHeight + (faceDownCount * defaultFaceDownOverlap) + (faceUpCount > 0 ? (faceUpCount - 1) * defaultFaceUpOverlap : 0);
      var compress = neededHeight > availableHeight && col.length > 1;

      for (var i = 0; i < col.length; i++) {
        var card = col[i];
        var cardEl = CardRenderer.createCard(card.rank, card.suit, card.faceUp);

        cardEl.setAttribute('data-zone', 'tableau');
        cardEl.setAttribute('data-col', String(c));
        cardEl.setAttribute('data-card-index', String(i));

        // Dynamic overlap compression
        if (i > 0 && compress) {
          var ratio = availableHeight / neededHeight;
          if (card.faceUp) {
            cardEl.style.marginTop = -(100 - (25 * ratio)) + '%';
          } else {
            cardEl.style.marginTop = -(100 - (18 * ratio)) + '%';
          }
        }

        if (card.faceUp) {
          cardEl.addEventListener('click', makeCardTapHandler('tableau', c, i));
          addDragHandlers(cardEl, 'tableau', c, i);
        }

        colEl.appendChild(cardEl);
      }
    }
  }

  function updateHeader(state) {
    el('sol-timer').textContent = formatTime(_elapsedSeconds);
    el('sol-moves').textContent = state.moves + ' skuiwe';
    el('sol-score').textContent = state.score + ' punte';
  }

  // ── Tap handler factories ─────────────────────────────────

  function makeCardTapHandler(zone, col, cardIndex) {
    return function(e) {
      if (_preventClick || _isAutoCompleting) return;
      e.stopPropagation();
      handleCardTap(zone, col, cardIndex, e.currentTarget);
    };
  }

  function makeFoundationTapHandler(foundIndex) {
    return function(e) {
      if (_preventClick || _isAutoCompleting) return;
      e.stopPropagation();
      handleFoundationTap(foundIndex);
    };
  }

  function makeEmptyColumnTapHandler(colIndex) {
    return function(e) {
      if (_preventClick || _isAutoCompleting) return;
      e.stopPropagation();
      handleEmptyColumnTap(colIndex);
    };
  }

  // ── Selection and Move System ─────────────────────────────

  function handleCardTap(zone, col, cardIndex, cardEl) {
    if (_isAutoCompleting) return;
    ensureTimerStarted();

    // If nothing selected: try auto-move to foundation first, else select
    if (!_selectedCard) {
      // Auto-move single card to foundation if safe
      if (zone === 'tableau' || zone === 'waste') {
        var state = SolitaireEngine.getState();
        var sourceCards;
        if (zone === 'waste') {
          sourceCards = [state.waste[state.waste.length - 1]];
        } else {
          var tcol = state.tableau[col];
          sourceCards = [];
          for (var si = cardIndex; si < tcol.length; si++) {
            sourceCards.push(tcol[si]);
          }
        }

        // Only auto-move if single card and it's safe
        if (sourceCards.length === 1) {
          var card = sourceCards[0];
          if (SolitaireEngine.canAutoMoveToFoundation(card)) {
            // Find which foundation it goes to
            for (var f = 0; f < 4; f++) {
              if (SolitaireEngine.canMoveToFoundation(card, f)) {
                var from = { zone: zone, col: col, cardIndex: cardIndex };
                var to = { zone: 'foundation', col: f };
                var result = SolitaireEngine.moveCards(from, to);
                if (result.success) {
                  _gameStarted = true;
                  Audio.play('word_found');
                  render();
                  if (result.autoComplete) startAutoComplete();
                  return;
                }
              }
            }
          }
        }
      }

      // Select the card
      selectCard(zone, col, cardIndex, cardEl);
      return;
    }

    // Tapping same card: deselect
    if (_selectedCard.zone === zone && _selectedCard.col === col && _selectedCard.cardIndex === cardIndex) {
      clearSelection();
      return;
    }

    // Try to move selected card to tapped destination
    var moved = tryMove(zone, col, cardIndex);
    if (!moved) {
      // Not a valid move: deselect current, select new card
      clearSelection();
      selectCard(zone, col, cardIndex, cardEl);
    }
  }

  function handleFoundationTap(foundIndex) {
    if (_isAutoCompleting) return;
    ensureTimerStarted();

    if (_selectedCard) {
      // Try to move selected card to this foundation
      var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
      var to = { zone: 'foundation', col: foundIndex };
      var result = SolitaireEngine.moveCards(from, to);
      if (result.success) {
        _gameStarted = true;
        Audio.play('word_found');
        clearSelection();
        render();
        if (result.autoComplete) startAutoComplete();
      } else {
        showToast('Ongeldige skuif');
        clearSelection();
      }
    } else {
      // Select top foundation card (for moving back to tableau)
      var state = SolitaireEngine.getState();
      var found = state.foundations[foundIndex];
      if (found.length > 0) {
        var pile = el('sol-f' + foundIndex);
        var cardEl = pile.querySelector('.card');
        selectCard('foundation', foundIndex, found.length - 1, cardEl);
      }
    }
  }

  function handleEmptyColumnTap(colIndex) {
    if (_isAutoCompleting) return;
    ensureTimerStarted();

    if (!_selectedCard) return;

    var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'tableau', col: colIndex };
    var result = SolitaireEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      clearSelection();
      render();
      if (result.autoComplete) startAutoComplete();
    } else {
      showToast('Ongeldige skuif');
      clearSelection();
    }
  }

  function tryMove(destZone, destCol, destCardIndex) {
    if (!_selectedCard) return false;

    var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: destZone, col: destCol };

    var result = SolitaireEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      if (to.zone === 'foundation') Audio.play('word_found');
      clearSelection();
      render();
      if (result.autoComplete) startAutoComplete();
      return true;
    }
    return false;
  }

  function selectCard(zone, col, cardIndex, cardEl) {
    _selectedCard = { zone: zone, col: col, cardIndex: cardIndex, el: cardEl };
    if (cardEl) cardEl.classList.add('selected');

    // Highlight valid destinations if enabled
    if (Settings.get('sol-show-hints', true)) {
      var moves = SolitaireEngine.getValidMoves({ zone: zone, col: col, cardIndex: cardIndex });
      for (var m = 0; m < moves.length; m++) {
        var move = moves[m];
        if (move.zone === 'tableau') {
          el('sol-col' + move.col).classList.add('valid-target');
        } else if (move.zone === 'foundation') {
          el('sol-f' + move.col).classList.add('valid-target');
        }
      }
    }
  }

  function clearSelection() {
    if (_selectedCard && _selectedCard.el) {
      _selectedCard.el.classList.remove('selected');
    }
    _selectedCard = null;
    clearHighlights();
  }

  function clearHighlights() {
    // Remove valid-target from all columns and foundations
    for (var c = 0; c < 7; c++) {
      var colEl = el('sol-col' + c);
      if (colEl) colEl.classList.remove('valid-target');
    }
    for (var f = 0; f < 4; f++) {
      var fEl = el('sol-f' + f);
      if (fEl) fEl.classList.remove('valid-target');
    }
  }

  // ── Stock handling ────────────────────────────────────────

  function handleStockTap() {
    if (_isAutoCompleting) return;
    ensureTimerStarted();
    clearSelection();

    var state = SolitaireEngine.getState();
    if (state.stock.length > 0) {
      SolitaireEngine.drawFromStock();
      _gameStarted = true;
    } else if (state.waste.length > 0) {
      SolitaireEngine.recycleWaste();
    }
    render();
  }

  function addTouchHandlersToStock(cardEl) {
    // Stock only needs tap, not drag
    cardEl.addEventListener('touchend', function(e) {
      e.preventDefault();
      handleStockTap();
    }, { passive: false });
  }

  // ── Drag and Drop ─────────────────────────────────────────

  function addDragHandlers(cardEl, zone, col, cardIndex) {
    cardEl.addEventListener('touchstart', function(e) {
      if (_isAutoCompleting) return;
      var touch = e.touches[0];
      if (!touch) return;

      _dragState = {
        startX: touch.clientX,
        startY: touch.clientY,
        zone: zone,
        col: col,
        cardIndex: cardIndex,
        floatEl: null,
        moved: false
      };
    }, { passive: true });

    cardEl.addEventListener('touchmove', function(e) {
      if (!_dragState || _isAutoCompleting) return;
      var touch = e.touches[0];
      if (!touch) return;

      var dx = touch.clientX - _dragState.startX;
      var dy = touch.clientY - _dragState.startY;

      if (!_dragState.moved && Math.sqrt(dx * dx + dy * dy) > 10) {
        _dragState.moved = true;
        _isDragging = true;
        _preventClick = true;
        startDrag(touch);
      }

      if (_dragState.moved && _dragState.floatEl) {
        e.preventDefault();
        _dragState.floatEl.style.left = (touch.clientX - _dragState.offsetX) + 'px';
        _dragState.floatEl.style.top = (touch.clientY - _dragState.offsetY) + 'px';
      }
    }, { passive: false });

    cardEl.addEventListener('touchend', function(e) {
      if (!_dragState) return;

      if (_dragState.moved && _dragState.floatEl) {
        endDrag(e);
      }

      _dragState = null;
      _isDragging = false;

      // Delay clearing prevent click to avoid tap firing
      setTimeout(function() { _preventClick = false; }, 50);
    });
  }

  function startDrag(touch) {
    if (!_dragState) return;
    clearSelection();

    var state = SolitaireEngine.getState();
    var cardsToFloat = [];

    if (_dragState.zone === 'waste') {
      var w = state.waste;
      if (w.length > 0) cardsToFloat.push(w[w.length - 1]);
    } else if (_dragState.zone === 'foundation') {
      var fnd = state.foundations[_dragState.col];
      if (fnd.length > 0) cardsToFloat.push(fnd[fnd.length - 1]);
    } else if (_dragState.zone === 'tableau') {
      var tcol = state.tableau[_dragState.col];
      for (var i = _dragState.cardIndex; i < tcol.length; i++) {
        cardsToFloat.push(tcol[i]);
      }
    }

    if (cardsToFloat.length === 0) return;

    // Create float element
    var floatEl = document.createElement('div');
    floatEl.className = 'sol-float-card';
    floatEl.style.position = 'fixed';
    floatEl.style.zIndex = '50';
    floatEl.style.pointerEvents = 'none';

    // Estimate card width from a column
    var refCol = el('sol-col0');
    var cardWidth = refCol ? refCol.offsetWidth : 100;
    floatEl.style.width = cardWidth + 'px';

    for (var j = 0; j < cardsToFloat.length; j++) {
      var c = cardsToFloat[j];
      var cardEl = CardRenderer.createCard(c.rank, c.suit, true);
      if (j > 0) {
        cardEl.style.marginTop = '-75%';
      }
      floatEl.appendChild(cardEl);
    }

    // Position at touch
    _dragState.offsetX = cardWidth / 2;
    _dragState.offsetY = 30;
    floatEl.style.left = (touch.clientX - _dragState.offsetX) + 'px';
    floatEl.style.top = (touch.clientY - _dragState.offsetY) + 'px';

    document.body.appendChild(floatEl);
    _dragState.floatEl = floatEl;

    // Dim original cards
    markDragSourceCards(true);
  }

  function endDrag(e) {
    if (!_dragState || !_dragState.floatEl) return;

    var floatEl = _dragState.floatEl;
    floatEl.style.display = 'none';

    // Find drop target
    var touch = e.changedTouches ? e.changedTouches[0] : null;
    var dropTarget = null;
    if (touch) {
      dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    }

    floatEl.style.display = '';

    // Determine destination zone/col
    var dest = findDropDestination(dropTarget);
    var moved = false;

    if (dest) {
      var from = { zone: _dragState.zone, col: _dragState.col, cardIndex: _dragState.cardIndex };
      var to = { zone: dest.zone, col: dest.col };
      var result = SolitaireEngine.moveCards(from, to);
      if (result.success) {
        moved = true;
        _gameStarted = true;
        ensureTimerStarted();
        if (to.zone === 'foundation') Audio.play('word_found');
        render();
        if (result.autoComplete) startAutoComplete();
      }
    }

    if (!moved) {
      markDragSourceCards(false);
    }

    // Remove float element
    if (floatEl.parentNode) {
      floatEl.parentNode.removeChild(floatEl);
    }
  }

  function findDropDestination(target) {
    if (!target) return null;

    // Walk up to find zone/col data attributes
    var node = target;
    var maxLevels = 5;
    while (node && maxLevels > 0) {
      // Check for tableau column
      if (node.id && node.id.match(/^sol-col(\d)$/)) {
        var colNum = parseInt(node.id.replace('sol-col', ''), 10);
        return { zone: 'tableau', col: colNum };
      }
      // Check for foundation
      if (node.id && node.id.match(/^sol-f(\d)$/)) {
        var fNum = parseInt(node.id.replace('sol-f', ''), 10);
        return { zone: 'foundation', col: fNum };
      }
      // Check data attributes
      var dzone = node.getAttribute ? node.getAttribute('data-zone') : null;
      if (dzone === 'tableau') {
        var dcol = parseInt(node.getAttribute('data-col'), 10);
        return { zone: 'tableau', col: dcol };
      }
      if (dzone === 'foundation') {
        var dcol2 = parseInt(node.getAttribute('data-col'), 10);
        return { zone: 'foundation', col: dcol2 };
      }
      node = node.parentNode;
      maxLevels--;
    }
    return null;
  }

  function markDragSourceCards(dim) {
    if (!_dragState) return;
    if (_dragState.zone === 'tableau') {
      var colEl = el('sol-col' + _dragState.col);
      if (!colEl) return;
      var cards = colEl.querySelectorAll('.card');
      for (var i = _dragState.cardIndex; i < cards.length; i++) {
        if (dim) {
          cards[i].classList.add('dragging');
        } else {
          cards[i].classList.remove('dragging');
        }
      }
    } else if (_dragState.zone === 'waste') {
      var wasteEl = el('sol-waste');
      var topCard = wasteEl ? wasteEl.querySelector('.card:last-child') : null;
      if (topCard) {
        if (dim) topCard.classList.add('dragging');
        else topCard.classList.remove('dragging');
      }
    } else if (_dragState.zone === 'foundation') {
      var fPile = el('sol-f' + _dragState.col);
      var fCard = fPile ? fPile.querySelector('.card') : null;
      if (fCard) {
        if (dim) fCard.classList.add('dragging');
        else fCard.classList.remove('dragging');
      }
    }
  }

  // ── Timer ─────────────────────────────────────────────────

  function ensureTimerStarted() {
    if (!_timerInterval && !_isAutoCompleting) {
      _timerInterval = setInterval(function() {
        _elapsedSeconds++;
        if (el('sol-timer').style.display !== 'none') {
          el('sol-timer').textContent = formatTime(_elapsedSeconds);
        }
      }, 1000);
    }
  }

  function stopTimer() {
    if (_timerInterval) {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }
  }

  // ── Undo ──────────────────────────────────────────────────

  function onUndoClick() {
    if (_isAutoCompleting) return;
    var result = SolitaireEngine.undo();
    if (result.success) {
      render();
    } else {
      showToast('Niks om te ontdoen');
    }
  }

  // ── New Game ──────────────────────────────────────────────

  function onNewGameClick() {
    var drawMode = parseInt(Settings.get('sol-draw-mode', 1), 10);
    startGame(drawMode);
  }

  // ── Settings Modal ────────────────────────────────────────

  function onSettingsOpen() {
    applySettingsVisibility();
    showOverlay('sol-settings-modal');
  }

  function onSettingsClose() {
    hideOverlay('sol-settings-modal');
  }

  // ── Auto-Complete ─────────────────────────────────────────

  function startAutoComplete() {
    _isAutoCompleting = true;
    clearSelection();

    var autoInterval = setInterval(function() {
      var step = SolitaireEngine.autoCompleteStep();
      if (step) {
        Audio.play('word_found');
        render();
      } else {
        clearInterval(autoInterval);
        // Check win
        if (SolitaireEngine.isWon()) {
          showWin();
        } else {
          _isAutoCompleting = false;
        }
      }
    }, 80);
  }

  // ── Win Sequence ──────────────────────────────────────────

  function showWin() {
    stopTimer();
    Audio.play('board_finished');

    // Record win
    Settings.recordWin('solitaire', _elapsedSeconds);
    if (typeof refreshStats === 'function') refreshStats();

    // Run cascading card animation then show overlay
    runWinAnimation(function() {
      // Build win message
      var state = SolitaireEngine.getState();
      var msg = 'Tyd: ' + formatTime(_elapsedSeconds) + ' | Skuiwe: ' + state.moves;
      if (Settings.get('sol-scoring', true)) {
        msg += ' | Punte: ' + state.score;
      }
      el('sol-win-message').textContent = msg;
      showOverlay('sol-win-overlay');
      _isAutoCompleting = false;
      _gameStarted = false;
    });
  }

  // ── Windows Cascading Card Animation ──────────────────────

  function runWinAnimation(onComplete) {
    var container = el('sol-win-animation');
    container.innerHTML = '';
    container.style.display = 'block';

    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

    // Card size - match column width
    var refCol = el('sol-col0');
    var cardWidth = refCol ? refCol.offsetWidth : 90;
    var cardHeight = cardWidth * 1.4;

    // Get foundation positions
    var foundPositions = [];
    for (var f = 0; f < 4; f++) {
      var fEl = el('sol-f' + f);
      if (fEl) {
        var rect = fEl.getBoundingClientRect();
        foundPositions.push({ x: rect.left, y: rect.top });
      } else {
        foundPositions.push({ x: containerWidth / 2, y: 50 });
      }
    }

    // Get all foundation cards
    var state = SolitaireEngine.getState();
    var allCards = [];
    for (var fi = 0; fi < 4; fi++) {
      for (var ci = state.foundations[fi].length - 1; ci >= 0; ci--) {
        allCards.push({
          card: state.foundations[fi][ci],
          foundIndex: fi
        });
      }
    }

    var cardIndex = 0;
    var activeBalls = [];
    var trailCount = 0;
    var maxTrails = 600;
    var animStartTime = Date.now();
    var animDuration = 4000;

    // Launch cards staggered
    var launchInterval = setInterval(function() {
      if (cardIndex >= allCards.length || Date.now() - animStartTime > animDuration - 500) {
        clearInterval(launchInterval);
        return;
      }

      // Limit concurrent bouncing cards
      if (activeBalls.length >= 20) return;

      var entry = allCards[cardIndex++];
      var pos = foundPositions[entry.foundIndex];

      activeBalls.push({
        card: entry.card,
        x: pos.x,
        y: pos.y,
        vx: (Math.random() - 0.5) * 10,
        vy: -(Math.random() * 6 + 2),
        bounces: 0,
        alive: true
      });
    }, 150);

    // Animation loop
    var gravity = 0.4;
    var animFrame;

    function animate() {
      if (Date.now() - animStartTime > animDuration) {
        cancelAnimationFrame(animFrame);
        clearInterval(launchInterval);
        // Clean up and call completion
        setTimeout(function() {
          container.style.display = 'none';
          container.innerHTML = '';
          if (onComplete) onComplete();
        }, 100);
        return;
      }

      for (var i = activeBalls.length - 1; i >= 0; i--) {
        var ball = activeBalls[i];
        if (!ball.alive) continue;

        ball.vy += gravity;
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Bounce off bottom
        if (ball.y > containerHeight - cardHeight) {
          ball.y = containerHeight - cardHeight;
          ball.vy *= -0.7;
          ball.bounces++;
        }

        // Bounce off sides
        if (ball.x < 0) {
          ball.x = 0;
          ball.vx = Math.abs(ball.vx);
        } else if (ball.x > containerWidth - cardWidth) {
          ball.x = containerWidth - cardWidth;
          ball.vx = -Math.abs(ball.vx);
        }

        // Stop after enough bounces
        if (ball.bounces >= 5) {
          ball.alive = false;
          continue;
        }

        // Trail effect: clone card at current position
        if (trailCount < maxTrails) {
          var trailEl = CardRenderer.createCard(ball.card.rank, ball.card.suit, true);
          trailEl.className += ' sol-win-card';
          trailEl.style.position = 'absolute';
          trailEl.style.left = ball.x + 'px';
          trailEl.style.top = ball.y + 'px';
          trailEl.style.width = cardWidth + 'px';
          trailEl.style.pointerEvents = 'none';
          container.appendChild(trailEl);
          trailCount++;
        }
      }

      // Remove dead balls
      for (var j = activeBalls.length - 1; j >= 0; j--) {
        if (!activeBalls[j].alive) activeBalls.splice(j, 1);
      }

      animFrame = requestAnimationFrame(animate);
    }

    animFrame = requestAnimationFrame(animate);
  }

  // ── Public API ────────────────────────────────────────────

  return {
    init: init,
    cleanup: cleanup,
    startGame: startGame
  };

})();

// ── Router lifecycle hooks ────────────────────────────────
Router.onEnter('solitaire', function() { SolitaireUI.init(); });
Router.onLeave('solitaire', function() { SolitaireUI.cleanup(); });
