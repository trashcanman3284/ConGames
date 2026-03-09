/**
 * Sudoku UI -- Complete game interaction layer
 * Wires SudokuEngine to the DOM: rendering, cell-first input, notes, highlighting,
 * hints, error checking, timer with pause, auto-save/resume, and win celebration.
 */
var SudokuUI = (function() {
  'use strict';

  // ── State ──────────────────────────────────────────────────

  var _els = {};                  // DOM cache
  var _timer = null;              // Timer interval ID
  var _elapsedSeconds = 0;        // Timer elapsed seconds
  var _timerStarted = false;      // Has the timer been started
  var _selectedCell = null;       // { row, col, el }
  var _notesMode = false;         // Notes/pencil mode toggle
  var _manuallyPaused = false;    // User pressed pause
  var _gameActive = false;        // Game in progress
  var _cellEls = [];              // 9x9 array of DOM elements
  var _visibilityHandler = null;  // Stored handler for cleanup

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
    _selectedCell = null;
    _notesMode = false;
    _manuallyPaused = false;
    _gameActive = false;
    _timerStarted = false;
    _elapsedSeconds = 0;
    _cellEls = [];

    // Wire difficulty modal buttons
    el('sdk-diff-maklik').addEventListener('click', function() { startGame('maklik'); });
    el('sdk-diff-medium').addEventListener('click', function() { startGame('medium'); });
    el('sdk-diff-moeilik').addEventListener('click', function() { startGame('moeilik'); });
    el('sdk-diff-kenner').addEventListener('click', function() { startGame('kenner'); });

    // Wire resume modal buttons
    el('sdk-resume-yes').addEventListener('click', function() { resumeFromSave(); });
    el('sdk-resume-no').addEventListener('click', function() {
      hideOverlay('sdk-resume-modal');
      showDifficultyModal();
    });

    // Wire pause button and overlay
    el('sdk-pause-btn').addEventListener('click', function() { pauseGame(); });
    el('sdk-resume-btn').addEventListener('click', function() { resumeFromPause(); });

    // Wire undo
    el('sdk-undo-btn').addEventListener('click', function() { handleUndo(); });

    // Wire new game button
    el('sdk-newgame-btn').addEventListener('click', function() {
      if (_gameActive) {
        // Confirm if game in progress
        pauseTimer();
        showDifficultyModal();
      } else {
        showDifficultyModal();
      }
    });

    // Wire numpad via event delegation
    el('sdk-numpad').addEventListener('click', function(e) {
      var btn = e.target.closest('.sdk-num-btn');
      if (btn) {
        var digit = parseInt(btn.getAttribute('data-num'), 10);
        if (digit >= 1 && digit <= 9) {
          handleNumInput(digit);
        }
      }
    });

    // Wire action buttons
    el('sdk-erase-btn').addEventListener('click', function() { handleErase(); });
    el('sdk-notes-btn').addEventListener('click', function() { toggleNotesMode(); });
    el('sdk-hint-btn').addEventListener('click', function() { handleHint(); });
    el('sdk-check-btn').addEventListener('click', function() { handleCheck(); });

    // Wire settings modal
    el('sdk-settings-btn').addEventListener('click', function() { openSettings(); });
    el('sdk-settings-close').addEventListener('click', function() { closeSettings(); });

    // Wire settings toggle change handlers
    el('sdk-toggle-timer').addEventListener('change', function() {
      Settings.set('sdk-showTimer', this.checked);
      el('sdk-timer').style.display = this.checked ? '' : 'none';
    });
    el('sdk-toggle-highlight').addEventListener('change', function() {
      Settings.set('sdk-highlightSame', this.checked);
      render();
    });
    el('sdk-toggle-errors').addEventListener('change', function() {
      Settings.set('sdk-showErrors', this.checked);
    });

    // Wire win overlay buttons
    el('sdk-win-newgame').addEventListener('click', function() {
      hideOverlay('sdk-win-overlay');
      showDifficultyModal();
    });
    el('sdk-win-home').addEventListener('click', function() {
      hideOverlay('sdk-win-overlay');
      Router.go('welcome');
    });

    // Visibility change for auto-pause
    _visibilityHandler = function() { handleVisibilityChange(); };
    document.addEventListener('visibilitychange', _visibilityHandler);

    // Check for saved game on entry
    var savedGame = Settings.get('sudoku-save', null);
    if (savedGame) {
      var diffLabel = SudokuEngine.DIFFICULTY[savedGame.difficulty]
        ? SudokuEngine.DIFFICULTY[savedGame.difficulty].label
        : savedGame.difficulty;
      var savedTime = savedGame.elapsedSeconds || 0;
      el('sdk-resume-info').textContent = diffLabel + ' - ' + formatTime(savedTime);
      hideOverlay('sdk-difficulty-modal');
      showOverlay('sdk-resume-modal');
    } else {
      showDifficultyModal();
    }
  }

  function cleanup() {
    pauseTimer();
    if (_gameActive) {
      autoSave();
    }
    if (_visibilityHandler) {
      document.removeEventListener('visibilitychange', _visibilityHandler);
      _visibilityHandler = null;
    }
    _selectedCell = null;
    _notesMode = false;
    _manuallyPaused = false;
    _gameActive = false;
    _timerStarted = false;
    _cellEls = [];
    _els = {};
  }

  // ── Game lifecycle ────────────────────────────────────────

  function startGame(difficulty) {
    // Show loading overlay
    showOverlay('sdk-loading-overlay');

    // setTimeout so loading overlay renders before blocking generation
    setTimeout(function() {
      SudokuEngine.newGame(difficulty);

      hideOverlay('sdk-loading-overlay');
      hideOverlay('sdk-difficulty-modal');
      hideOverlay('sdk-resume-modal');

      // Reset timer
      pauseTimer();
      _elapsedSeconds = 0;
      _timerStarted = false;
      _selectedCell = null;
      _notesMode = false;
      _manuallyPaused = false;

      // Update notes button visual
      el('sdk-notes-btn').classList.remove('sdk-notes-active');

      // Show timer (respect setting)
      el('sdk-timer').style.display = Settings.get('sdk-showTimer', true) ? '' : 'none';
      el('sdk-timer').textContent = formatTime(0);

      buildGrid();
      render();

      // Clear any previous saved game
      Settings.set('sudoku-save', null);

      _gameActive = true;
    }, 50);
  }

  // ── Grid Construction ─────────────────────────────────────

  function buildGrid() {
    var gridEl = el('sdk-grid');
    gridEl.innerHTML = '';
    _cellEls = [];

    for (var r = 0; r < 9; r++) {
      _cellEls[r] = [];
      for (var c = 0; c < 9; c++) {
        var cell = document.createElement('div');
        cell.className = 'sdk-cell';
        cell.setAttribute('data-row', String(r));
        cell.setAttribute('data-col', String(c));

        // 3x3 box boundary thick borders
        if (c === 2 || c === 5) {
          cell.classList.add('sdk-cell-border-right');
        }
        if (r === 2 || r === 5) {
          cell.classList.add('sdk-cell-border-bottom');
        }

        // Click handler
        (function(row, col) {
          cell.addEventListener('click', function() {
            handleCellClick(row, col);
          });
        })(r, c);

        gridEl.appendChild(cell);
        _cellEls[r][c] = cell;
      }
    }
  }

  // ── Rendering ─────────────────────────────────────────────

  function render() {
    var state = SudokuEngine.getState();

    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        renderCell(r, c, state);
      }
    }

    updateNumpad();
    el('sdk-timer').textContent = formatTime(_elapsedSeconds);
  }

  function renderCell(row, col, state) {
    var cell = _cellEls[row][col];
    if (!cell) return;

    // Clear content
    cell.innerHTML = '';

    // Remove all state classes (preserve border classes)
    cell.classList.remove('sdk-given', 'sdk-entered', 'sdk-selected', 'sdk-highlighted', 'sdk-related', 'sdk-error');

    var value = state.grid[row][col];
    var isGiven = state.given[row][col];
    var notes = state.notes[row][col];

    // Determine selected cell's number for highlighting
    var selectedNumber = 0;
    if (_selectedCell) {
      selectedNumber = state.grid[_selectedCell.row][_selectedCell.col];
    }

    // Cell content
    if (isGiven) {
      cell.classList.add('sdk-given');
      cell.textContent = String(value);
    } else if (value > 0) {
      cell.classList.add('sdk-entered');
      cell.textContent = String(value);
    } else {
      // Check for notes
      var hasNotes = false;
      for (var n = 0; n < 9; n++) {
        if (notes[n]) { hasNotes = true; break; }
      }
      if (hasNotes) {
        var notesDiv = document.createElement('div');
        notesDiv.className = 'sdk-notes';
        for (var d = 0; d < 9; d++) {
          var noteCell = document.createElement('span');
          noteCell.className = 'sdk-note-digit';
          if (notes[d]) {
            noteCell.textContent = String(d + 1);
          }
          notesDiv.appendChild(noteCell);
        }
        cell.appendChild(notesDiv);
      }
    }

    // Apply highlighting
    if (_selectedCell) {
      // Selected cell itself
      if (row === _selectedCell.row && col === _selectedCell.col) {
        cell.classList.add('sdk-selected');
      }
      // Same number highlight (if enabled)
      else if (selectedNumber > 0 && value === selectedNumber && Settings.get('sdk-highlightSame', true)) {
        cell.classList.add('sdk-highlighted');
      }
      // Related cells (same row, column, or 3x3 box)
      else if (isSameGroup(row, col, _selectedCell.row, _selectedCell.col)) {
        cell.classList.add('sdk-related');
      }
    }
  }

  function isSameGroup(r1, c1, r2, c2) {
    // Same row
    if (r1 === r2) return true;
    // Same column
    if (c1 === c2) return true;
    // Same 3x3 box
    var boxR1 = Math.floor(r1 / 3);
    var boxC1 = Math.floor(c1 / 3);
    var boxR2 = Math.floor(r2 / 3);
    var boxC2 = Math.floor(c2 / 3);
    return boxR1 === boxR2 && boxC1 === boxC2;
  }

  // ── Number pad update ─────────────────────────────────────

  function updateNumpad() {
    var buttons = el('sdk-numpad').querySelectorAll('.sdk-num-btn');
    for (var i = 0; i < buttons.length; i++) {
      var digit = parseInt(buttons[i].getAttribute('data-num'), 10);
      var count = SudokuEngine.getCompletedCount(digit);
      if (count >= 9) {
        buttons[i].classList.add('sdk-num-completed');
      } else {
        buttons[i].classList.remove('sdk-num-completed');
      }
    }
  }

  // ── Cell Click Handler ────────────────────────────────────

  function handleCellClick(row, col) {
    if (!_gameActive) return;

    _selectedCell = { row: row, col: col, el: _cellEls[row][col] };

    // Start timer on first interaction
    if (!_timerStarted) {
      _timerStarted = true;
      startTimer();
    }

    render();
  }

  // ── Number Input ──────────────────────────────────────────

  function handleNumInput(digit) {
    if (!_selectedCell) {
      showToast("Kies eers 'n sel");
      return;
    }
    if (!_gameActive) return;

    var row = _selectedCell.row;
    var col = _selectedCell.col;
    var result;

    if (_notesMode) {
      result = SudokuEngine.toggleNote(row, col, digit);
      if (result.success) {
        render();
        autoSave();
      }
    } else {
      result = SudokuEngine.setValue(row, col, digit);
      if (result.success) {
        render();
        autoSave();
        checkWin();
      } else if (result.reason === 'given') {
        showToast('Hierdie sel kan nie verander word nie');
      }
    }
  }

  // ── Erase ─────────────────────────────────────────────────

  function handleErase() {
    if (!_selectedCell || !_gameActive) return;

    var result = SudokuEngine.setValue(_selectedCell.row, _selectedCell.col, 0);
    if (result.success) {
      render();
      autoSave();
    }
  }

  // ── Notes Mode Toggle ─────────────────────────────────────

  function toggleNotesMode() {
    _notesMode = !_notesMode;
    if (_notesMode) {
      el('sdk-notes-btn').classList.add('sdk-notes-active');
    } else {
      el('sdk-notes-btn').classList.remove('sdk-notes-active');
    }
    showToast(_notesMode ? 'Notas modus aan' : 'Notas modus af');
  }

  // ── Hint ──────────────────────────────────────────────────

  function handleHint() {
    if (!_gameActive) return;

    var hint = SudokuEngine.getHint();
    if (!hint) {
      showToast('Geen lee selle nie');
      return;
    }

    SudokuEngine.setValue(hint.row, hint.col, hint.value);

    // Animate hint cell with brief glow
    var hintCell = _cellEls[hint.row][hint.col];
    if (hintCell) {
      hintCell.style.transition = 'box-shadow 0.3s';
      hintCell.style.boxShadow = '0 0 16px 4px var(--accent-gold)';
      setTimeout(function() {
        hintCell.style.boxShadow = '';
        hintCell.style.transition = '';
      }, 800);
    }

    Audio.play('word_found');
    render();
    autoSave();
    checkWin();
  }

  // ── Error Check ───────────────────────────────────────────

  function handleCheck() {
    if (!_gameActive) return;

    var errors = SudokuEngine.checkErrors();
    if (errors.length === 0) {
      showToast('Geen foute!');
      return;
    }

    // Flash error cells red for 1.5 seconds
    for (var i = 0; i < errors.length; i++) {
      var errCell = _cellEls[errors[i].row][errors[i].col];
      if (errCell) {
        errCell.classList.add('sdk-error');
      }
    }

    setTimeout(function() {
      for (var j = 0; j < errors.length; j++) {
        var c = _cellEls[errors[j].row][errors[j].col];
        if (c) {
          c.classList.remove('sdk-error');
        }
      }
    }, 1500);
  }

  // ── Undo ──────────────────────────────────────────────────

  function handleUndo() {
    if (!_gameActive) return;

    var result = SudokuEngine.undo();
    if (result.success) {
      render();
      autoSave();
    } else {
      showToast('Niks om te ontdoen nie');
    }
  }

  // ── Timer ─────────────────────────────────────────────────

  function startTimer() {
    if (_timer) return;
    _timer = setInterval(function() {
      _elapsedSeconds++;
      el('sdk-timer').textContent = formatTime(_elapsedSeconds);
    }, 1000);
  }

  function pauseTimer() {
    if (_timer) {
      clearInterval(_timer);
      _timer = null;
    }
  }

  function pauseGame() {
    if (!_gameActive) return;
    _manuallyPaused = true;
    pauseTimer();
    el('sdk-pause-time').textContent = 'Tyd: ' + formatTime(_elapsedSeconds);
    showOverlay('sdk-pause-overlay');
    autoSave();
  }

  function resumeFromPause() {
    _manuallyPaused = false;
    hideOverlay('sdk-pause-overlay');
    if (_timerStarted) {
      startTimer();
    }
  }

  function resumeFromSave() {
    var savedGame = Settings.get('sudoku-save', null);
    if (!savedGame) {
      showDifficultyModal();
      return;
    }

    var result = SudokuEngine.loadGame(savedGame);
    if (!result.success) {
      Settings.set('sudoku-save', null);
      showDifficultyModal();
      return;
    }

    _elapsedSeconds = savedGame.elapsedSeconds || 0;
    _selectedCell = null;
    _notesMode = false;
    _manuallyPaused = false;

    // Update notes button visual
    el('sdk-notes-btn').classList.remove('sdk-notes-active');

    // Show timer (respect setting)
    el('sdk-timer').style.display = Settings.get('sdk-showTimer', true) ? '' : 'none';
    el('sdk-timer').textContent = formatTime(_elapsedSeconds);

    buildGrid();
    render();

    hideOverlay('sdk-resume-modal');
    hideOverlay('sdk-difficulty-modal');

    _gameActive = true;
    _timerStarted = true;
    startTimer();
  }

  // ── Auto-pause on visibility change ───────────────────────

  function handleVisibilityChange() {
    if (!_gameActive) return;
    if (document.hidden) {
      pauseTimer();
      autoSave();
    } else {
      if (!_manuallyPaused) {
        startTimer();
      }
    }
  }

  // ── Auto-save ─────────────────────────────────────────────

  function autoSave() {
    if (!_gameActive) return;
    var state = SudokuEngine.getSavedGame();
    state.elapsedSeconds = _elapsedSeconds;
    Settings.set('sudoku-save', state);
  }

  // ── Win Detection ─────────────────────────────────────────

  function checkWin() {
    if (!SudokuEngine.isComplete()) return;

    _gameActive = false;
    pauseTimer();
    Audio.play('board_finished');

    // Run win animation
    runWinAnimation(function() {
      var diffLabel = SudokuEngine.DIFFICULTY[SudokuEngine.getState().difficulty]
        ? SudokuEngine.DIFFICULTY[SudokuEngine.getState().difficulty].label
        : '';
      el('sdk-win-message').textContent = diffLabel + ' - Tyd: ' + formatTime(_elapsedSeconds);
      showOverlay('sdk-win-overlay');
    });

    // Record stats
    Settings.recordWin('sudoku', _elapsedSeconds);

    // Clear saved game
    Settings.set('sudoku-save', null);
  }

  // ── Win Animation (number confetti) ───────────────────────

  function runWinAnimation(onComplete) {
    var container = el('sdk-win-animation');
    container.innerHTML = '';
    container.style.display = 'block';

    var containerWidth = container.offsetWidth;
    var containerHeight = container.offsetHeight;

    // Create floating number confetti
    var digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    var particles = [];
    var maxParticles = 40;

    for (var i = 0; i < maxParticles; i++) {
      var digit = digits[Math.floor(Math.random() * digits.length)];
      var particle = document.createElement('div');
      particle.textContent = String(digit);
      particle.style.position = 'absolute';
      particle.style.fontSize = (Math.random() * 24 + 16) + 'px';
      particle.style.fontFamily = 'var(--font-body)';
      particle.style.fontWeight = '700';
      particle.style.color = 'var(--accent-gold)';
      particle.style.opacity = '0.8';
      particle.style.pointerEvents = 'none';
      particle.style.left = (Math.random() * containerWidth) + 'px';
      particle.style.top = (containerHeight + 20) + 'px';
      particle.style.transition = 'none';
      container.appendChild(particle);

      particles.push({
        el: particle,
        x: Math.random() * containerWidth,
        y: containerHeight + 20,
        vy: -(Math.random() * 4 + 2),
        vx: (Math.random() - 0.5) * 3,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }

    var animStart = Date.now();
    var animDuration = 3000;
    var animFrame;

    function animate() {
      var elapsed = Date.now() - animStart;
      if (elapsed > animDuration) {
        cancelAnimationFrame(animFrame);
        container.style.display = 'none';
        container.innerHTML = '';
        if (onComplete) onComplete();
        return;
      }

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.y += p.vy;
        p.x += p.vx;
        p.rotation += p.rotSpeed;
        p.vy -= 0.02; // slight upward drift

        var opacity = 1 - (elapsed / animDuration);
        p.el.style.left = p.x + 'px';
        p.el.style.top = p.y + 'px';
        p.el.style.opacity = String(Math.max(0, opacity * 0.8));
        p.el.style.transform = 'rotate(' + p.rotation + 'deg)';
      }

      animFrame = requestAnimationFrame(animate);
    }

    animFrame = requestAnimationFrame(animate);
  }

  // ── Overlay Helpers ───────────────────────────────────────

  function showOverlay(id) {
    var overlay = el(id);
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.add('active');
    }
  }

  function hideOverlay(id) {
    var overlay = el(id);
    if (overlay) {
      overlay.classList.remove('active');
      overlay.style.display = 'none';
    }
  }

  function showDifficultyModal() {
    hideOverlay('sdk-resume-modal');
    hideOverlay('sdk-pause-overlay');
    showOverlay('sdk-difficulty-modal');
  }

  // ── Settings Modal ──────────────────────────────────────────

  function openSettings() {
    // Sync toggle states from Settings
    el('sdk-toggle-timer').checked = Settings.get('sdk-showTimer', true);
    el('sdk-toggle-highlight').checked = Settings.get('sdk-highlightSame', true);
    el('sdk-toggle-errors').checked = Settings.get('sdk-showErrors', false);
    showOverlay('sdk-settings-modal');
  }

  function closeSettings() {
    hideOverlay('sdk-settings-modal');
  }

  // ── Public API ────────────────────────────────────────────

  return {
    init: init,
    cleanup: cleanup
  };

})();

// ── Router lifecycle hooks ────────────────────────────────
Router.onEnter('sudoku', function() { SudokuUI.init(); });
Router.onLeave('sudoku', function() { SudokuUI.cleanup(); });
