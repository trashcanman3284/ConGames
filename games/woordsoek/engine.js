/**
 * Woord Soek Engine — Pure logic, no DOM access
 * Puzzle generation, word placement, selection validation
 */
var WoordSoekEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  var DIRECTIONS = {
    NORTH:      [-1,  0],
    SOUTH:      [ 1,  0],
    EAST:       [ 0,  1],
    WEST:       [ 0, -1],
    NORTH_EAST: [-1,  1],
    NORTH_WEST: [-1, -1],
    SOUTH_EAST: [ 1,  1],
    SOUTH_WEST: [ 1, -1]
  };

  var DIR_NAMES = Object.keys(DIRECTIONS);

  var DIFFICULTY = {
    easy:   { rows: 10, cols: 10, wordCount:  8, minLen: 4, maxLen:  7, label: 'Maklik' },
    medium: { rows: 12, cols: 12, wordCount: 12, minLen: 4, maxLen:  9, label: 'Medium' },
    hard:   { rows: 15, cols: 15, wordCount: 18, minLen: 4, maxLen: 12, label: 'Moeilik' }
  };

  var FILL_LETTERS = 'AAABCDDEEEEFGGHIIIJKKLLMNNOOOPRRSSSSTTTTUUVWYZ';

  var HIGHLIGHT_COLOURS = [
    'rgba(91,155,213,0.45)',
    'rgba(76,175,120,0.45)',
    'rgba(224,150,60,0.45)',
    'rgba(180,100,200,0.45)',
    'rgba(230,80,80,0.45)',
    'rgba(60,200,200,0.45)',
    'rgba(220,200,60,0.45)',
    'rgba(200,120,160,0.45)'
  ];

  // ── Cache ──────────────────────────────────────────────────

  var _filteredCache = null;

  // ── Utility ────────────────────────────────────────────────

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function randomFillLetter() {
    return FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
  }

  // ── Word filtering ────────────────────────────────────────

  function filterWords(allWords) {
    if (_filteredCache) return _filteredCache;

    var result = [];
    var re = /^[a-zA-Z]+$/;
    for (var i = 0; i < allWords.length; i++) {
      var w = allWords[i];
      if (w.length >= 4 && re.test(w)) {
        result.push(w.toUpperCase());
      }
    }

    // Deduplicate
    var seen = {};
    var unique = [];
    for (var k = 0; k < result.length; k++) {
      if (!seen[result[k]]) {
        seen[result[k]] = true;
        unique.push(result[k]);
      }
    }

    _filteredCache = unique;
    return _filteredCache;
  }

  // ── Grid helpers ──────────────────────────────────────────

  function createGrid(rows, cols) {
    var grid = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < cols; c++) {
        row.push(null);
      }
      grid.push(row);
    }
    return grid;
  }

  function canPlace(grid, word, startR, startC, dr, dc, rows, cols) {
    for (var i = 0; i < word.length; i++) {
      var r = startR + i * dr;
      var c = startC + i * dc;
      if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
      if (grid[r][c] !== null && grid[r][c] !== word[i]) return false;
    }
    return true;
  }

  function doPlace(grid, word, startR, startC, dr, dc) {
    var cells = [];
    for (var i = 0; i < word.length; i++) {
      var r = startR + i * dr;
      var c = startC + i * dc;
      grid[r][c] = word[i];
      cells.push({ r: r, c: c });
    }
    return cells;
  }

  // ── Puzzle generation ─────────────────────────────────────

  function generatePuzzle(filteredWords, difficulty) {
    var config = DIFFICULTY[difficulty] || DIFFICULTY.medium;
    var rows = config.rows;
    var cols = config.cols;
    var targetCount = config.wordCount;

    // Filter by length range
    var candidates = [];
    for (var i = 0; i < filteredWords.length; i++) {
      var w = filteredWords[i];
      if (w.length >= config.minLen && w.length <= config.maxLen) {
        candidates.push(w);
      }
    }

    var maxRetries = 3;
    var bestResult = null;

    for (var retry = 0; retry < maxRetries; retry++) {
      shuffle(candidates);

      // Take a pool 3x larger than target
      var poolSize = Math.min(targetCount * 3, candidates.length);
      var pool = candidates.slice(0, poolSize);

      var grid = createGrid(rows, cols);
      var placedWords = [];

      for (var wi = 0; wi < pool.length && placedWords.length < targetCount; wi++) {
        var word = pool[wi];
        var placed = false;

        // Try up to 100 random position+direction combos
        for (var attempt = 0; attempt < 100 && !placed; attempt++) {
          var dirIdx = Math.floor(Math.random() * DIR_NAMES.length);
          var dirName = DIR_NAMES[dirIdx];
          var dir = DIRECTIONS[dirName];
          var dr = dir[0];
          var dc = dir[1];

          var startR = Math.floor(Math.random() * rows);
          var startC = Math.floor(Math.random() * cols);

          if (canPlace(grid, word, startR, startC, dr, dc, rows, cols)) {
            var cells = doPlace(grid, word, startR, startC, dr, dc);
            placedWords.push({
              word: word,
              row: startR,
              col: startC,
              dirName: dirName,
              cells: cells
            });
            placed = true;
          }
        }
      }

      if (placedWords.length >= 5) {
        bestResult = { grid: grid, placedWords: placedWords, rows: rows, cols: cols };
        if (placedWords.length >= targetCount) break;
      }

      if (!bestResult) {
        bestResult = { grid: grid, placedWords: placedWords, rows: rows, cols: cols };
      }
    }

    if (bestResult.placedWords.length < targetCount) {
      console.warn('WoordSoekEngine: Only placed ' + bestResult.placedWords.length + ' of ' + targetCount + ' words');
    }

    // Fill remaining null cells
    var grid = bestResult.grid;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        if (grid[r][c] === null) {
          grid[r][c] = randomFillLetter();
        }
      }
    }

    return bestResult;
  }

  // ── Selection validation ──────────────────────────────────

  function getDirection(r1, c1, r2, c2) {
    var dr = r2 - r1;
    var dc = c2 - c1;

    // Must be same row, same col, or perfect diagonal
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) {
      return null;
    }

    var length = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
    if (length < 2) return null;

    return {
      dr: Math.sign(dr),
      dc: Math.sign(dc),
      length: length
    };
  }

  function getCellsInLine(r1, c1, r2, c2) {
    var dir = getDirection(r1, c1, r2, c2);
    if (!dir) return [];

    var cells = [];
    for (var i = 0; i < dir.length; i++) {
      cells.push({
        r: r1 + i * dir.dr,
        c: c1 + i * dir.dc
      });
    }
    return cells;
  }

  function checkSelection(startR, startC, endR, endC, placedWords) {
    var dir = getDirection(startR, startC, endR, endC);
    if (!dir) return { found: false };

    var selDr = dir.dr;
    var selDc = dir.dc;
    var selLen = dir.length;

    for (var i = 0; i < placedWords.length; i++) {
      var pw = placedWords[i];
      var pwDir = DIRECTIONS[pw.dirName];
      var pwDr = pwDir[0];
      var pwDc = pwDir[1];
      var pwLen = pw.word.length;

      // Forward match: start matches, direction matches, length matches
      if (pw.row === startR && pw.col === startC &&
          pwDr === selDr && pwDc === selDc && pwLen === selLen) {
        return { found: true, word: pw.word, index: i };
      }

      // Reverse match: selection goes from last cell to first cell
      var lastCell = pw.cells[pw.cells.length - 1];
      if (lastCell.r === startR && lastCell.c === startC &&
          -pwDr === selDr && -pwDc === selDc && pwLen === selLen) {
        return { found: true, word: pw.word, index: i };
      }
    }

    return { found: false };
  }

  // ── Public API ────────────────────────────────────────────

  return {
    generatePuzzle: generatePuzzle,
    checkSelection: checkSelection,
    getDirection: getDirection,
    getCellsInLine: getCellsInLine,
    filterWords: filterWords,
    DIRECTIONS: DIRECTIONS,
    DIFFICULTY: DIFFICULTY,
    HIGHLIGHT_COLOURS: HIGHLIGHT_COLOURS
  };

})();
