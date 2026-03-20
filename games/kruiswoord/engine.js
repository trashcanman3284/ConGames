/**
 * KruiswoordEngine — Afrikaans crossword grid generator and game state manager
 * Pure logic, zero DOM. Generates valid numbered grids for three difficulty levels.
 * Used by: games/kruiswoord/ui.js
 *
 * Pattern: IIFE, ES5-compatible (no let/const/arrow/template literals/destructuring)
 */
var KruiswoordEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  var DIFFICULTY = {
    maklik:  { label: 'Maklik',  size: 9,  wordCount: 7  },
    medium:  { label: 'Medium',  size: 13, wordCount: 13 },
    moeilik: { label: 'Moeilik', size: 17, wordCount: 18 }
  };

  // ── Internal state ─────────────────────────────────────────────────────────

  var _state = {
    grid:           [],   // 2D array of {letter, number, isBlack, entered}
    words:          [],   // [{word, clue, number, direction, row, col, length, complete}]
    difficulty:     '',
    startTime:      0,
    elapsedSeconds: 0,
    undoStack:      []
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Fisher-Yates shuffle (returns new array, does not mutate)
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

  // Create size x size grid, all cells start as black
  function createEmptyGrid(size) {
    var grid = [];
    for (var r = 0; r < size; r++) {
      grid[r] = [];
      for (var c = 0; c < size; c++) {
        grid[r][c] = { letter: '', number: 0, isBlack: true, entered: '' };
      }
    }
    return grid;
  }

  // Deep clone state for getState() — cell-by-cell, word-by-word
  function deepCloneState() {
    var grid = [];
    for (var r = 0; r < _state.grid.length; r++) {
      grid[r] = [];
      for (var c = 0; c < _state.grid[r].length; c++) {
        var cell = _state.grid[r][c];
        grid[r][c] = {
          letter:  cell.letter,
          number:  cell.number,
          isBlack: cell.isBlack,
          entered: cell.entered
        };
      }
    }
    var words = [];
    for (var i = 0; i < _state.words.length; i++) {
      var w = _state.words[i];
      words.push({
        word:      w.word,
        clue:      w.clue,
        number:    w.number,
        direction: w.direction,
        row:       w.row,
        col:       w.col,
        length:    w.length,
        complete:  w.complete
      });
    }
    return {
      grid:           grid,
      words:          words,
      difficulty:     _state.difficulty,
      elapsedSeconds: _state.elapsedSeconds
    };
  }

  // ── Word selection ─────────────────────────────────────────────────────────

  /**
   * selectWords(clues, config)
   * Bucket clues into short/medium/long, shuffle each, pick 30/40/30 mix.
   * Returns array of {word, clue} sorted by length descending (anchor first).
   */
  function selectWords(clues, config) {
    var short  = [];  // 4-5 chars
    var medium = [];  // 6-7 chars
    var long_  = [];  // 8-10 chars

    for (var i = 0; i < clues.length; i++) {
      var len = clues[i].word.length;
      if (len <= 5)       short.push(clues[i]);
      else if (len <= 7)  medium.push(clues[i]);
      else                long_.push(clues[i]);
    }

    short  = shuffle(short);
    medium = shuffle(medium);
    long_  = shuffle(long_);

    var shortCount  = Math.round(config.wordCount * 0.3);
    var medCount    = Math.round(config.wordCount * 0.4);
    var longCount   = config.wordCount - shortCount - medCount;

    // Guarantee anchor is from long bucket (longest word, min len 8 for moeilik)
    // Pull anchor word out first, then fill the rest
    var anchorWord = null;
    if (long_.length > 0) {
      // Find longest word in long_ bucket
      var maxLen = 0;
      var maxIdx = 0;
      for (var j = 0; j < long_.length; j++) {
        if (long_[j].word.length > maxLen) {
          maxLen = long_[j].word.length;
          maxIdx = j;
        }
      }
      anchorWord = long_[maxIdx];
      long_.splice(maxIdx, 1);
      longCount = Math.max(0, longCount - 1);
    }

    // Take from each bucket, fill from others if short
    var selected = [];

    // Long words (anchorWord already reserved)
    var fromLong = long_.slice(0, longCount);
    var longShortfall = longCount - fromLong.length;

    // Medium words
    var fromMedium = medium.slice(0, medCount);
    var medShortfall = medCount - fromMedium.length;

    // Short words
    var fromShort = short.slice(0, shortCount);
    var shortShortfall = shortCount - fromShort.length;

    selected = fromLong.concat(fromMedium).concat(fromShort);

    // Fill any shortfall from whichever bucket has surplus
    var extras = long_.slice(fromLong.length)
                 .concat(medium.slice(fromMedium.length))
                 .concat(short.slice(fromShort.length));
    var totalShortfall = longShortfall + medShortfall + shortShortfall;
    for (var k = 0; k < totalShortfall && k < extras.length; k++) {
      selected.push(extras[k]);
    }

    // Sort by length descending
    selected.sort(function(a, b) { return b.word.length - a.word.length; });

    // Prepend anchor (longest word goes first)
    if (anchorWord) {
      selected.unshift(anchorWord);
    }

    return selected;
  }

  // ── Grid placement ─────────────────────────────────────────────────────────

  /**
   * placeAnchor(grid, wordObj, size)
   * Place the first (longest) word horizontally at grid centre.
   * Returns word entry object.
   */
  function placeAnchor(grid, wordObj, size) {
    var midRow   = Math.floor(size / 2);
    var startCol = Math.floor((size - wordObj.word.length) / 2);
    for (var c = 0; c < wordObj.word.length; c++) {
      grid[midRow][startCol + c].letter  = wordObj.word[c];
      grid[midRow][startCol + c].isBlack = false;
    }
    return {
      word:      wordObj.word,
      clue:      wordObj.clue,
      number:    0,
      direction: 'across',
      row:       midRow,
      col:       startCol,
      length:    wordObj.word.length,
      complete:  false
    };
  }

  /**
   * canPlace(grid, word, row, col, direction, size)
   * Returns true if word can be placed at (row, col) in given direction.
   * A cell must be either:
   *   - currently black (will be turned white), OR
   *   - already have the exact same letter (shared intersection)
   * A cell with a different letter → conflict → false.
   */
  function canPlace(grid, word, row, col, direction, size) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    for (var i = 0; i < word.length; i++) {
      var r = row + i * dr;
      var c = col + i * dc;
      if (r < 0 || r >= size || c < 0 || c >= size) return false;
      var cell = grid[r][c];
      if (cell.isBlack) {
        // Black cell — fine, will be converted
        continue;
      }
      // White cell (already placed) — must match
      if (cell.letter !== '' && cell.letter !== word[i]) return false;
    }
    return true;
  }

  /**
   * checkEndpointClearance(grid, row, col, direction, length, size)
   * Ensure no letter immediately before first cell or after last cell.
   * Prevents words merging end-to-end.
   */
  function checkEndpointClearance(grid, row, col, direction, length, size) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    // Before first letter
    var preR = row - dr;
    var preC = col - dc;
    if (preR >= 0 && preR < size && preC >= 0 && preC < size) {
      if (grid[preR][preC].letter !== '') return false;
    }
    // After last letter
    var endR = row + dr * length;
    var endC = col + dc * length;
    if (endR >= 0 && endR < size && endC >= 0 && endC < size) {
      if (grid[endR][endC].letter !== '') return false;
    }
    return true;
  }

  /**
   * isPartOfWordInDirection(placedWords, r, c, direction)
   * Returns true if cell (r, c) is within any placed word of the given direction.
   */
  function isPartOfWordInDirection(placedWords, r, c, direction) {
    for (var i = 0; i < placedWords.length; i++) {
      var pw = placedWords[i];
      if (pw.direction !== direction) continue;
      var dr = direction === 'down' ? 1 : 0;
      var dc = direction === 'across' ? 1 : 0;
      for (var j = 0; j < pw.length; j++) {
        if (pw.row + j * dr === r && pw.col + j * dc === c) return true;
      }
    }
    return false;
  }

  /**
   * checkParallelAdjacency(grid, word, row, col, direction, size, placedWords)
   * Prevent side-by-side parallel words creating phantom perpendicular "words".
   * For each cell the candidate occupies, check perpendicular neighbours.
   * If a neighbour has a letter AND belongs to a word of the same direction → reject.
   */
  function checkParallelAdjacency(grid, word, row, col, direction, size, placedWords) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    // Perpendicular offset (check neighbours in the cross direction)
    var pr = direction === 'across' ? 1 : 0;
    var pc = direction === 'down'   ? 1 : 0;

    for (var i = 0; i < word.length; i++) {
      var r = row + i * dr;
      var c = col + i * dc;
      // Check both sides
      for (var side = -1; side <= 1; side += 2) {
        var nr = r + side * pr;
        var nc = c + side * pc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        var neighbour = grid[nr][nc];
        if (!neighbour.isBlack && neighbour.letter !== '') {
          // This neighbour has a letter — is it part of a word in the same direction as candidate?
          if (isPartOfWordInDirection(placedWords, nr, nc, direction)) {
            return false;  // parallel adjacency violation
          }
        }
      }
    }
    return true;
  }

  /**
   * countIntersections(grid, word, row, col, direction)
   * Count cells in the word's span that already have the same letter (shared cells).
   */
  function countIntersections(grid, word, row, col, direction) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    var count = 0;
    for (var i = 0; i < word.length; i++) {
      var r = row + i * dr;
      var c = col + i * dc;
      var cell = grid[r][c];
      if (!cell.isBlack && cell.letter === word[i]) count++;
    }
    return count;
  }

  /**
   * scoreCandidate(candidate, size)
   * Prefer more intersections; prefer placements closer to grid centre.
   */
  function scoreCandidate(candidate, size) {
    var mid = size / 2;
    var distFromCentre = Math.abs(candidate.row - mid) + Math.abs(candidate.col - mid);
    return (candidate.intersections * 10) - distFromCentre;
  }

  /**
   * findCandidatePlacements(wordObj, placedWords, grid, size, startTime)
   * Scan all placed words for letter intersections with the candidate word.
   * Applies canPlace + checkEndpointClearance + checkParallelAdjacency.
   * Returns array of {row, col, direction, intersections}.
   */
  function findCandidatePlacements(wordObj, placedWords, grid, size, startTime) {
    // Time cap check — abort early if global 2-second limit exceeded
    if (Date.now() - startTime >= 2000) return [];

    var candidates = [];
    var word = wordObj.word;

    for (var p = 0; p < placedWords.length; p++) {
      if (Date.now() - startTime >= 2000) break;

      var placed = placedWords[p];
      var candidateDirection = placed.direction === 'across' ? 'down' : 'across';
      var pDr = placed.direction === 'down' ? 1 : 0;
      var pDc = placed.direction === 'across' ? 1 : 0;

      // Scan each letter of placed word
      for (var pi = 0; pi < placed.length; pi++) {
        var placedR = placed.row + pi * pDr;
        var placedC = placed.col + pi * pDc;
        var placedLetter = placed.word[pi];

        // Find matching letters in candidate word
        for (var wi = 0; wi < word.length; wi++) {
          if (word[wi] !== placedLetter) continue;

          // Compute candidate start from intersection
          var cDr = candidateDirection === 'down' ? 1 : 0;
          var cDc = candidateDirection === 'across' ? 1 : 0;
          var startRow = placedR - wi * cDr;
          var startCol = placedC - wi * cDc;

          // Validate placement
          if (!canPlace(grid, word, startRow, startCol, candidateDirection, size)) continue;
          if (!checkEndpointClearance(grid, startRow, startCol, candidateDirection, word.length, size)) continue;
          if (!checkParallelAdjacency(grid, word, startRow, startCol, candidateDirection, size, placedWords)) continue;

          // Count all intersections (with ALL placed words, not just this one)
          var intersections = countIntersections(grid, word, startRow, startCol, candidateDirection);

          candidates.push({
            row:          startRow,
            col:          startCol,
            direction:    candidateDirection,
            intersections: intersections
          });
        }
      }
    }

    return candidates;
  }

  /**
   * commitPlacement(grid, wordObj, row, col, direction)
   * Write word onto grid cells, set isBlack=false.
   * Returns word entry object.
   */
  function commitPlacement(grid, wordObj, row, col, direction) {
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    for (var i = 0; i < wordObj.word.length; i++) {
      var r = row + i * dr;
      var c = col + i * dc;
      grid[r][c].letter  = wordObj.word[i];
      grid[r][c].isBlack = false;
    }
    return {
      word:      wordObj.word,
      clue:      wordObj.clue,
      number:    0,
      direction: direction,
      row:       row,
      col:       col,
      length:    wordObj.word.length,
      complete:  false
    };
  }

  /**
   * assignCellNumbers(grid, words, size)
   * Scan row-major (left-to-right, top-to-bottom).
   * Assign sequential numbers to cells that start an Across or Down word.
   * One number per cell even if it starts both directions.
   */
  function assignCellNumbers(grid, words, size) {
    var num = 1;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (grid[r][c].isBlack) continue;

        // startsAcross: left edge or previous cell is black, AND next cell exists and is white
        var startsAcross = (c === 0 || grid[r][c - 1].isBlack) &&
                           (c + 1 < size && !grid[r][c + 1].isBlack);

        // startsDown: top edge or cell above is black, AND cell below exists and is white
        var startsDown   = (r === 0 || grid[r - 1][c].isBlack) &&
                           (r + 1 < size && !grid[r + 1][c].isBlack);

        if (startsAcross || startsDown) {
          grid[r][c].number = num;
          // Back-fill the number into matching word entries
          for (var i = 0; i < words.length; i++) {
            var w = words[i];
            if (w.row === r && w.col === c) {
              if (w.direction === 'across' && startsAcross) w.number = num;
              if (w.direction === 'down'   && startsDown)   w.number = num;
            }
          }
          num++;
        }
      }
    }
  }

  // ── Generation core ────────────────────────────────────────────────────────

  /**
   * _tryGenerate(config, clues, startTime)
   * Single generation attempt. Returns {grid, words}.
   */
  function _tryGenerate(config, clues, startTime) {
    var wordList    = selectWords(clues, config);
    var grid        = createEmptyGrid(config.size);
    var placedWords = [];

    if (wordList.length === 0) return { grid: grid, words: [] };

    // Place anchor (first/longest word) horizontally at centre
    var anchorEntry = placeAnchor(grid, wordList[0], config.size);
    placedWords.push(anchorEntry);

    // Place remaining words (already in descending length order after anchor)
    for (var i = 1; i < wordList.length; i++) {
      if (Date.now() - startTime >= 2000) break;

      var wordObj    = wordList[i];
      var candidates = findCandidatePlacements(wordObj, placedWords, grid, config.size, startTime);

      if (candidates.length === 0) continue;

      // Pick best candidate by score
      var best      = candidates[0];
      var bestScore = scoreCandidate(candidates[0], config.size);
      for (var j = 1; j < candidates.length; j++) {
        var s = scoreCandidate(candidates[j], config.size);
        if (s > bestScore) {
          bestScore = s;
          best      = candidates[j];
        }
      }

      var entry = commitPlacement(grid, wordObj, best.row, best.col, best.direction);
      placedWords.push(entry);
    }

    return { grid: grid, words: placedWords };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * generate(difficulty, clues)
   * Main entry point. Retries up to 5 times (or 2-second cap) to reach target word count.
   * Returns deep-cloned game state {grid, words, difficulty, elapsedSeconds}.
   */
  function generate(difficulty, clues) {
    if (!DIFFICULTY[difficulty]) {
      throw new Error('KruiswoordEngine: unknown difficulty "' + difficulty + '"');
    }

    var config     = DIFFICULTY[difficulty];
    var startTime  = Date.now();
    var bestResult = null;

    for (var attempt = 0; attempt < 5; attempt++) {
      if (Date.now() - startTime >= 2000) break;

      var result = _tryGenerate(config, clues, startTime);

      if (!bestResult || result.words.length > bestResult.words.length) {
        bestResult = result;
      }

      if (result.words.length >= config.wordCount) break;
    }

    // Assign sequential cell numbers (left-to-right, top-to-bottom)
    assignCellNumbers(bestResult.grid, bestResult.words, config.size);

    // Reset game state
    _state.grid           = bestResult.grid;
    _state.words          = bestResult.words;
    _state.difficulty     = difficulty;
    _state.startTime      = Date.now();
    _state.undoStack      = [];
    _state.elapsedSeconds = 0;

    return getState();
  }

  /**
   * setLetter(row, col, letter)
   * Set the entered letter for a cell. Pushes to undo stack.
   */
  function setLetter(row, col, letter) {
    if (row < 0 || row >= _state.grid.length) return;
    if (col < 0 || col >= _state.grid[row].length) return;
    if (_state.grid[row][col].isBlack) return;

    var prev = _state.grid[row][col].entered;
    _state.undoStack.push({ row: row, col: col, prevEntered: prev });
    _state.grid[row][col].entered = letter ? letter.toUpperCase() : '';
  }

  /**
   * checkWord(number, direction)
   * Returns {correct: boolean, letters: [{row, col, correct}]}.
   * Sets word.complete = true if all letters correct.
   */
  function checkWord(number, direction) {
    var word = null;
    for (var i = 0; i < _state.words.length; i++) {
      if (_state.words[i].number === number && _state.words[i].direction === direction) {
        word = _state.words[i];
        break;
      }
    }
    if (!word) return { correct: false, letters: [] };

    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    var allCorrect = true;
    var letters    = [];

    for (var j = 0; j < word.length; j++) {
      var r    = word.row + j * dr;
      var c    = word.col + j * dc;
      var cell = _state.grid[r][c];
      var correct = cell.entered.toUpperCase() === cell.letter;
      letters.push({ row: r, col: c, correct: correct });
      if (!correct) allCorrect = false;
    }

    if (allCorrect) word.complete = true;

    return { correct: allCorrect, letters: letters };
  }

  /**
   * isComplete()
   * Returns true when every placed word is marked complete.
   */
  function isComplete() {
    for (var i = 0; i < _state.words.length; i++) {
      if (!_state.words[i].complete) return false;
    }
    return _state.words.length > 0;
  }

  /**
   * undo()
   * Reverts last setLetter call. Returns {success: boolean}.
   */
  function undo() {
    if (_state.undoStack.length === 0) return { success: false };
    var op = _state.undoStack.pop();
    _state.grid[op.row][op.col].entered = op.prevEntered;
    return { success: true };
  }

  /**
   * getState()
   * Returns deep clone of current game state.
   */
  function getState() {
    return deepCloneState();
  }

  /**
   * getElapsed()
   * Returns elapsed seconds since game start.
   */
  function getElapsed() {
    if (_state.startTime === 0) return 0;
    return Math.floor((Date.now() - _state.startTime) / 1000);
  }

  // ── Exports ────────────────────────────────────────────────────────────────

  return {
    DIFFICULTY: DIFFICULTY,
    generate:   generate,
    setLetter:  setLetter,
    checkWord:  checkWord,
    isComplete: isComplete,
    undo:       undo,
    getState:   getState,
    getElapsed: getElapsed
  };

})();
