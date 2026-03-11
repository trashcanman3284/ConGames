/**
 * Spider Solitaire UI -- Complete game interaction layer
 * Wires SpiderEngine to the DOM: rendering, tap-tap, drag-drop, timer, settings, modals
 */
var SpiderUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────

  var _els = {};                  // DOM cache
  var _timerInterval = null;      // Timer interval ID
  var _seconds = 0;               // Timer seconds
  var _selectedCard = null;       // { col, cardIndex, el }
  var _preventClick = false;      // Prevent click after drag
  var _isDragging = false;        // Currently dragging?
  var _isAnimating = false;       // Block input during animations
  var _dragState = null;          // Drag tracking
  var _gameStarted = false;       // Has at least one move been made

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
    _isAnimating = false;
    _isDragging = false;
    _dragState = null;
    _gameStarted = false;
    _preventClick = false;
    _seconds = 0;

    // Wire difficulty modal buttons
    el('spd-diff-1suit').addEventListener('click', function() { startGame(1); });
    el('spd-diff-2suit').addEventListener('click', function() { startGame(2); });
    el('spd-diff-4suit').addEventListener('click', function() { startGame(4); });

    // Wire toolbar buttons
    el('spd-undo-btn').addEventListener('click', handleUndo);
    el('spd-newgame-btn').addEventListener('click', onNewGameClick);
    el('spd-settings-btn').addEventListener('click', onSettingsOpen);

    // Wire settings toggles
    el('spd-toggle-hints').addEventListener('change', function() {
      Settings.set('spider_show_hints', this.checked);
    });
    el('spd-toggle-timer').addEventListener('change', function() {
      Settings.set('spider_show_timer', this.checked);
      el('spd-timer').style.display = this.checked ? '' : 'none';
    });
    el('spd-toggle-moves').addEventListener('change', function() {
      Settings.set('spider_show_moves', this.checked);
      el('spd-moves').style.display = this.checked ? '' : 'none';
    });
    el('spd-toggle-scoring').addEventListener('change', function() {
      Settings.set('spider_show_scoring', this.checked);
      el('spd-score').style.display = this.checked ? '' : 'none';
    });
    el('spd-settings-close').addEventListener('click', function() { hideOverlay('spd-settings-modal'); });

    // Wire win overlay buttons
    el('spd-win-newgame').addEventListener('click', function() {
      hideOverlay('spd-win-overlay');
      onNewGameClick();
    });
    el('spd-win-home').addEventListener('click', function() {
      hideOverlay('spd-win-overlay');
      Router.go('welcome');
    });

    // Wire stock pile click
    var stockEl = el('spd-stock');
    if (stockEl) {
      stockEl.addEventListener('click', _stockClickHandler);
    }

    // Show difficulty modal on first entry
    var savedMode = Settings.get('spider_suitMode', null);
    if (savedMode) {
      startGame(parseInt(savedMode, 10));
    } else {
      showOverlay('spd-difficulty-modal');
    }
  }

  function _stockClickHandler(e) {
    // Only handle if clicked on stock area or a card in stock
    handleDeal();
  }

  function cleanup() {
    stopTimer();
    _selectedCard = null;
    _isAnimating = false;
    _isDragging = false;
    _dragState = null;

    // Remove event listeners
    var undoBtn = el('spd-undo-btn');
    if (undoBtn) undoBtn.removeEventListener('click', handleUndo);
    var newBtn = el('spd-newgame-btn');
    if (newBtn) newBtn.removeEventListener('click', onNewGameClick);
    var stockEl = el('spd-stock');
    if (stockEl) stockEl.removeEventListener('click', _stockClickHandler);

    _els = {};
  }

  // ── Game lifecycle ────────────────────────────────────────

  function startGame(suitMode) {
    suitMode = suitMode || 1;

    // Start new engine game
    SpiderEngine.newGame(suitMode);

    // Reset UI state
    _selectedCard = null;
    _isAnimating = false;
    _isDragging = false;
    _dragState = null;
    _gameStarted = false;
    _seconds = 0;

    // Reset timer
    stopTimer();
    el('spd-timer').textContent = '0:00';

    // Persist suit mode
    Settings.set('spider_suitMode', suitMode);

    // Apply settings visibility
    applySettingsVisibility();

    // Hide modals
    hideOverlay('spd-difficulty-modal');
    hideOverlay('spd-win-overlay');
    hideOverlay('spd-settings-modal');

    // Clean up any win animation
    var winAnim = el('spd-win-animation');
    if (winAnim) {
      winAnim.style.display = 'none';
      winAnim.innerHTML = '';
    }

    // Render the board
    render();
  }

  function applySettingsVisibility() {
    var showHints = Settings.get('spider_show_hints', true);
    var showTimer = Settings.get('spider_show_timer', true);
    var showMoves = Settings.get('spider_show_moves', true);
    var showScoring = Settings.get('spider_show_scoring', true);

    el('spd-timer').style.display = showTimer ? '' : 'none';
    el('spd-moves').style.display = showMoves ? '' : 'none';
    el('spd-score').style.display = showScoring ? '' : 'none';

    // Sync toggle checkboxes
    el('spd-toggle-hints').checked = showHints;
    el('spd-toggle-timer').checked = showTimer;
    el('spd-toggle-moves').checked = showMoves;
    el('spd-toggle-scoring').checked = showScoring;
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
    var state = SpiderEngine.getState();
    if (!state) return;

    renderTableau(state);
    renderFoundations(state);
    renderStock(state);
    updateHeader(state);
  }

  function renderTableau(state) {
    // Calculate available height for tableau area from actual DOM elements
    var viewportHeight = window.innerHeight;
    var headerEl = document.querySelector('#screen-spider .game-header');
    var bottomEl = el('spd-bottom-row');
    var headerHeight = headerEl ? headerEl.offsetHeight : 56;
    var bottomRowHeight = bottomEl ? bottomEl.offsetHeight : 92;
    var tableauPadding = 8;
    var availableHeight = viewportHeight - headerHeight - bottomRowHeight - tableauPadding;

    for (var c = 0; c < 10; c++) {
      var colEl = el('spd-col' + c);
      colEl.innerHTML = '';

      var col = state.tableau[c];

      if (col.length === 0) {
        var ph = CardRenderer.createPlaceholder();
        ph.setAttribute('data-zone', 'tableau');
        ph.setAttribute('data-col', String(c));
        ph.addEventListener('click', makeEmptyColumnTapHandler(c));
        colEl.appendChild(ph);
        continue;
      }

      // Card dimensions from actual column width
      var colWidth = colEl.offsetWidth || 80;
      var cardHeight = colWidth * 1.4;

      // Count face-up and face-down cards
      var faceDownCount = 0;
      var faceUpCount = 0;
      for (var ci = 0; ci < col.length; ci++) {
        if (col[ci].faceUp) faceUpCount++;
        else faceDownCount++;
      }

      // Default visible portions
      var faceDownShow = Math.max(6, cardHeight * 0.08);
      var faceUpShow = Math.max(16, cardHeight * 0.18);

      // Total height needed
      var neededHeight = cardHeight
        + (faceDownCount * faceDownShow)
        + (faceUpCount > 0 ? (faceUpCount - 1) * faceUpShow : 0);

      // Compress if overflow
      if (neededHeight > availableHeight && col.length > 1) {
        var excessCards = col.length - 1;
        var spaceForOverlaps = availableHeight - cardHeight;
        if (spaceForOverlaps < excessCards * 6) spaceForOverlaps = excessCards * 6;
        faceDownShow = Math.max(4, (spaceForOverlaps * 0.25) / Math.max(1, faceDownCount));
        faceUpShow = Math.max(10, (spaceForOverlaps * 0.75) / Math.max(1, faceUpCount > 0 ? faceUpCount - 1 : 1));
      }

      for (var i = 0; i < col.length; i++) {
        var card = col[i];
        var cardEl = CardRenderer.createCard(card.rank, card.suit, card.faceUp);

        cardEl.setAttribute('data-zone', 'tableau');
        cardEl.setAttribute('data-col', String(c));
        cardEl.setAttribute('data-card-index', String(i));

        // Apply overlap as pixel-based negative margin
        if (i > 0) {
          var show = card.faceUp ? faceUpShow : faceDownShow;
          var overlap = cardHeight - show;
          cardEl.style.marginTop = -overlap + 'px';
        }

        if (card.faceUp) {
          cardEl.addEventListener('click', makeCardTapHandler(c, i));
          addDragHandlers(cardEl, c, i);
        }

        colEl.appendChild(cardEl);
      }
    }
  }

  function renderFoundations(state) {
    var foundEl = el('spd-foundations');
    foundEl.innerHTML = '';

    if (state.foundations.length === 0) {
      // Show an empty placeholder label
      var label = document.createElement('span');
      label.style.color = 'var(--text-muted)';
      label.style.fontSize = '0.8rem';
      label.textContent = '';
      foundEl.appendChild(label);
      return;
    }

    for (var f = 0; f < state.foundations.length; f++) {
      var pile = document.createElement('div');
      pile.className = 'spd-foundation-pile';

      // Show top card (King) of each completed sequence
      var seq = state.foundations[f];
      if (seq.length > 0) {
        var topCard = seq[0]; // King is first in the stored sequence
        var cardEl = CardRenderer.createCard(topCard.rank, topCard.suit, true);
        pile.appendChild(cardEl);
      }

      foundEl.appendChild(pile);
    }
  }

  function renderStock(state) {
    var stockEl = el('spd-stock');
    stockEl.innerHTML = '';

    if (state.dealsRemaining <= 0) {
      // Empty placeholder
      var ph = CardRenderer.createPlaceholder();
      ph.className = 'spd-stock-pile';
      ph.style.opacity = '0.3';
      stockEl.appendChild(ph);
      return;
    }

    // Show stacked face-down piles for remaining deals
    // First pile is relative (sets container size), rest are absolute with slight offsets
    for (var d = 0; d < state.dealsRemaining; d++) {
      var pile = document.createElement('div');
      pile.className = 'spd-stock-pile';

      if (d === 0) {
        pile.style.position = 'relative';
      } else {
        pile.style.position = 'absolute';
        pile.style.left = (d * 3) + 'px';
        pile.style.top = (d * -2) + 'px';
      }

      var cardEl = CardRenderer.createCard('A', 'spades', false);
      pile.appendChild(cardEl);

      stockEl.appendChild(pile);
    }
  }

  function updateHeader(state) {
    el('spd-timer').textContent = formatTime(_seconds);
    el('spd-moves').textContent = state.moves + ' skuiwe';
    el('spd-score').textContent = state.score + ' punte';
  }

  // ── Tap handler factories ─────────────────────────────────

  function makeCardTapHandler(col, cardIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleCardTap(col, cardIndex, e.currentTarget);
    };
  }

  function makeEmptyColumnTapHandler(colIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleEmptyColumnTap(colIndex);
    };
  }

  // ── Selection and Move System ─────────────────────────────

  function handleCardTap(col, cardIndex, cardEl) {
    if (_isAnimating) return;
    ensureTimerStarted();

    // If nothing selected: select this card (if it starts a movable sequence)
    if (!_selectedCard) {
      if (SpiderEngine.isMovableSequence(col, cardIndex)) {
        selectCard(col, cardIndex, cardEl);
      }
      return;
    }

    // Tapping same card: deselect
    if (_selectedCard.col === col && _selectedCard.cardIndex === cardIndex) {
      clearSelection();
      return;
    }

    // Try to move to this column
    var moved = tryMove(col);
    if (!moved) {
      // Deselect and select new card if it's movable
      clearSelection();
      if (SpiderEngine.isMovableSequence(col, cardIndex)) {
        selectCard(col, cardIndex, cardEl);
      }
    }
  }

  function handleEmptyColumnTap(colIndex) {
    if (_isAnimating) return;
    ensureTimerStarted();

    if (!_selectedCard) return;

    // Try to move selected card to empty column
    var from = { zone: 'tableau', col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'tableau', col: colIndex };
    var result = SpiderEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      clearSelection();
      if (result.sequenceCompleted) {
        animateSequenceCompletion(colIndex, function() {
          render();
          checkWin();
        });
      } else {
        render();
      }
    } else {
      showToast('Ongeldige skuif');
      clearSelection();
    }
  }

  function tryMove(destCol) {
    if (!_selectedCard) return false;

    var from = { zone: 'tableau', col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'tableau', col: destCol };

    var result = SpiderEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      clearSelection();
      if (result.sequenceCompleted) {
        animateSequenceCompletion(destCol, function() {
          render();
          checkWin();
        });
      } else {
        render();
        checkWin();
      }
      return true;
    }
    return false;
  }

  function selectCard(col, cardIndex, cardEl) {
    _selectedCard = { col: col, cardIndex: cardIndex, el: cardEl };

    // Highlight selected card and all cards below in the sequence
    var colEl = el('spd-col' + col);
    if (colEl) {
      var cards = colEl.querySelectorAll('.card');
      for (var i = cardIndex; i < cards.length; i++) {
        cards[i].classList.add('selected');
      }
    }

    // Highlight valid destination columns if hints enabled
    if (Settings.get('spider_show_hints', true)) {
      var moves = SpiderEngine.getValidMoves(col, cardIndex);
      for (var m = 0; m < moves.length; m++) {
        var destEl = el('spd-col' + moves[m]);
        if (destEl) destEl.classList.add('valid-target');
      }
    }
  }

  function clearSelection() {
    if (_selectedCard) {
      var colEl = el('spd-col' + _selectedCard.col);
      if (colEl) {
        var cards = colEl.querySelectorAll('.card.selected');
        for (var i = 0; i < cards.length; i++) {
          cards[i].classList.remove('selected');
        }
      }
    }
    _selectedCard = null;

    // Remove valid-target highlights from all columns
    for (var c = 0; c < 10; c++) {
      var col = el('spd-col' + c);
      if (col) col.classList.remove('valid-target');
    }
  }

  // ── Stock / Deal handling ──────────────────────────────────

  function handleDeal() {
    if (_isAnimating) return;
    ensureTimerStarted();
    clearSelection();

    var result = SpiderEngine.dealFromStock();
    if (result.success) {
      _gameStarted = true;
      // Animate dealing cards to each column
      animateDeal(result.cards, function() {
        render();
        checkWin();
      });
    } else if (result.reason === 'empty_column') {
      showToast('Vul alle kolomme eers');
    } else if (result.reason === 'empty') {
      showToast('Geen kaarte oor nie');
    }
  }

  // ── Deal Animation ─────────────────────────────────────────

  function animateDeal(cards, onComplete) {
    _isAnimating = true;

    // Get stock position for animation origin
    var stockEl = el('spd-stock');
    var stockRect = stockEl.getBoundingClientRect();
    var originX = stockRect.left + stockRect.width / 2;
    var originY = stockRect.top + stockRect.height / 2;

    var colCount = 0;

    function dealNext() {
      if (colCount >= 10) {
        _isAnimating = false;
        if (onComplete) onComplete();
        return;
      }

      var card = cards[colCount];
      var colIdx = colCount;
      colCount++;

      // Get target column position
      var colEl = el('spd-col' + colIdx);
      var colRect = colEl.getBoundingClientRect();
      var targetX = colRect.left + colRect.width / 2;
      var targetY = colRect.top + colRect.height / 2;

      // Create flying card element
      var flyCard = CardRenderer.createCard(card.rank, card.suit, true);
      flyCard.style.position = 'fixed';
      flyCard.style.zIndex = '60';
      flyCard.style.width = (colEl.offsetWidth || 80) + 'px';
      flyCard.style.pointerEvents = 'none';
      flyCard.style.left = originX + 'px';
      flyCard.style.top = originY + 'px';
      flyCard.style.transition = 'left 0.25s ease-out, top 0.25s ease-out, opacity 0.15s';
      flyCard.style.opacity = '0.9';

      document.body.appendChild(flyCard);

      // Trigger animation
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          flyCard.style.left = targetX - (colEl.offsetWidth / 2) + 'px';
          flyCard.style.top = targetY + 'px';
        });
      });

      // Remove after animation
      setTimeout(function() {
        if (flyCard.parentNode) flyCard.parentNode.removeChild(flyCard);
      }, 300);

      // Stagger next card
      setTimeout(dealNext, 60);
    }

    dealNext();
  }

  // ── Sequence Completion Animation ──────────────────────────

  function animateSequenceCompletion(colIndex, onComplete) {
    _isAnimating = true;

    // Get foundation target position (bottom-left)
    var foundEl = el('spd-foundations');
    var foundRect = foundEl.getBoundingClientRect();
    var targetX = foundRect.left + foundRect.width;
    var targetY = foundRect.top + foundRect.height / 2;

    // Get source column position
    var colEl = el('spd-col' + colIndex);
    var colRect = colEl.getBoundingClientRect();

    // Play sound
    Audio.play('word_found');

    // Simple flash animation then complete
    colEl.style.transition = 'opacity 0.3s';
    colEl.style.opacity = '0.5';

    setTimeout(function() {
      colEl.style.opacity = '1';
      colEl.style.transition = '';
      _isAnimating = false;
      if (onComplete) onComplete();
    }, 400);
  }

  // ── Win Detection ──────────────────────────────────────────

  function checkWin() {
    if (SpiderEngine.isWon()) {
      showWin();
    }
  }

  function showWin() {
    stopTimer();
    Audio.play('board_finished');

    // Record win
    Settings.recordWin('spider', _seconds);

    // Run win animation then show overlay
    runWinAnimation(function() {
      var state = SpiderEngine.getState();
      var msg = 'Tyd: ' + formatTime(_seconds) + ' | Skuiwe: ' + state.moves;
      if (Settings.get('spider_show_scoring', true)) {
        msg += ' | Punte: ' + state.score;
      }
      el('spd-win-message').textContent = msg;
      showOverlay('spd-win-overlay');
      _isAnimating = false;
      _gameStarted = false;
    });
  }

  // ── Win Animation (bouncing card trail, same as Solitaire) ─

  function runWinAnimation(onComplete) {
    var container = el('spd-win-animation');
    container.innerHTML = '';
    container.style.display = 'block';

    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

    // Card size
    var refCol = el('spd-col0');
    var cardWidth = refCol ? refCol.offsetWidth : 80;
    var cardHeight = cardWidth * 1.4;

    // Get foundation positions
    var foundEl = el('spd-foundations');
    var foundRect = foundEl.getBoundingClientRect();
    var startX = foundRect.left || containerWidth / 4;
    var startY = foundRect.top || containerHeight - 80;

    // Create bouncing cards
    var state = SpiderEngine.getState();
    var allCards = [];
    for (var fi = 0; fi < state.foundations.length; fi++) {
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

      if (activeBalls.length >= 20) return;

      var entry = allCards[cardIndex++];
      activeBalls.push({
        card: entry.card,
        x: startX + entry.foundIndex * 44,
        y: startY,
        vx: (Math.random() - 0.5) * 10,
        vy: -(Math.random() * 6 + 2),
        bounces: 0,
        alive: true
      });
    }, 150);

    var gravity = 0.4;
    var animFrame;

    function animate() {
      if (Date.now() - animStartTime > animDuration) {
        cancelAnimationFrame(animFrame);
        clearInterval(launchInterval);
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

        if (ball.y > containerHeight - cardHeight) {
          ball.y = containerHeight - cardHeight;
          ball.vy *= -0.7;
          ball.bounces++;
        }

        if (ball.x < 0) {
          ball.x = 0;
          ball.vx = Math.abs(ball.vx);
        } else if (ball.x > containerWidth - cardWidth) {
          ball.x = containerWidth - cardWidth;
          ball.vx = -Math.abs(ball.vx);
        }

        if (ball.bounces >= 5) {
          ball.alive = false;
          continue;
        }

        if (trailCount < maxTrails) {
          var trailEl = CardRenderer.createCard(ball.card.rank, ball.card.suit, true);
          trailEl.style.position = 'absolute';
          trailEl.style.left = ball.x + 'px';
          trailEl.style.top = ball.y + 'px';
          trailEl.style.width = cardWidth + 'px';
          trailEl.style.pointerEvents = 'none';
          container.appendChild(trailEl);
          trailCount++;
        }
      }

      for (var j = activeBalls.length - 1; j >= 0; j--) {
        if (!activeBalls[j].alive) activeBalls.splice(j, 1);
      }

      animFrame = requestAnimationFrame(animate);
    }

    animFrame = requestAnimationFrame(animate);
  }

  // ── Drag and Drop ─────────────────────────────────────────

  function addDragHandlers(cardEl, col, cardIndex) {
    function onPointerDown(clientX, clientY) {
      if (_isAnimating) return;
      // Only start drag if this card starts a movable sequence
      if (!SpiderEngine.isMovableSequence(col, cardIndex)) return;

      _dragState = {
        startX: clientX,
        startY: clientY,
        col: col,
        cardIndex: cardIndex,
        floatEl: null,
        moved: false
      };
    }

    function onPointerMove(clientX, clientY, preventFn) {
      if (!_dragState || _isAnimating) return;
      var dx = clientX - _dragState.startX;
      var dy = clientY - _dragState.startY;

      if (!_dragState.moved && Math.sqrt(dx * dx + dy * dy) > 10) {
        _dragState.moved = true;
        _isDragging = true;
        _preventClick = true;
        startDrag({ clientX: clientX, clientY: clientY });
      }

      if (_dragState.moved && _dragState.floatEl) {
        if (preventFn) preventFn();
        _dragState.floatEl.style.left = (clientX - _dragState.offsetX) + 'px';
        _dragState.floatEl.style.top = (clientY - _dragState.offsetY) + 'px';
      }
    }

    function onPointerUp(clientX, clientY) {
      if (!_dragState) return;
      if (_dragState.moved && _dragState.floatEl) {
        endDrag(clientX, clientY);
      }
      _dragState = null;
      _isDragging = false;
      setTimeout(function() { _preventClick = false; }, 50);
    }

    // Touch events
    cardEl.addEventListener('touchstart', function(e) {
      var t = e.touches[0];
      if (t) onPointerDown(t.clientX, t.clientY);
    }, { passive: true });

    cardEl.addEventListener('touchmove', function(e) {
      var t = e.touches[0];
      if (t) onPointerMove(t.clientX, t.clientY, function() { e.preventDefault(); });
    }, { passive: false });

    cardEl.addEventListener('touchend', function(e) {
      var t = e.changedTouches ? e.changedTouches[0] : null;
      onPointerUp(t ? t.clientX : _dragState.startX, t ? t.clientY : _dragState.startY);
    });

    // Mouse events
    cardEl.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      onPointerDown(e.clientX, e.clientY);

      function onMouseMove(ev) {
        onPointerMove(ev.clientX, ev.clientY, function() { ev.preventDefault(); });
      }
      function onMouseUp(ev) {
        onPointerUp(ev.clientX, ev.clientY);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
  }

  function startDrag(touch) {
    if (!_dragState) return;
    clearSelection();

    var state = SpiderEngine.getState();
    var cardsToFloat = [];
    var tcol = state.tableau[_dragState.col];
    for (var i = _dragState.cardIndex; i < tcol.length; i++) {
      cardsToFloat.push(tcol[i]);
    }

    if (cardsToFloat.length === 0) return;

    // Create float element
    var floatEl = document.createElement('div');
    floatEl.style.position = 'fixed';
    floatEl.style.zIndex = '50';
    floatEl.style.pointerEvents = 'none';

    var refCol = el('spd-col0');
    var cardWidth = refCol ? refCol.offsetWidth : 80;
    floatEl.style.width = cardWidth + 'px';

    for (var j = 0; j < cardsToFloat.length; j++) {
      var c = cardsToFloat[j];
      var cardEl = CardRenderer.createCard(c.rank, c.suit, true);
      if (j > 0) {
        cardEl.style.marginTop = '-75%';
      }
      floatEl.appendChild(cardEl);
    }

    _dragState.offsetX = cardWidth / 2;
    _dragState.offsetY = 30;
    floatEl.style.left = (touch.clientX - _dragState.offsetX) + 'px';
    floatEl.style.top = (touch.clientY - _dragState.offsetY) + 'px';

    document.body.appendChild(floatEl);
    _dragState.floatEl = floatEl;

    // Dim original cards
    markDragSourceCards(true);
  }

  function endDrag(clientX, clientY) {
    if (!_dragState || !_dragState.floatEl) return;

    var floatEl = _dragState.floatEl;
    floatEl.style.display = 'none';

    var dropTarget = document.elementFromPoint(clientX, clientY);
    floatEl.style.display = '';

    var dest = findDropDestination(dropTarget);
    var moved = false;

    if (dest !== null) {
      var from = { zone: 'tableau', col: _dragState.col, cardIndex: _dragState.cardIndex };
      var to = { zone: 'tableau', col: dest };
      var result = SpiderEngine.moveCards(from, to);
      if (result.success) {
        moved = true;
        _gameStarted = true;
        ensureTimerStarted();
        if (result.sequenceCompleted) {
          // Remove float first
          if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
          animateSequenceCompletion(dest, function() {
            render();
            checkWin();
          });
          return;
        }
        render();
        checkWin();
      }
    }

    if (!moved) {
      markDragSourceCards(false);
    }

    if (floatEl.parentNode) {
      floatEl.parentNode.removeChild(floatEl);
    }
  }

  function findDropDestination(target) {
    if (!target) return null;

    var node = target;
    var maxLevels = 5;
    while (node && maxLevels > 0) {
      // Check for tableau column by ID
      if (node.id && node.id.match(/^spd-col(\d+)$/)) {
        return parseInt(node.id.replace('spd-col', ''), 10);
      }
      // Check data attributes
      var dzone = node.getAttribute ? node.getAttribute('data-zone') : null;
      if (dzone === 'tableau') {
        var dcol = node.getAttribute('data-col');
        if (dcol !== null) return parseInt(dcol, 10);
      }
      node = node.parentNode;
      maxLevels--;
    }
    return null;
  }

  function markDragSourceCards(dim) {
    if (!_dragState) return;
    var colEl = el('spd-col' + _dragState.col);
    if (!colEl) return;
    var cards = colEl.querySelectorAll('.card');
    for (var i = _dragState.cardIndex; i < cards.length; i++) {
      if (dim) {
        cards[i].classList.add('dragging');
      } else {
        cards[i].classList.remove('dragging');
      }
    }
  }

  // ── Timer ─────────────────────────────────────────────────

  function ensureTimerStarted() {
    if (!_timerInterval && !_isAnimating) {
      _timerInterval = setInterval(function() {
        _seconds++;
        if (el('spd-timer').style.display !== 'none') {
          el('spd-timer').textContent = formatTime(_seconds);
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

  function handleUndo() {
    if (_isAnimating) return;
    var result = SpiderEngine.undo();
    if (result.success) {
      render();
    } else {
      showToast('Niks om te ontdoen');
    }
  }

  // ── New Game ──────────────────────────────────────────────

  function onNewGameClick() {
    showOverlay('spd-difficulty-modal');
  }

  // ── Settings Modal ────────────────────────────────────────

  function onSettingsOpen() {
    applySettingsVisibility();
    showOverlay('spd-settings-modal');
  }

  // ── Public API ────────────────────────────────────────────

  return {
    init: init,
    cleanup: cleanup,
    startGame: startGame
  };

})();

// ── Router lifecycle hooks ────────────────────────────────
Router.onEnter('spider', function() { SpiderUI.init(); });
Router.onLeave('spider', function() { SpiderUI.cleanup(); });
