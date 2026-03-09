/**
 * Sudoku Engine — puzzle generator, solver, and game state
 * Pure logic, zero DOM. Uses backtracking with unique-solution guarantee.
 * Used by: games/sudoku/ui.js
 */
var SudokuEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  var DIFFICULTY = {
    maklik:  { label: 'Maklik',  revealedCells: 45 },
    medium:  { label: 'Medium',  revealedCells: 35 },
    moeilik: { label: 'Moeilik', revealedCells: 27 },
    kenner:  { label: 'Kenner',  revealedCells: 22 }
  };

  // ── Internal state ────────────────────────────────────────

  var _state = {
    grid: [],        // 9x9 current values (0 = empty)
    solution: [],    // 9x9 complete solution (for hints/check)
    given: [],       // 9x9 booleans (true = original puzzle cell, not editable)
    notes: [],       // 9x9 arrays, each cell is [false,false,...] (9 booleans for digits 1-9, indexed 0-8)
    difficulty: '',  // 'maklik', 'medium', 'moeilik', 'kenner'
    moves: 0,
    undoStack: []    // array of {type, row, col, prevValue, prevNotes, ...}
  };

  // ── Helpers ────────────────────────────────────────────────

  function shuffle(arr) {
    var result = arr.slice();
    for (var i = result.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
    return result;
  }

  function cloneGrid(grid) {
    var copy = [];
    for (var r = 0; r < 9; r++) {
      copy[r] = [];
      for (var c = 0; c < 9; c++) {
        copy[r][c] = grid[r][c];
      }
    }
    return copy;
  }

  function cloneNotes(notes) {
    var copy = [];
    for (var r = 0; r < 9; r++) {
      copy[r] = [];
      for (var c = 0; c < 9; c++) {
        copy[r][c] = notes[r][c].slice();
      }
    }
    return copy;
  }

  function emptyGrid() {
    var grid = [];
    for (var r = 0; r < 9; r++) {
      grid[r] = [];
      for (var c = 0; c < 9; c++) {
        grid[r][c] = 0;
      }
    }
    return grid;
  }

  function emptyNotes() {
    var notes = [];
    for (var r = 0; r < 9; r++) {
      notes[r] = [];
      for (var c = 0; c < 9; c++) {
        notes[r][c] = [false, false, false, false, false, false, false, false, false];
      }
    }
    return notes;
  }

  function emptyGiven() {
    var given = [];
    for (var r = 0; r < 9; r++) {
      given[r] = [];
      for (var c = 0; c < 9; c++) {
        given[r][c] = false;
      }
    }
    return given;
  }

  function getBoxStart(row, col) {
    return {
      boxRow: Math.floor(row / 3) * 3,
      boxCol: Math.floor(col / 3) * 3
    };
  }

  function isValidPlacement(grid, row, col, num) {
    // Check row
    for (var c = 0; c < 9; c++) {
      if (grid[row][c] === num) return false;
    }
    // Check column
    for (var r = 0; r < 9; r++) {
      if (grid[r][col] === num) return false;
    }
    // Check 3x3 box
    var box = getBoxStart(row, col);
    for (var br = box.boxRow; br < box.boxRow + 3; br++) {
      for (var bc = box.boxCol; bc < box.boxCol + 3; bc++) {
        if (grid[br][bc] === num) return false;
      }
    }
    return true;
  }

  // ── Solver / Generator ─────────────────────────────────────

  function fillGrid(grid) {
    // Find first empty cell
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          // Try shuffled digits 1-9
          var digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          for (var i = 0; i < 9; i++) {
            if (isValidPlacement(grid, r, c, digits[i])) {
              grid[r][c] = digits[i];
              if (fillGrid(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true; // All cells filled
  }

  function countSolutions(grid, limit) {
    // Find first empty cell
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          var count = 0;
          for (var num = 1; num <= 9; num++) {
            if (isValidPlacement(grid, r, c, num)) {
              grid[r][c] = num;
              count += countSolutions(grid, limit - count);
              grid[r][c] = 0;
              if (count >= limit) return count;
            }
          }
          return count;
        }
      }
    }
    return 1; // No empty cells = 1 solution found
  }

  function removeCells(grid, targetRemoved) {
    // Shuffle all 81 positions
    var positions = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        positions.push({ row: r, col: c });
      }
    }
    positions = shuffle(positions);

    var removed = 0;
    var attempts = 0;
    var maxAttempts = 200;

    for (var i = 0; i < positions.length && removed < targetRemoved; i++) {
      var pos = positions[i];
      var val = grid[pos.row][pos.col];
      if (val === 0) continue;

      grid[pos.row][pos.col] = 0;
      attempts++;

      // Check uniqueness
      var testGrid = cloneGrid(grid);
      var solutions = countSolutions(testGrid, 2);

      if (solutions === 1) {
        removed++;
      } else {
        // Restore - removing this cell creates ambiguity
        grid[pos.row][pos.col] = val;
      }

      // Performance guard for kenner difficulty
      if (attempts >= maxAttempts && removed < targetRemoved) {
        break;
      }
    }

    return removed;
  }

  // ── Public API ─────────────────────────────────────────────

  function newGame(difficulty) {
    var diff = DIFFICULTY[difficulty];
    if (!diff) throw new Error('Invalid difficulty: ' + difficulty);

    // Step 1: Create empty 9x9 grid
    var grid = emptyGrid();

    // Step 2: Fill complete grid using backtracking
    fillGrid(grid);

    // Step 3: Clone as solution
    var solution = cloneGrid(grid);

    // Step 4: Remove cells to reach target
    var targetRemoved = 81 - diff.revealedCells;
    removeCells(grid, targetRemoved);

    // Step 5: Set up state
    var given = emptyGiven();
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        given[r][c] = grid[r][c] !== 0;
      }
    }

    _state.grid = cloneGrid(grid);
    _state.solution = solution;
    _state.given = given;
    _state.notes = emptyNotes();
    _state.difficulty = difficulty;
    _state.moves = 0;
    _state.undoStack = [];

    return getState();
  }

  function getState() {
    return {
      grid: cloneGrid(_state.grid),
      solution: cloneGrid(_state.solution),
      given: cloneGrid(_state.given),
      notes: cloneNotes(_state.notes),
      difficulty: _state.difficulty,
      moves: _state.moves
    };
  }

  function setValue(row, col, val) {
    if (_state.given[row][col]) {
      return { success: false, reason: 'given' };
    }

    // Push undo record
    _state.undoStack.push({
      type: 'value',
      row: row,
      col: col,
      prevValue: _state.grid[row][col],
      prevNotes: _state.notes[row][col].slice()
    });

    _state.grid[row][col] = val;

    // Clear notes for this cell
    _state.notes[row][col] = [false, false, false, false, false, false, false, false, false];

    // Auto-clear related notes when placing a number
    if (val > 0) {
      var noteIdx = val - 1;
      var box = getBoxStart(row, col);

      // Clear in same row
      for (var c = 0; c < 9; c++) {
        _state.notes[row][c][noteIdx] = false;
      }
      // Clear in same column
      for (var r = 0; r < 9; r++) {
        _state.notes[r][col][noteIdx] = false;
      }
      // Clear in same 3x3 box
      for (var br = box.boxRow; br < box.boxRow + 3; br++) {
        for (var bc = box.boxCol; bc < box.boxCol + 3; bc++) {
          _state.notes[br][bc][noteIdx] = false;
        }
      }
    }

    _state.moves++;
    return { success: true };
  }

  function toggleNote(row, col, n) {
    if (_state.given[row][col]) {
      return { success: false };
    }
    if (_state.grid[row][col] !== 0) {
      return { success: false };
    }

    // Push undo record
    _state.undoStack.push({
      type: 'note',
      row: row,
      col: col,
      prevNotes: _state.notes[row][col].slice()
    });

    // Toggle (n is 1-9, index is 0-8)
    _state.notes[row][col][n - 1] = !_state.notes[row][col][n - 1];

    _state.moves++;
    return { success: true };
  }

  function checkErrors() {
    var errors = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (!_state.given[r][c] && _state.grid[r][c] !== 0 && _state.grid[r][c] !== _state.solution[r][c]) {
          errors.push({ row: r, col: c });
        }
      }
    }
    return errors;
  }

  function getHint() {
    var emptyCells = [];
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (_state.grid[r][c] === 0 && !_state.given[r][c]) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }
    if (emptyCells.length === 0) return null;

    var pick = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    return { row: pick.row, col: pick.col, value: _state.solution[pick.row][pick.col] };
  }

  function isComplete() {
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (_state.grid[r][c] !== _state.solution[r][c]) return false;
      }
    }
    return true;
  }

  function undo() {
    if (_state.undoStack.length === 0) {
      return { success: false };
    }

    var record = _state.undoStack.pop();

    if (record.type === 'value') {
      _state.grid[record.row][record.col] = record.prevValue;
      _state.notes[record.row][record.col] = record.prevNotes;
    } else if (record.type === 'note') {
      _state.notes[record.row][record.col] = record.prevNotes;
    }

    _state.moves--;
    return { success: true, type: record.type };
  }

  function getSavedGame() {
    return {
      grid: cloneGrid(_state.grid),
      solution: cloneGrid(_state.solution),
      given: cloneGrid(_state.given),
      notes: cloneNotes(_state.notes),
      difficulty: _state.difficulty,
      moves: _state.moves,
      version: 1
    };
  }

  function loadGame(savedState) {
    if (!savedState || savedState.version !== 1) {
      return { success: false };
    }
    if (!savedState.grid || !savedState.solution || !savedState.given || !savedState.notes || !savedState.difficulty) {
      return { success: false };
    }

    _state.grid = cloneGrid(savedState.grid);
    _state.solution = cloneGrid(savedState.solution);
    _state.given = cloneGrid(savedState.given);
    _state.notes = cloneNotes(savedState.notes);
    _state.difficulty = savedState.difficulty;
    _state.moves = savedState.moves || 0;
    _state.undoStack = [];

    return { success: true };
  }

  function getCompletedCount(digit) {
    var count = 0;
    for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
        if (_state.grid[r][c] === digit) count++;
      }
    }
    return count;
  }

  // ── Public interface ───────────────────────────────────────

  return {
    DIFFICULTY: DIFFICULTY,
    newGame: newGame,
    getState: getState,
    setValue: setValue,
    toggleNote: toggleNote,
    checkErrors: checkErrors,
    getHint: getHint,
    isComplete: isComplete,
    undo: undo,
    getSavedGame: getSavedGame,
    loadGame: loadGame,
    getCompletedCount: getCompletedCount
  };

})();
