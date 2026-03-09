/**
 * Woord Soek UI — Full game interaction layer
 * Wires WoordSoekEngine to the DOM, handles taps, game flow, timer, hints, modals
 */
var WoordSoekUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────

  var _words = null;           // filtered word array (loaded once)
  var _puzzle = null;          // current puzzle object from engine
  var _foundWords = null;      // Set of found word strings
  var _foundCount = 0;
  var _selectionState = 'idle'; // 'idle' | 'first_selected'
  var _firstCell = null;       // { row, col } or null
  var _timerInterval = null;
  var _elapsedSeconds = 0;
  var _currentDifficulty = 'medium';
  var _isBelow = false;
  var _gameActive = false;

  // Drag-to-select state
  var _isDragging = false;
  var _dragStartCell = null;
  var _lastDragRow = null;
  var _lastDragCol = null;
  var _justCompletedDrag = false;

  // ── DOM references (cached after first use) ────────────────

  var _els = {};

  function el(id) {
    if (!_els[id]) {
      _els[id] = document.getElementById(id);
    }
    return _els[id];
  }

  // ── Initialization ─────────────────────────────────────────

  function init() {
    _els = {}; // reset DOM cache
    _foundWords = new Set();
    _foundCount = 0;
    _selectionState = 'idle';
    _firstCell = null;
    _gameActive = false;

    // Read layout preference
    _isBelow = Settings.get('ws-layout-below', false);
    if (_isBelow) {
      el('ws-layout').classList.add('layout-below');
    } else {
      el('ws-layout').classList.remove('layout-below');
    }

    // Load words if not cached
    if (_words) {
      showDifficultyModal();
    } else {
      fetch('words.json')
        .then(function(r) { return r.json(); })
        .then(function(allWords) {
          _words = WoordSoekEngine.filterWords(allWords);
          showDifficultyModal();
        })
        .catch(function(err) {
          console.error('WoordSoekUI: Failed to load words.json', err);
          if (typeof showToast === 'function') {
            showToast('Kon nie woordlys laai nie');
          }
        });
    }
  }

  function cleanup() {
    stopTimer();
    _selectionState = 'idle';
    _firstCell = null;
    _gameActive = false;
    _isDragging = false;
    _dragStartCell = null;
    _lastDragRow = null;
    _lastDragCol = null;
    _justCompletedDrag = false;
    clearPreview();
  }

  // ── Difficulty Modal ───────────────────────────────────────

  function showDifficultyModal() {
    // If game is active and words have been found, confirm first
    if (_gameActive && _foundCount > 0) {
      el('ws-confirm-modal').classList.add('active');
      _gameActive = false;
      return;
    }

    // Hide win overlay if showing
    el('ws-win-overlay').classList.remove('active');
    el('ws-confirm-modal').classList.remove('active');

    // Pre-highlight last difficulty
    var lastDiff = Settings.get('ws-difficulty', 'medium');
    var diffBtns = ['ws-diff-easy', 'ws-diff-medium', 'ws-diff-hard'];
    var diffKeys = ['easy', 'medium', 'hard'];
    for (var i = 0; i < diffBtns.length; i++) {
      var btn = el(diffBtns[i]);
      if (btn) {
        if (diffKeys[i] === lastDiff) {
          btn.classList.add('ws-diff-selected');
        } else {
          btn.classList.remove('ws-diff-selected');
        }
      }
    }

    // Show cancel button only if a game is already in progress
    var cancelBtn = el('ws-diff-cancel');
    if (cancelBtn) {
      cancelBtn.style.display = _puzzle ? 'block' : 'none';
    }

    el('ws-difficulty-modal').classList.add('active');
    _gameActive = false;
  }

  function closeDifficultyModal() {
    el('ws-difficulty-modal').classList.remove('active');
    _gameActive = true;
  }

  // ── Confirm New Puzzle ─────────────────────────────────────

  function confirmNewPuzzle() {
    el('ws-confirm-modal').classList.remove('active');
    // Now show difficulty modal directly (skip the mid-game check)
    el('ws-win-overlay').classList.remove('active');

    var lastDiff = Settings.get('ws-difficulty', 'medium');
    var diffBtns = ['ws-diff-easy', 'ws-diff-medium', 'ws-diff-hard'];
    var diffKeys = ['easy', 'medium', 'hard'];
    for (var i = 0; i < diffBtns.length; i++) {
      var btn = el(diffBtns[i]);
      if (btn) {
        if (diffKeys[i] === lastDiff) {
          btn.classList.add('ws-diff-selected');
        } else {
          btn.classList.remove('ws-diff-selected');
        }
      }
    }

    el('ws-difficulty-modal').classList.add('active');
    _gameActive = false;
  }

  function closeConfirmModal() {
    el('ws-confirm-modal').classList.remove('active');
    _gameActive = true;
  }

  // ── Start Game ─────────────────────────────────────────────

  function startGame(difficulty) {
    // Hide difficulty modal
    el('ws-difficulty-modal').classList.remove('active');

    // Save difficulty
    Settings.set('ws-difficulty', difficulty);
    _currentDifficulty = difficulty;

    // Generate puzzle
    _puzzle = WoordSoekEngine.generatePuzzle(_words, difficulty);

    // Reset state
    _foundWords = new Set();
    _foundCount = 0;
    _selectionState = 'idle';
    _firstCell = null;
    _elapsedSeconds = 0;
    _gameActive = true;

    // Set grid columns
    var grid = el('ws-grid');
    grid.style.gridTemplateColumns = 'repeat(' + _puzzle.cols + ', 1fr)';

    // Render
    renderGrid();
    renderWordList();

    // Update counter
    el('ws-counter').textContent = '0 / ' + _puzzle.placedWords.length;

    // Reset and start timer
    el('ws-timer').textContent = '0:00';
    startTimer();
  }

  // ── Grid Rendering ─────────────────────────────────────────

  function renderGrid() {
    var grid = el('ws-grid');
    grid.innerHTML = '';

    for (var r = 0; r < _puzzle.rows; r++) {
      for (var c = 0; c < _puzzle.cols; c++) {
        var cell = document.createElement('div');
        cell.className = 'ws-cell';
        cell.textContent = _puzzle.grid[r][c];
        cell.setAttribute('data-row', r);
        cell.setAttribute('data-col', c);
        cell.addEventListener('click', _makeTapHandler(r, c));
        grid.appendChild(cell);
      }
    }

    // Drag-to-select + preview line handlers on grid container
    grid.addEventListener('touchstart', onGridTouchStart, { passive: true });
    grid.addEventListener('touchmove', onTouchMove, { passive: true });
    grid.addEventListener('mousemove', onMouseMove);
    grid.addEventListener('touchend', onTouchEnd);
  }

  function _makeTapHandler(r, c) {
    return function() { onCellTap(r, c); };
  }

  // ── Word List Rendering ────────────────────────────────────

  function renderWordList() {
    var list = el('ws-word-list');
    list.innerHTML = '';

    // Sort words alphabetically for display
    var sorted = _puzzle.placedWords.slice().sort(function(a, b) {
      return a.word.localeCompare(b.word);
    });

    for (var i = 0; i < sorted.length; i++) {
      var span = document.createElement('span');
      span.className = 'ws-word-item';
      span.textContent = sorted[i].word;
      span.setAttribute('data-word', sorted[i].word);
      list.appendChild(span);
    }
  }

  // ── Tap-Tap Selection ──────────────────────────────────────

  function onCellTap(row, col) {
    if (_justCompletedDrag) return;
    if (!_gameActive) return;

    if (_selectionState === 'idle') {
      // First tap
      _firstCell = { row: row, col: col };
      _selectionState = 'first_selected';
      addClassToCell(row, col, 'selected');
      return;
    }

    if (_selectionState === 'first_selected') {
      // Same cell tapped — deselect
      if (_firstCell.row === row && _firstCell.col === col) {
        clearSelection();
        return;
      }

      // Check direction validity
      var dir = WoordSoekEngine.getDirection(_firstCell.row, _firstCell.col, row, col);

      if (dir) {
        // Valid direction — check for word
        var result = WoordSoekEngine.checkSelection(
          _firstCell.row, _firstCell.col, row, col, _puzzle.placedWords
        );

        if (result.found && !_foundWords.has(result.word)) {
          // Word found!
          _foundWords.add(result.word);
          _foundCount++;

          // Get the placed word cells
          var pw = _puzzle.placedWords[result.index];
          highlightFoundWord(result.word, pw.cells);
          markWordInList(result.word);

          // Update counter
          el('ws-counter').textContent = _foundCount + ' / ' + _puzzle.placedWords.length;

          // Play sound
          Audio.play('word_found');

          // Check completion
          if (_foundCount === _puzzle.placedWords.length) {
            onPuzzleComplete();
          }

          // Reset selection
          clearSelection();
          return;
        }
      }

      // Not found or invalid direction — reset and treat as new first tap
      clearSelection();
      _firstCell = { row: row, col: col };
      _selectionState = 'first_selected';
      addClassToCell(row, col, 'selected');
    }
  }

  function clearSelection() {
    _selectionState = 'idle';
    _firstCell = null;

    // Remove selected and preview from all cells
    var cells = el('ws-grid').querySelectorAll('.ws-cell');
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove('selected', 'preview');
    }
  }

  function clearPreview() {
    var grid = el('ws-grid');
    if (!grid) return;
    var cells = grid.querySelectorAll('.ws-cell.preview');
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove('preview');
    }
  }

  // ── Drag-to-select (touchstart) ────────────────────────────

  function onGridTouchStart(e) {
    var touch = e.touches[0];
    if (!touch) return;
    var target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !target.classList.contains('ws-cell')) return;

    var r = parseInt(target.getAttribute('data-row'), 10);
    var c = parseInt(target.getAttribute('data-col'), 10);
    _dragStartCell = { row: r, col: c };
    _isDragging = false;
    _lastDragRow = null;
    _lastDragCol = null;
  }

  // ── Preview Line (touchmove / mousemove) ───────────────────

  function onTouchMove(e) {
    var touch = e.touches[0];
    if (!touch) return;

    // Existing behaviour: preview during tap-tap selection
    if (_selectionState === 'first_selected' && _firstCell && !_isDragging) {
      showPreviewTo(touch.clientX, touch.clientY);
      return;
    }

    // Drag-to-select: detect drag from touchstart origin
    if (_dragStartCell) {
      var target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!target || !target.classList.contains('ws-cell')) return;

      var r = parseInt(target.getAttribute('data-row'), 10);
      var c = parseInt(target.getAttribute('data-col'), 10);
      var dist = Math.max(Math.abs(r - _dragStartCell.row), Math.abs(c - _dragStartCell.col));

      if (dist >= 2) {
        _isDragging = true;
      }

      if (_isDragging) {
        // Set first cell from drag origin if not yet set for this drag
        if (!_firstCell || _selectionState !== 'first_selected') {
          _firstCell = _dragStartCell;
          _selectionState = 'first_selected';
          addClassToCell(_dragStartCell.row, _dragStartCell.col, 'selected');
        }
        showPreviewTo(touch.clientX, touch.clientY);
        _lastDragRow = r;
        _lastDragCol = c;
      }
    }
  }

  function onMouseMove(e) {
    if (_selectionState !== 'first_selected' || !_firstCell) return;
    showPreviewTo(e.clientX, e.clientY);
  }

  function onTouchEnd() {
    if (_isDragging && _firstCell && _lastDragRow !== null) {
      // Attempt word selection from drag
      var dir = WoordSoekEngine.getDirection(_firstCell.row, _firstCell.col, _lastDragRow, _lastDragCol);
      if (dir) {
        var result = WoordSoekEngine.checkSelection(
          _firstCell.row, _firstCell.col, _lastDragRow, _lastDragCol, _puzzle.placedWords
        );

        if (result.found && !_foundWords.has(result.word)) {
          _foundWords.add(result.word);
          _foundCount++;

          var pw = _puzzle.placedWords[result.index];
          highlightFoundWord(result.word, pw.cells);
          markWordInList(result.word);

          el('ws-counter').textContent = _foundCount + ' / ' + _puzzle.placedWords.length;
          Audio.play('word_found');

          if (_foundCount === _puzzle.placedWords.length) {
            onPuzzleComplete();
          }
        }
      }

      // Silent clear regardless of result
      clearSelection();
      clearPreview();

      // Prevent ghost click from firing tap handler
      _justCompletedDrag = true;
      setTimeout(function() { _justCompletedDrag = false; }, 400);
    } else {
      // Not dragging -- just clear preview (preserve tap-tap behaviour)
      clearPreview();
    }

    // Reset drag state
    _isDragging = false;
    _dragStartCell = null;
    _lastDragRow = null;
    _lastDragCol = null;
  }

  function showPreviewTo(clientX, clientY) {
    var target = document.elementFromPoint(clientX, clientY);
    if (!target || !target.classList.contains('ws-cell')) {
      clearPreview();
      return;
    }

    var r = parseInt(target.getAttribute('data-row'), 10);
    var c = parseInt(target.getAttribute('data-col'), 10);

    var dir = WoordSoekEngine.getDirection(_firstCell.row, _firstCell.col, r, c);
    clearPreview();

    if (dir) {
      var cells = WoordSoekEngine.getCellsInLine(_firstCell.row, _firstCell.col, r, c);
      for (var i = 0; i < cells.length; i++) {
        var cell = getCellElement(cells[i].r, cells[i].c);
        if (cell && !cell.classList.contains('selected')) {
          cell.classList.add('preview');
        }
      }
    }
  }

  // ── Highlighting ───────────────────────────────────────────

  function highlightFoundWord(word, cells) {
    var colour = WoordSoekEngine.HIGHLIGHT_COLOURS[_foundCount % WoordSoekEngine.HIGHLIGHT_COLOURS.length];
    for (var i = 0; i < cells.length; i++) {
      var cellEl = getCellElement(cells[i].r, cells[i].c);
      if (cellEl) {
        cellEl.style.background = colour;
      }
    }
  }

  function markWordInList(word) {
    var items = el('ws-word-list').querySelectorAll('.ws-word-item');
    for (var i = 0; i < items.length; i++) {
      if (items[i].getAttribute('data-word') === word) {
        items[i].classList.add('found');
        break;
      }
    }
  }

  // ── Cell helpers ───────────────────────────────────────────

  function getCellElement(r, c) {
    return el('ws-grid').querySelector('[data-row="' + r + '"][data-col="' + c + '"]');
  }

  function addClassToCell(r, c, cls) {
    var cellEl = getCellElement(r, c);
    if (cellEl) cellEl.classList.add(cls);
  }

  // ── Timer ──────────────────────────────────────────────────

  function startTimer() {
    stopTimer();
    _elapsedSeconds = 0;
    _timerInterval = setInterval(function() {
      _elapsedSeconds++;
      el('ws-timer').textContent = formatTime(_elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    if (_timerInterval) {
      clearInterval(_timerInterval);
      _timerInterval = null;
    }
  }

  // ── Hints ──────────────────────────────────────────────────

  function hint() {
    if (!_puzzle || !_gameActive) return;

    // Collect unfound words
    var unfound = [];
    for (var i = 0; i < _puzzle.placedWords.length; i++) {
      if (!_foundWords.has(_puzzle.placedWords[i].word)) {
        unfound.push(_puzzle.placedWords[i]);
      }
    }

    if (unfound.length === 0) return;

    // Pick a random unfound word
    var pw = unfound[Math.floor(Math.random() * unfound.length)];
    var firstCellCoord = pw.cells[0];
    var cellEl = getCellElement(firstCellCoord.r, firstCellCoord.c);

    if (cellEl) {
      cellEl.classList.remove('hint-flash');
      // Force reflow to restart animation
      void cellEl.offsetWidth;
      cellEl.classList.add('hint-flash');

      setTimeout(function() {
        cellEl.classList.remove('hint-flash');
      }, 1200);
    }
  }

  // ── Win/Completion ─────────────────────────────────────────

  function onPuzzleComplete() {
    stopTimer();
    _gameActive = false;

    // Play completion sound
    Audio.play('board_finished');

    // Record stats
    Settings.recordWin('woordsoek', _elapsedSeconds);

    // Refresh welcome screen stats
    if (typeof refreshStats === 'function') {
      refreshStats();
    }

    // Check auto-continue
    var autoContinue = Settings.get('ws-auto-continue', false);
    if (autoContinue) {
      if (typeof showToast === 'function') {
        showToast('Baie goed! ' + formatTime(_elapsedSeconds));
      }
      setTimeout(function() {
        showDifficultyModal();
      }, 1500);
    } else {
      // Show win overlay
      el('ws-win-message').textContent =
        'Jy het alle ' + _foundCount + ' woorde gevind in ' + formatTime(_elapsedSeconds) + '!';
      el('ws-win-overlay').classList.add('active');
    }
  }

  // ── Layout Toggle ──────────────────────────────────────────

  function toggleLayout() {
    _isBelow = !_isBelow;
    el('ws-layout').classList.toggle('layout-below', _isBelow);
    Settings.set('ws-layout-below', _isBelow);
  }

  // ── Public API ─────────────────────────────────────────────

  return {
    init: init,
    cleanup: cleanup,
    startGame: startGame,
    hint: hint,
    showDifficultyModal: showDifficultyModal,
    toggleLayout: toggleLayout,
    confirmNewPuzzle: confirmNewPuzzle,
    closeConfirmModal: closeConfirmModal,
    closeDifficultyModal: closeDifficultyModal
  };

})();

// ── Router lifecycle hooks ─────────────────────────────────
Router.onEnter('woordsoek', function() { WoordSoekUI.init(); });
Router.onLeave('woordsoek', function() { WoordSoekUI.cleanup(); });
