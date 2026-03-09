/**
 * FreeCell UI -- Complete game interaction layer
 * Wires FreeCellEngine to the DOM: rendering, tap-tap, drag-drop, timer, settings, modals
 */
var FreeCellUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────

  var _els = {};                  // DOM cache
  var _timerInterval = null;      // Timer interval ID
  var _seconds = 0;               // Timer seconds
  var _selectedCard = null;       // { zone, col, cardIndex, el, cards }
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

    // Wire toolbar buttons
    el('fc-undo-btn').addEventListener('click', handleUndo);
    el('fc-restart-btn').addEventListener('click', handleRestart);
    el('fc-newgame-btn').addEventListener('click', handleNewGame);
    el('fc-settings-btn').addEventListener('click', onSettingsOpen);

    // Wire settings toggles
    el('fc-toggle-timer').addEventListener('change', function() {
      Settings.set('freecell_show_timer', this.checked);
      el('fc-timer').style.display = this.checked ? '' : 'none';
    });
    el('fc-toggle-moves').addEventListener('change', function() {
      Settings.set('freecell_show_moves', this.checked);
      el('fc-moves').style.display = this.checked ? '' : 'none';
    });
    el('fc-settings-close').addEventListener('click', function() { hideOverlay('fc-settings-modal'); });

    // Wire win overlay buttons
    el('fc-win-newgame').addEventListener('click', function() {
      hideOverlay('fc-win-overlay');
      handleNewGame();
    });
    el('fc-win-home').addEventListener('click', function() {
      hideOverlay('fc-win-overlay');
      Router.go('welcome');
    });

    // Start new game immediately (no difficulty modal for FreeCell)
    startGame();
  }

  function cleanup() {
    stopTimer();
    _selectedCard = null;
    _isAnimating = false;
    _isDragging = false;
    _dragState = null;

    // Remove event listeners
    var undoBtn = el('fc-undo-btn');
    if (undoBtn) undoBtn.removeEventListener('click', handleUndo);
    var restartBtn = el('fc-restart-btn');
    if (restartBtn) restartBtn.removeEventListener('click', handleRestart);
    var newBtn = el('fc-newgame-btn');
    if (newBtn) newBtn.removeEventListener('click', handleNewGame);

    _els = {};
  }

  // ── Game lifecycle ────────────────────────────────────────

  function startGame(dealNumber) {
    // Start new engine game
    FreeCellEngine.newGame(dealNumber);

    // Reset UI state
    _selectedCard = null;
    _isAnimating = false;
    _isDragging = false;
    _dragState = null;
    _gameStarted = false;
    _seconds = 0;

    // Reset timer
    stopTimer();
    el('fc-timer').textContent = '0:00';

    // Update deal number display
    el('fc-deal-number').textContent = 'Spel #' + FreeCellEngine.getDealNumber();

    // Apply settings visibility
    applySettingsVisibility();

    // Hide modals
    hideOverlay('fc-win-overlay');
    hideOverlay('fc-settings-modal');

    // Clean up any win animation
    var winAnim = el('fc-win-animation');
    if (winAnim) {
      winAnim.style.display = 'none';
      winAnim.innerHTML = '';
    }

    // Render the board
    render();
  }

  function applySettingsVisibility() {
    var showTimer = Settings.get('freecell_show_timer', true);
    var showMoves = Settings.get('freecell_show_moves', true);

    el('fc-timer').style.display = showTimer ? '' : 'none';
    el('fc-moves').style.display = showMoves ? '' : 'none';

    // Sync toggle checkboxes
    el('fc-toggle-timer').checked = showTimer;
    el('fc-toggle-moves').checked = showMoves;
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
    var state = FreeCellEngine.getState();
    if (!state) return;

    renderFreeCells(state);
    renderFoundations(state);
    renderTableau(state);
    updateHeader(state);
  }

  // ── Suit symbols for foundation placeholders ──────────────

  var SUIT_SYMBOLS = {
    'spades': '\u2660',
    'hearts': '\u2665',
    'diamonds': '\u2666',
    'clubs': '\u2663'
  };
  var SUIT_ORDER = ['spades', 'hearts', 'diamonds', 'clubs'];

  function renderFreeCells(state) {
    for (var i = 0; i < 4; i++) {
      var pile = el('fc-free' + i);
      pile.innerHTML = '';

      var card = state.freecells[i];
      if (!card) {
        // Empty free cell - dashed outline placeholder
        pile.classList.add('fc-empty-cell');
        pile.classList.remove('fc-has-card');
        // Add click handler for empty free cell as drop target
        pile.setAttribute('data-zone', 'freecell');
        pile.setAttribute('data-col', String(i));
        pile.addEventListener('click', makeFreeCellTapHandler(i));
      } else {
        pile.classList.remove('fc-empty-cell');
        pile.classList.add('fc-has-card');
        pile.setAttribute('data-zone', 'freecell');
        pile.setAttribute('data-col', String(i));

        var cardEl = CardRenderer.createCard(card.rank, card.suit, true);
        cardEl.setAttribute('data-zone', 'freecell');
        cardEl.setAttribute('data-col', String(i));
        cardEl.setAttribute('data-card-index', '0');
        cardEl.addEventListener('click', makeCardTapHandler('freecell', i, 0));
        addDragHandlers(cardEl, 'freecell', i, 0);
        pile.appendChild(cardEl);
      }
    }
  }

  function renderFoundations(state) {
    for (var f = 0; f < 4; f++) {
      var pile = el('fc-f' + f);
      pile.innerHTML = '';

      var found = state.foundations[f];
      if (found.length === 0) {
        // Empty foundation - show faint suit symbol
        pile.classList.add('fc-empty-found');
        pile.classList.remove('fc-has-card');
        // Show a faint suit symbol as placeholder
        var suitLabel = document.createElement('span');
        suitLabel.textContent = SUIT_SYMBOLS[SUIT_ORDER[f]];
        pile.appendChild(suitLabel);
        // Foundation is a drop target
        pile.setAttribute('data-zone', 'foundation');
        pile.setAttribute('data-col', String(f));
        pile.addEventListener('click', makeFoundationTapHandler(f));
      } else {
        pile.classList.remove('fc-empty-found');
        pile.classList.add('fc-has-card');
        pile.setAttribute('data-zone', 'foundation');
        pile.setAttribute('data-col', String(f));

        var topCard = found[found.length - 1];
        var cardEl = CardRenderer.createCard(topCard.rank, topCard.suit, true);
        cardEl.setAttribute('data-zone', 'foundation');
        cardEl.setAttribute('data-col', String(f));
        // Foundation cards are NOT tap-to-select source
        pile.addEventListener('click', makeFoundationTapHandler(f));
        pile.appendChild(cardEl);
      }
    }
  }

  function renderTableau(state) {
    // Calculate available height for tableau area
    var viewportHeight = window.innerHeight;
    var headerHeight = 56;
    var topRowHeight = el('fc-top-row') ? el('fc-top-row').offsetHeight : 140;
    var tableauPadding = 16;
    var availableHeight = viewportHeight - headerHeight - topRowHeight - tableauPadding;

    for (var c = 0; c < 8; c++) {
      var colEl = el('fc-col' + c);
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
      var colWidth = colEl.offsetWidth || 100;
      var cardHeight = colWidth * 1.4;

      // All cards in FreeCell are face-up
      var faceUpShow = Math.max(22, cardHeight * 0.22);

      // Total height needed
      var neededHeight = cardHeight + (col.length > 0 ? (col.length - 1) * faceUpShow : 0);

      // Compress if overflow
      if (neededHeight > availableHeight && col.length > 1) {
        var excessCards = col.length - 1;
        var spaceForOverlaps = availableHeight - cardHeight;
        if (spaceForOverlaps < excessCards * 12) spaceForOverlaps = excessCards * 12;
        faceUpShow = Math.max(14, spaceForOverlaps / excessCards);
      }

      for (var i = 0; i < col.length; i++) {
        var card = col[i];
        var cardEl = CardRenderer.createCard(card.rank, card.suit, true);

        cardEl.setAttribute('data-zone', 'tableau');
        cardEl.setAttribute('data-col', String(c));
        cardEl.setAttribute('data-card-index', String(i));

        // Apply overlap as pixel-based negative margin
        if (i > 0) {
          var overlap = cardHeight - faceUpShow;
          cardEl.style.marginTop = -overlap + 'px';
        }

        cardEl.addEventListener('click', makeCardTapHandler('tableau', c, i));
        addDragHandlers(cardEl, 'tableau', c, i);

        colEl.appendChild(cardEl);
      }
    }
  }

  function updateHeader(state) {
    el('fc-timer').textContent = formatTime(_seconds);
    el('fc-moves').textContent = state.moves + ' skuiwe';
    el('fc-deal-number').textContent = 'Spel #' + state.dealNumber;
  }

  // ── Tap handler factories ─────────────────────────────────

  function makeCardTapHandler(zone, col, cardIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleCardTap(zone, col, cardIndex, e.currentTarget);
    };
  }

  function makeFreeCellTapHandler(cellIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleFreeCellTap(cellIndex);
    };
  }

  function makeFoundationTapHandler(foundIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleFoundationTap(foundIndex);
    };
  }

  function makeEmptyColumnTapHandler(colIndex) {
    return function(e) {
      if (_preventClick || _isAnimating) return;
      e.stopPropagation();
      handleEmptyColumnTap(colIndex);
    };
  }

  // ── Sequence detection for multi-card moves ────────────────

  function findMovableSequenceFrom(col, cardIndex) {
    // From cardIndex downward, find the largest valid descending alternating-colour sequence
    var state = FreeCellEngine.getState();
    var column = state.tableau[col];
    if (!column || cardIndex >= column.length) return [];

    var cards = [];
    cards.push(column[cardIndex]);

    for (var i = cardIndex + 1; i < column.length; i++) {
      var prev = column[i - 1];
      var curr = column[i];
      // Must be descending rank and opposite colour
      if (rankValue(prev.rank) !== rankValue(curr.rank) + 1) break;
      if (!isOppositeColour(prev.suit, curr.suit)) break;
      cards.push(curr);
    }

    return cards;
  }

  function rankValue(rank) {
    var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    for (var i = 0; i < RANKS.length; i++) {
      if (RANKS[i] === rank) return i + 1;
    }
    return 0;
  }

  function isRed(suit) {
    return suit === 'hearts' || suit === 'diamonds';
  }

  function isOppositeColour(suit1, suit2) {
    return isRed(suit1) !== isRed(suit2);
  }

  // ── Selection and Move System ─────────────────────────────

  function handleCardTap(zone, col, cardIndex, cardEl) {
    if (_isAnimating) return;
    ensureTimerStarted();

    // ── First tap: nothing selected ──
    if (!_selectedCard) {
      if (zone === 'tableau') {
        // Auto-detect the largest valid sequence from this card down
        var seq = findMovableSequenceFrom(col, cardIndex);
        if (seq.length === 0) return;

        // Store selection with multi-card info
        _selectedCard = {
          zone: zone,
          col: col,
          cardIndex: cardIndex,
          el: cardEl,
          cards: seq
        };

        // Highlight all cards in the sequence
        highlightSelection(zone, col, cardIndex, seq.length);
      } else if (zone === 'freecell') {
        var state = FreeCellEngine.getState();
        var fcCard = state.freecells[col];
        if (!fcCard) return;

        _selectedCard = {
          zone: zone,
          col: col,
          cardIndex: 0,
          el: cardEl,
          cards: [fcCard]
        };
        cardEl.classList.add('selected');
      }
      return;
    }

    // ── Second tap on same card/group: auto-move ──
    if (_selectedCard.zone === zone && _selectedCard.col === col &&
        (zone === 'freecell' || _selectedCard.cardIndex === cardIndex)) {
      // Double-tap: try auto-move to foundation first, then free cell
      autoMoveSelected();
      return;
    }

    // ── Second tap on different target ──
    // Try to move to this card's column/position
    if (zone === 'tableau') {
      var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
      var to = { zone: 'tableau', col: col };
      var result = FreeCellEngine.moveCards(from, to);
      if (result.success) {
        _gameStarted = true;
        clearSelection();
        if (result.autoMoves > 0) {
          animateAutoFoundation(result.autoMoves, function() {
            render();
            checkWin();
          });
        } else {
          render();
          checkWin();
        }
        return;
      }
    } else if (zone === 'freecell') {
      // Tap on another freecell card: deselect old, select new
      clearSelection();
      handleCardTap(zone, col, cardIndex, cardEl);
      return;
    }

    // Invalid move: shake and deselect
    shakeSelected();
  }

  function handleFreeCellTap(cellIndex) {
    if (_isAnimating) return;
    ensureTimerStarted();

    if (!_selectedCard) return;

    // Try to move selected card to this free cell
    var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'freecell', col: cellIndex };
    var result = FreeCellEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      clearSelection();
      if (result.autoMoves > 0) {
        animateAutoFoundation(result.autoMoves, function() {
          render();
          checkWin();
        });
      } else {
        render();
        checkWin();
      }
    } else {
      shakeSelected();
    }
  }

  function handleFoundationTap(foundIndex) {
    if (_isAnimating) return;
    ensureTimerStarted();

    if (!_selectedCard) return;

    // Try to move selected card to this foundation
    var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'foundation', col: foundIndex };
    var result = FreeCellEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      Audio.play('word_found');
      clearSelection();
      if (result.autoMoves > 0) {
        animateAutoFoundation(result.autoMoves, function() {
          render();
          checkWin();
        });
      } else {
        render();
        checkWin();
      }
    } else {
      shakeSelected();
    }
  }

  function handleEmptyColumnTap(colIndex) {
    if (_isAnimating) return;
    ensureTimerStarted();

    if (!_selectedCard) return;

    var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
    var to = { zone: 'tableau', col: colIndex };
    var result = FreeCellEngine.moveCards(from, to);
    if (result.success) {
      _gameStarted = true;
      clearSelection();
      if (result.autoMoves > 0) {
        animateAutoFoundation(result.autoMoves, function() {
          render();
          checkWin();
        });
      } else {
        render();
        checkWin();
      }
    } else {
      shakeSelected();
    }
  }

  // ── Auto-move (double-tap) ────────────────────────────────

  function autoMoveSelected() {
    if (!_selectedCard) return;

    // Try foundation first (only single card)
    if (_selectedCard.cards.length === 1) {
      var from = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
      var to = { zone: 'foundation', col: 0 }; // col is ignored, engine finds correct foundation
      var result = FreeCellEngine.moveCards(from, to);
      if (result.success) {
        _gameStarted = true;
        Audio.play('word_found');
        clearSelection();
        if (result.autoMoves > 0) {
          animateAutoFoundation(result.autoMoves, function() {
            render();
            checkWin();
          });
        } else {
          render();
          checkWin();
        }
        return;
      }
    }

    // Try first empty free cell (only single card from tableau)
    if (_selectedCard.cards.length === 1 && _selectedCard.zone === 'tableau') {
      for (var i = 0; i < 4; i++) {
        var state = FreeCellEngine.getState();
        if (state.freecells[i] === null) {
          var from2 = { zone: _selectedCard.zone, col: _selectedCard.col, cardIndex: _selectedCard.cardIndex };
          var to2 = { zone: 'freecell', col: i };
          var result2 = FreeCellEngine.moveCards(from2, to2);
          if (result2.success) {
            _gameStarted = true;
            clearSelection();
            if (result2.autoMoves > 0) {
              animateAutoFoundation(result2.autoMoves, function() {
                render();
                checkWin();
              });
            } else {
              render();
              checkWin();
            }
            return;
          }
        }
      }
    }

    // Nothing worked: deselect
    clearSelection();
    render();
  }

  // ── Selection highlighting ────────────────────────────────

  function highlightSelection(zone, col, cardIndex, count) {
    if (zone === 'tableau') {
      var colEl = el('fc-col' + col);
      if (!colEl) return;
      var cards = colEl.querySelectorAll('.card');
      for (var i = cardIndex; i < cardIndex + count && i < cards.length; i++) {
        cards[i].classList.add('selected');
      }
    }
  }

  function clearSelection() {
    if (_selectedCard) {
      if (_selectedCard.zone === 'tableau') {
        var colEl = el('fc-col' + _selectedCard.col);
        if (colEl) {
          var cards = colEl.querySelectorAll('.card.selected');
          for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('selected');
          }
        }
      } else if (_selectedCard.zone === 'freecell') {
        if (_selectedCard.el) _selectedCard.el.classList.remove('selected');
      }
    }
    _selectedCard = null;
  }

  // ── Shake animation for invalid moves ─────────────────────

  function shakeSelected() {
    if (!_selectedCard) {
      clearSelection();
      return;
    }

    var elements = [];
    if (_selectedCard.zone === 'tableau') {
      var colEl = el('fc-col' + _selectedCard.col);
      if (colEl) {
        var cards = colEl.querySelectorAll('.card.selected');
        for (var i = 0; i < cards.length; i++) {
          elements.push(cards[i]);
        }
      }
    } else if (_selectedCard.zone === 'freecell') {
      if (_selectedCard.el) elements.push(_selectedCard.el);
    }

    for (var j = 0; j < elements.length; j++) {
      elements[j].classList.add('shake');
    }

    setTimeout(function() {
      for (var k = 0; k < elements.length; k++) {
        elements[k].classList.remove('shake');
      }
      clearSelection();
    }, 400);
  }

  // ── Auto-foundation fly animation ─────────────────────────

  function animateAutoFoundation(autoMoveCount, onComplete) {
    _isAnimating = true;
    // Re-render first so the board reflects the current state
    render();

    // Simple staggered animation approach: just play a quick sound per card
    var staggerDelay = 200;
    var current = 0;

    function animateNext() {
      if (current >= autoMoveCount) {
        _isAnimating = false;
        if (onComplete) onComplete();
        return;
      }
      current++;
      Audio.play('word_found');
      setTimeout(animateNext, staggerDelay);
    }

    animateNext();
  }

  // ── Win Detection ──────────────────────────────────────────

  function checkWin() {
    if (FreeCellEngine.isWon()) {
      showWin();
    }
  }

  function showWin() {
    stopTimer();
    Audio.play('board_finished');

    // Record win
    Settings.recordWin('freecell', _seconds);

    // Run win animation then show overlay
    runWinAnimation(function() {
      var state = FreeCellEngine.getState();
      var dealNum = FreeCellEngine.getDealNumber();
      var msg = 'Spel #' + dealNum + ' | Tyd: ' + formatTime(_seconds) + ' | Skuiwe: ' + state.moves;
      el('fc-win-message').textContent = msg;
      showOverlay('fc-win-overlay');
      _isAnimating = false;
      _gameStarted = false;
    });
  }

  // ── Win Animation (bouncing card trail, same as Solitaire) ─

  function runWinAnimation(onComplete) {
    var container = el('fc-win-animation');
    container.innerHTML = '';
    container.style.display = 'block';

    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

    // Card size
    var refCol = el('fc-col0');
    var cardWidth = refCol ? refCol.offsetWidth : 90;
    var cardHeight = cardWidth * 1.4;

    // Get foundation positions
    var foundPositions = [];
    for (var f = 0; f < 4; f++) {
      var fEl = el('fc-f' + f);
      if (fEl) {
        var rect = fEl.getBoundingClientRect();
        foundPositions.push({ x: rect.left, y: rect.top });
      } else {
        foundPositions.push({ x: containerWidth / 2, y: 50 });
      }
    }

    // Get all foundation cards
    var state = FreeCellEngine.getState();
    var allCards = [];
    for (var fi = 0; fi < 4; fi++) {
      for (var ci = state.foundations[fi].length - 1; ci >= 0; ci--) {
        allCards.push({
          card: state.foundations[fi][ci],
          foundIndex: fi
        });
      }
    }

    var cardIdx = 0;
    var activeBalls = [];
    var trailCount = 0;
    var maxTrails = 600;
    var animStartTime = Date.now();
    var animDuration = 4000;

    // Launch cards staggered
    var launchInterval = setInterval(function() {
      if (cardIdx >= allCards.length || Date.now() - animStartTime > animDuration - 500) {
        clearInterval(launchInterval);
        return;
      }

      if (activeBalls.length >= 20) return;

      var entry = allCards[cardIdx++];
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

  function addDragHandlers(cardEl, zone, col, cardIndex) {
    function onPointerDown(clientX, clientY) {
      if (_isAnimating) return;
      _dragState = {
        startX: clientX,
        startY: clientY,
        zone: zone,
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
      onPointerUp(t ? t.clientX : (_dragState ? _dragState.startX : 0), t ? t.clientY : (_dragState ? _dragState.startY : 0));
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

    var state = FreeCellEngine.getState();
    var cardsToFloat = [];

    if (_dragState.zone === 'freecell') {
      var fcCard = state.freecells[_dragState.col];
      if (fcCard) cardsToFloat.push(fcCard);
    } else if (_dragState.zone === 'tableau') {
      var tcol = state.tableau[_dragState.col];
      // Find movable sequence from drag start
      var seq = findMovableSequenceFrom(_dragState.col, _dragState.cardIndex);
      for (var i = 0; i < seq.length; i++) {
        cardsToFloat.push(seq[i]);
      }
    }

    if (cardsToFloat.length === 0) return;

    // Create float element
    var floatEl = document.createElement('div');
    floatEl.style.position = 'fixed';
    floatEl.style.zIndex = '50';
    floatEl.style.pointerEvents = 'none';

    var refCol = el('fc-col0');
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

    if (dest) {
      var from = { zone: _dragState.zone, col: _dragState.col, cardIndex: _dragState.cardIndex };
      var to = { zone: dest.zone, col: dest.col };
      var result = FreeCellEngine.moveCards(from, to);
      if (result.success) {
        moved = true;
        _gameStarted = true;
        ensureTimerStarted();
        if (to.zone === 'foundation') Audio.play('word_found');
        if (result.autoMoves > 0) {
          if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
          animateAutoFoundation(result.autoMoves, function() {
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
    var maxLevels = 6;
    while (node && maxLevels > 0) {
      // Check for tableau column by ID
      if (node.id && node.id.match(/^fc-col(\d)$/)) {
        var colNum = parseInt(node.id.replace('fc-col', ''), 10);
        return { zone: 'tableau', col: colNum };
      }
      // Check for foundation by ID
      if (node.id && node.id.match(/^fc-f(\d)$/)) {
        var fNum = parseInt(node.id.replace('fc-f', ''), 10);
        return { zone: 'foundation', col: fNum };
      }
      // Check for free cell by ID
      if (node.id && node.id.match(/^fc-free(\d)$/)) {
        var fcNum = parseInt(node.id.replace('fc-free', ''), 10);
        return { zone: 'freecell', col: fcNum };
      }
      // Check data attributes
      var dzone = node.getAttribute ? node.getAttribute('data-zone') : null;
      if (dzone) {
        var dcol = parseInt(node.getAttribute('data-col'), 10);
        return { zone: dzone, col: dcol };
      }
      node = node.parentNode;
      maxLevels--;
    }
    return null;
  }

  function markDragSourceCards(dim) {
    if (!_dragState) return;
    if (_dragState.zone === 'tableau') {
      var colEl = el('fc-col' + _dragState.col);
      if (!colEl) return;
      var cards = colEl.querySelectorAll('.card');
      for (var i = _dragState.cardIndex; i < cards.length; i++) {
        if (dim) {
          cards[i].classList.add('dragging');
        } else {
          cards[i].classList.remove('dragging');
        }
      }
    } else if (_dragState.zone === 'freecell') {
      var pile = el('fc-free' + _dragState.col);
      var fCard = pile ? pile.querySelector('.card') : null;
      if (fCard) {
        if (dim) fCard.classList.add('dragging');
        else fCard.classList.remove('dragging');
      }
    }
  }

  // ── Timer ─────────────────────────────────────────────────

  function ensureTimerStarted() {
    if (!_timerInterval && !_isAnimating) {
      _timerInterval = setInterval(function() {
        _seconds++;
        if (el('fc-timer').style.display !== 'none') {
          el('fc-timer').textContent = formatTime(_seconds);
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
    clearSelection();
    var result = FreeCellEngine.undo();
    if (result.success) {
      render();
    } else {
      showToast('Niks om te ontdoen');
    }
  }

  // ── Restart (same deal) ───────────────────────────────────

  function handleRestart() {
    if (_isAnimating) return;
    var dealNum = FreeCellEngine.getDealNumber();
    FreeCellEngine.restart();

    // Reset UI state
    _selectedCard = null;
    _gameStarted = false;
    _seconds = 0;
    stopTimer();
    el('fc-timer').textContent = '0:00';

    hideOverlay('fc-win-overlay');

    var winAnim = el('fc-win-animation');
    if (winAnim) {
      winAnim.style.display = 'none';
      winAnim.innerHTML = '';
    }

    render();
  }

  // ── New Game ──────────────────────────────────────────────

  function handleNewGame() {
    if (_isAnimating) return;
    startGame();
  }

  // ── Settings Modal ────────────────────────────────────────

  function onSettingsOpen() {
    applySettingsVisibility();
    showOverlay('fc-settings-modal');
  }

  // ── Public API ────────────────────────────────────────────

  return {
    init: init,
    cleanup: cleanup,
    startGame: startGame
  };

})();

// ── Router lifecycle hooks ────────────────────────────────
Router.onEnter('freecell', function() { FreeCellUI.init(); });
Router.onLeave('freecell', function() { FreeCellUI.cleanup(); });
