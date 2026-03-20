/**
 * KruiswoordUI — Complete crossword game interaction layer
 * Wires KruiswoordEngine to the DOM: difficulty selection, grid rendering,
 * cell selection with direction toggle, letter input via keyboard and S Pen,
 * word validation with green flash and sound, puzzle completion with stats.
 *
 * Pattern: IIFE, ES5-compatible (no let/const/arrow/template literals/destructuring)
 */
var KruiswoordUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────

  var _els = {};
  var _clues = null;          // cached clues.json data
  var _state = null;          // deep clone from KruiswoordEngine.getState()
  var _gameActive = false;
  var _selectedCell = null;   // { row, col }
  var _selectedDirection = 'across';
  var _selectedWord = null;   // word object from _state.words
  var _cellEls = [];          // 2D array of cell DOM elements

  // ── DOM cache ──────────────────────────────────────────────────────────────

  function el(id) {
    if (!_els[id]) { _els[id] = document.getElementById(id); }
    return _els[id];
  }

  // ── Overlay helpers ────────────────────────────────────────────────────────

  function showOverlay(id) {
    var o = el(id);
    if (o) { o.classList.add('active'); }
  }

  function hideOverlay(id) {
    var o = el(id);
    if (o) { o.classList.remove('active'); }
  }

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    // Reset all state
    _els = {};
    _selectedCell = null;
    _selectedDirection = 'across';
    _selectedWord = null;
    _gameActive = false;
    _cellEls = [];

    // Load clues.json (cached after first load)
    if (_clues) {
      showDifficultyModal();
    } else {
      fetch('games/kruiswoord/clues.json')
        .then(function(r) { return r.json(); })
        .then(function(data) { _clues = data; showDifficultyModal(); })
        .catch(function() { window.showToast('Kon nie leidrade laai nie'); });
    }

    // Wire difficulty buttons
    el('kw-diff-maklik').onclick = function() { startGame('maklik'); };
    el('kw-diff-medium').onclick = function() { startGame('medium'); };
    el('kw-diff-moeilik').onclick = function() { startGame('moeilik'); };

    // Wire win overlay buttons
    el('kw-win-newgame').onclick = function() { hideOverlay('kw-win-overlay'); showDifficultyModal(); };
    el('kw-win-home').onclick = function() { hideOverlay('kw-win-overlay'); Router.back(); };

    // Wire quit confirmation buttons
    el('kw-quit-yes').onclick = function() { hideOverlay('kw-confirm-quit'); _gameActive = false; Router.back(); };
    el('kw-quit-no').onclick = function() { hideOverlay('kw-confirm-quit'); };

    // Wire undo button
    el('kw-undo-btn').onclick = function() { handleUndo(); };

    // Wire new game button
    el('kw-newgame-btn').onclick = function() {
      if (_gameActive) { showOverlay('kw-confirm-quit'); } else { showDifficultyModal(); }
    };

    // Wire hidden input events — BOTH keydown (hardware keyboard) and input (S Pen IME)
    el('kw-hidden-input').addEventListener('keydown', function(e) {
      if (e.key === 'Backspace') { handleBackspace(); e.preventDefault(); return; }
      var letter = e.key.toUpperCase();
      if (/^[A-Z]$/.test(letter)) { handleLetterInput(letter); e.preventDefault(); }
    });
    el('kw-hidden-input').addEventListener('input', function(e) {
      var val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (val.length > 0) { handleLetterInput(val[val.length - 1]); }
      e.target.value = '';
    });
  }

  // ── Difficulty modal ───────────────────────────────────────────────────────

  function showDifficultyModal() {
    // Clear any existing grid
    el('kw-grid').innerHTML = '';
    el('kw-clues-across').innerHTML = '';
    el('kw-clues-down').innerHTML = '';
    _gameActive = false;
    showOverlay('kw-difficulty-modal');
  }

  // ── Start game ─────────────────────────────────────────────────────────────

  function startGame(difficulty) {
    hideOverlay('kw-difficulty-modal');
    _state = KruiswoordEngine.generate(difficulty, _clues);
    _gameActive = true;
    _selectedCell = null;
    _selectedDirection = 'across';
    _selectedWord = null;
    buildGrid(_state);
    buildCluePanel(_state);
  }

  // ── Grid rendering ─────────────────────────────────────────────────────────
  // Build the CSS grid from _state.grid. Each cell is a div with data-row/data-col.
  // Grid column count = state.grid.length (9, 13, or 17).
  // Cell size is set via gridTemplateColumns: 'repeat(N, 1fr)'.

  function buildGrid(state) {
    var gridEl = el('kw-grid');
    gridEl.innerHTML = '';
    _cellEls = [];
    var size = state.grid.length;
    gridEl.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';

    for (var r = 0; r < size; r++) {
      _cellEls[r] = [];
      for (var c = 0; c < size; c++) {
        var cell = document.createElement('div');
        var data = state.grid[r][c];
        if (data.isBlack) {
          cell.className = 'kw-cell kw-cell-black';
        } else {
          cell.className = 'kw-cell kw-cell-white';
          if (data.number > 0) {
            var num = document.createElement('span');
            num.className = 'kw-cell-num';
            num.textContent = String(data.number);
            cell.appendChild(num);
          }
          var letterSpan = document.createElement('span');
          letterSpan.className = 'kw-cell-letter';
          letterSpan.textContent = '';
          cell.appendChild(letterSpan);
          // Closure for click handler
          (function(row, col) {
            cell.addEventListener('click', function() { handleCellClick(row, col); });
          })(r, c);
        }
        cell.setAttribute('data-row', String(r));
        cell.setAttribute('data-col', String(c));
        gridEl.appendChild(cell);
        _cellEls[r][c] = cell;
      }
    }
  }

  // ── Clue panel ─────────────────────────────────────────────────────────────
  // Build across and down clue lists from _state.words.
  // Each clue: <div class="kw-clue-item" data-number="N" data-direction="across/down">N. clue text</div>
  // Click handler calls handleClueClick(number, direction).

  function buildCluePanel(state) {
    var acrossEl = el('kw-clues-across');
    var downEl = el('kw-clues-down');
    acrossEl.innerHTML = '';
    downEl.innerHTML = '';

    // Sort words by number
    var sorted = state.words.slice().sort(function(a, b) { return a.number - b.number; });

    for (var i = 0; i < sorted.length; i++) {
      var w = sorted[i];
      var div = document.createElement('div');
      div.className = 'kw-clue-item';
      div.setAttribute('data-number', String(w.number));
      div.setAttribute('data-direction', w.direction);
      div.textContent = w.number + '. ' + w.clue;
      (function(num, dir) {
        div.addEventListener('click', function() { handleClueClick(num, dir); });
      })(w.number, w.direction);
      if (w.direction === 'across') { acrossEl.appendChild(div); }
      else { downEl.appendChild(div); }
    }
  }

  // ── Cell click handler ─────────────────────────────────────────────────────
  // Implements: select cell, highlight word, toggle direction on re-tap

  function handleCellClick(row, col) {
    if (!_gameActive) return;
    var cellData = _state.grid[row][col];
    if (cellData.isBlack) return;

    var acrossWord = getWordAtCell(row, col, 'across');
    var downWord = getWordAtCell(row, col, 'down');

    if (_selectedCell && _selectedCell.row === row && _selectedCell.col === col) {
      // Same cell — toggle direction if both directions available
      if (acrossWord && downWord) {
        _selectedDirection = (_selectedDirection === 'across') ? 'down' : 'across';
      }
    } else {
      // New cell — prefer current direction if word exists, else switch
      _selectedCell = { row: row, col: col };
      if (_selectedDirection === 'across' && acrossWord) { /* keep */ }
      else if (_selectedDirection === 'down' && downWord) { /* keep */ }
      else if (acrossWord) { _selectedDirection = 'across'; }
      else if (downWord) { _selectedDirection = 'down'; }
    }

    _selectedWord = (_selectedDirection === 'across') ? acrossWord : downWord;
    focusHiddenInput();
    renderHighlights();
    highlightActiveClue();
  }

  // ── Find word at cell ──────────────────────────────────────────────────────

  function getWordAtCell(row, col, direction) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    var i, w, j;

    // Check incomplete words first (selection priority)
    for (i = 0; i < _state.words.length; i++) {
      w = _state.words[i];
      if (w.direction !== direction) continue;
      if (w.complete) continue;
      for (j = 0; j < w.length; j++) {
        if (w.row + j * dr === row && w.col + j * dc === col) return w;
      }
    }
    // Fall back to completed words (for toggling, clue highlight)
    for (i = 0; i < _state.words.length; i++) {
      w = _state.words[i];
      if (w.direction !== direction) continue;
      for (j = 0; j < w.length; j++) {
        if (w.row + j * dr === row && w.col + j * dc === col) return w;
      }
    }
    return null;
  }

  // ── Clue click handler ─────────────────────────────────────────────────────
  // Jump to first empty cell of the clicked clue's word

  function handleClueClick(number, direction) {
    if (!_gameActive) return;
    var word = null;
    for (var i = 0; i < _state.words.length; i++) {
      if (_state.words[i].number === number && _state.words[i].direction === direction) {
        word = _state.words[i]; break;
      }
    }
    if (!word) return;

    _selectedDirection = direction;
    _selectedWord = word;

    // Find first empty cell in word, or first cell if all filled
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    var targetRow = word.row;
    var targetCol = word.col;
    for (var j = 0; j < word.length; j++) {
      var r = word.row + j * dr;
      var c = word.col + j * dc;
      if (_state.grid[r][c].entered === '') {
        targetRow = r; targetCol = c; break;
      }
    }
    _selectedCell = { row: targetRow, col: targetCol };
    focusHiddenInput();
    renderHighlights();
    highlightActiveClue();
  }

  // ── Render highlights ──────────────────────────────────────────────────────
  // Clear all highlights, then apply selected + highlighted to active word cells

  function renderHighlights() {
    // Clear all
    for (var r = 0; r < _cellEls.length; r++) {
      for (var c = 0; c < _cellEls[r].length; c++) {
        if (_cellEls[r][c]) {
          _cellEls[r][c].classList.remove('kw-cell-selected', 'kw-cell-highlighted');
        }
      }
    }
    if (!_selectedWord || !_selectedCell) return;

    // Highlight all cells in active word
    var dr = _selectedWord.direction === 'down' ? 1 : 0;
    var dc = _selectedWord.direction === 'across' ? 1 : 0;
    for (var j = 0; j < _selectedWord.length; j++) {
      var wr = _selectedWord.row + j * dr;
      var wc = _selectedWord.col + j * dc;
      if (_cellEls[wr] && _cellEls[wr][wc]) {
        _cellEls[wr][wc].classList.add('kw-cell-highlighted');
      }
    }
    // Selected cell gets stronger highlight
    if (_cellEls[_selectedCell.row] && _cellEls[_selectedCell.row][_selectedCell.col]) {
      _cellEls[_selectedCell.row][_selectedCell.col].classList.add('kw-cell-selected');
    }
  }

  // ── Highlight active clue ──────────────────────────────────────────────────

  function highlightActiveClue() {
    // Remove all active states
    var items = document.querySelectorAll('.kw-clue-item');
    for (var i = 0; i < items.length; i++) { items[i].classList.remove('kw-clue-active'); }

    if (!_selectedWord) return;
    var selector = '.kw-clue-item[data-number="' + _selectedWord.number + '"][data-direction="' + _selectedWord.direction + '"]';
    var activeClue = document.querySelector(selector);
    if (activeClue) {
      activeClue.classList.add('kw-clue-active');
      activeClue.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ── Focus hidden input ─────────────────────────────────────────────────────

  function focusHiddenInput() {
    var input = el('kw-hidden-input');
    input.value = '';
    input.focus();
  }

  // ── Letter input ───────────────────────────────────────────────────────────

  function handleLetterInput(letter) {
    if (!_selectedCell || !_selectedWord || !_gameActive) return;
    if (_selectedWord.complete) return; // don't edit locked words

    KruiswoordEngine.setLetter(_selectedCell.row, _selectedCell.col, letter);
    _state = KruiswoordEngine.getState();
    renderCell(_selectedCell.row, _selectedCell.col);

    // Check if word is now correct
    var result = KruiswoordEngine.checkWord(_selectedWord.number, _selectedWord.direction);
    if (result.correct) {
      _state = KruiswoordEngine.getState(); // refresh after checkWord sets complete=true
      flashWordGreen(_selectedWord);
      Audio.play('word_found');
      markClueDone(_selectedWord.number, _selectedWord.direction);
      if (KruiswoordEngine.isComplete()) {
        setTimeout(function() { onPuzzleComplete(); }, 700);
      }
    } else {
      advanceCursor();
    }
  }

  // ── Backspace ──────────────────────────────────────────────────────────────

  function handleBackspace() {
    if (!_selectedCell || !_selectedWord || !_gameActive) return;
    if (_selectedWord.complete) return;

    // If current cell has a letter, clear it
    if (_state.grid[_selectedCell.row][_selectedCell.col].entered !== '') {
      KruiswoordEngine.setLetter(_selectedCell.row, _selectedCell.col, '');
      _state = KruiswoordEngine.getState();
      renderCell(_selectedCell.row, _selectedCell.col);
    } else {
      // Move back to previous cell in word
      var dr = _selectedWord.direction === 'down' ? 1 : 0;
      var dc = _selectedWord.direction === 'across' ? 1 : 0;
      var pos = -1;
      for (var j = 0; j < _selectedWord.length; j++) {
        if (_selectedWord.row + j * dr === _selectedCell.row && _selectedWord.col + j * dc === _selectedCell.col) { pos = j; break; }
      }
      if (pos > 0) {
        _selectedCell = { row: _selectedWord.row + (pos - 1) * dr, col: _selectedWord.col + (pos - 1) * dc };
        KruiswoordEngine.setLetter(_selectedCell.row, _selectedCell.col, '');
        _state = KruiswoordEngine.getState();
        renderCell(_selectedCell.row, _selectedCell.col);
        renderHighlights();
      }
    }
  }

  // ── Render single cell ─────────────────────────────────────────────────────

  function renderCell(row, col) {
    var cellEl = _cellEls[row][col];
    if (!cellEl) return;
    var letterSpan = cellEl.querySelector('.kw-cell-letter');
    if (letterSpan) { letterSpan.textContent = _state.grid[row][col].entered || ''; }
  }

  // ── Auto-advance cursor ────────────────────────────────────────────────────

  function advanceCursor() {
    if (!_selectedWord) return;
    var dr = _selectedWord.direction === 'down' ? 1 : 0;
    var dc = _selectedWord.direction === 'across' ? 1 : 0;

    var pos = -1;
    for (var j = 0; j < _selectedWord.length; j++) {
      if (_selectedWord.row + j * dr === _selectedCell.row && _selectedWord.col + j * dc === _selectedCell.col) { pos = j; break; }
    }
    if (pos < 0) return;

    // Scan forward for next empty cell
    for (var k = pos + 1; k < _selectedWord.length; k++) {
      var nr = _selectedWord.row + k * dr;
      var nc = _selectedWord.col + k * dc;
      if (_state.grid[nr][nc].entered === '') {
        _selectedCell = { row: nr, col: nc };
        renderHighlights();
        return;
      }
    }
    // All filled — cursor stays
  }

  // ── Flash word green ───────────────────────────────────────────────────────

  function flashWordGreen(word) {
    var dr = word.direction === 'down' ? 1 : 0;
    var dc = word.direction === 'across' ? 1 : 0;
    var cells = [];
    for (var j = 0; j < word.length; j++) {
      var r = word.row + j * dr;
      var c = word.col + j * dc;
      if (_cellEls[r] && _cellEls[r][c]) {
        _cellEls[r][c].classList.add('kw-cell-correct');
        cells.push(_cellEls[r][c]);
      }
    }
    setTimeout(function() {
      for (var i = 0; i < cells.length; i++) {
        cells[i].classList.remove('kw-cell-correct');
        cells[i].classList.add('kw-cell-locked');
      }
      // Deselect if this was the active word
      if (_selectedWord && _selectedWord.number === word.number && _selectedWord.direction === word.direction) {
        _selectedWord = null;
        _selectedCell = null;
        renderHighlights();
        highlightActiveClue();
      }
    }, 600);
  }

  // ── Mark clue done ─────────────────────────────────────────────────────────

  function markClueDone(number, direction) {
    var selector = '.kw-clue-item[data-number="' + number + '"][data-direction="' + direction + '"]';
    var clueEl = document.querySelector(selector);
    if (clueEl) { clueEl.classList.add('kw-clue-done'); clueEl.classList.remove('kw-clue-active'); }
  }

  // ── Puzzle complete ────────────────────────────────────────────────────────

  function onPuzzleComplete() {
    _gameActive = false;
    var elapsed = KruiswoordEngine.getElapsed();
    Settings.recordWin('kruiswoord', elapsed);
    el('kw-win-message').textContent = 'Tyd: ' + window.formatTime(elapsed);
    Audio.play('board_finished');
    showOverlay('kw-win-overlay');
  }

  // ── Undo ───────────────────────────────────────────────────────────────────

  function handleUndo() {
    if (!_gameActive) return;
    var result = KruiswoordEngine.undo();
    if (result.success) {
      _state = KruiswoordEngine.getState();
      // Re-render all non-black cells (undo could affect any cell)
      for (var r = 0; r < _state.grid.length; r++) {
        for (var c = 0; c < _state.grid[r].length; c++) {
          if (!_state.grid[r][c].isBlack) { renderCell(r, c); }
        }
      }
    }
  }

  // ── Back button ────────────────────────────────────────────────────────────

  function handleBack() {
    if (_gameActive) {
      showOverlay('kw-confirm-quit');
    } else {
      Router.back();
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  function cleanup() {
    _gameActive = false;
    _selectedCell = null;
    _selectedWord = null;
    _state = null;
    _cellEls = [];
    _els = {};
    hideOverlay('kw-difficulty-modal');
    hideOverlay('kw-win-overlay');
    hideOverlay('kw-confirm-quit');
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return { init: init, cleanup: cleanup, handleBack: handleBack };

})();

// ── Router lifecycle hooks ──────────────────────────────────────────────────
Router.onEnter('kruiswoord', function() { KruiswoordUI.init(); });
Router.onLeave('kruiswoord', function() { KruiswoordUI.cleanup(); });
