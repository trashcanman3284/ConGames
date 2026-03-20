/**
 * test-engine.js — Functional verification for KruiswoordEngine
 * Run: node games/kruiswoord/test-engine.js
 * Exits 0 if all pass, 1 if any fail.
 */
var fs = require('fs');

// Load engine by evaluating the IIFE in current scope
var engineSrc = fs.readFileSync(__dirname + '/engine.js', 'utf8');
eval(engineSrc);
// KruiswoordEngine is now available

var clues = JSON.parse(fs.readFileSync(__dirname + '/clues.json', 'utf8'));

// ── Test harness ──────────────────────────────────────────────────────────────

var passed = 0;
var failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('PASS  ' + name);
    passed++;
  } catch (err) {
    console.log('FAIL  ' + name);
    console.log('      ' + err.message);
    failed++;
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error('Assertion failed: ' + msg);
}

// ── ENG-01: Easy grid (9x9, >=7 words) ───────────────────────────────────────

var resultMaklik;
test('ENG-01a: generate(maklik) returns a result', function() {
  resultMaklik = KruiswoordEngine.generate('maklik', clues);
  assert(resultMaklik !== null && typeof resultMaklik === 'object', 'result is object');
});

test('ENG-01b: maklik grid rows === 9', function() {
  assert(resultMaklik.grid.length === 9, 'grid rows === 9, got ' + resultMaklik.grid.length);
});

test('ENG-01c: maklik grid cols === 9', function() {
  assert(resultMaklik.grid[0].length === 9, 'grid cols === 9, got ' + resultMaklik.grid[0].length);
});

test('ENG-01d: maklik words >= 7', function() {
  assert(resultMaklik.words.length >= 7,
    'ENG-01: words >= 7, got ' + resultMaklik.words.length);
});

// ── ENG-02: Medium grid (13x13, >=13 words) ───────────────────────────────────

var resultMedium;
test('ENG-02a: generate(medium) returns a result', function() {
  resultMedium = KruiswoordEngine.generate('medium', clues);
  assert(resultMedium !== null && typeof resultMedium === 'object', 'result is object');
});

test('ENG-02b: medium grid rows === 13', function() {
  assert(resultMedium.grid.length === 13, 'grid rows === 13, got ' + resultMedium.grid.length);
});

test('ENG-02c: medium grid cols === 13', function() {
  assert(resultMedium.grid[0].length === 13, 'grid cols === 13, got ' + resultMedium.grid[0].length);
});

test('ENG-02d: medium words >= 13', function() {
  assert(resultMedium.words.length >= 13,
    'ENG-02: words >= 13, got ' + resultMedium.words.length);
});

// ── ENG-03: Hard grid (17x17, >=18 words) ─────────────────────────────────────

var resultMoeilik;
test('ENG-03a: generate(moeilik) returns a result', function() {
  resultMoeilik = KruiswoordEngine.generate('moeilik', clues);
  assert(resultMoeilik !== null && typeof resultMoeilik === 'object', 'result is object');
});

test('ENG-03b: moeilik grid rows === 17', function() {
  assert(resultMoeilik.grid.length === 17, 'grid rows === 17, got ' + resultMoeilik.grid.length);
});

test('ENG-03c: moeilik grid cols === 17', function() {
  assert(resultMoeilik.grid[0].length === 17, 'grid cols === 17, got ' + resultMoeilik.grid[0].length);
});

test('ENG-03d: moeilik words >= 18', function() {
  assert(resultMoeilik.words.length >= 18,
    'ENG-03: words >= 18, got ' + resultMoeilik.words.length);
});

// ── ENG-04: Cell numbers sequential left-to-right top-to-bottom ───────────────

test('ENG-04: cell numbers sequential in reading order (moeilik grid)', function() {
  var grid = resultMoeilik.grid;
  var numbers = [];
  for (var r = 0; r < grid.length; r++) {
    for (var c = 0; c < grid[r].length; c++) {
      if (grid[r][c].number > 0) numbers.push(grid[r][c].number);
    }
  }
  assert(numbers.length > 0, 'ENG-04: at least 1 numbered cell');
  for (var i = 0; i < numbers.length; i++) {
    assert(numbers[i] === i + 1,
      'ENG-04: number at index ' + i + ' should be ' + (i + 1) + ', got ' + numbers[i]);
  }
});

test('ENG-04: all words have a number assigned', function() {
  var words = resultMoeilik.words;
  for (var i = 0; i < words.length; i++) {
    assert(words[i].number > 0, 'word "' + words[i].word + '" has number=0');
  }
});

// ── ENG-05: Retry logic / time cap ────────────────────────────────────────────

test('ENG-05: moeilik generation completes within 5s safety cap', function() {
  var start   = Date.now();
  var res     = KruiswoordEngine.generate('moeilik', clues);
  var elapsed = Date.now() - start;
  assert(elapsed < 5000, 'ENG-05: generation took ' + elapsed + 'ms, expected < 5000');
  assert(res.words.length > 0, 'ENG-05: at least some words placed');
});

// ── Word structure checks ─────────────────────────────────────────────────────

test('Word objects have required fields', function() {
  var required = ['word', 'clue', 'number', 'direction', 'row', 'col', 'length', 'complete'];
  var words = resultMoeilik.words;
  assert(words.length > 0, 'at least one word to check');
  for (var i = 0; i < words.length; i++) {
    for (var f = 0; f < required.length; f++) {
      assert(required[f] in words[i],
        'word[' + i + '] missing field "' + required[f] + '"');
    }
  }
});

test('Grid cells have required fields', function() {
  var grid = resultMoeilik.grid;
  var required = ['letter', 'number', 'isBlack', 'entered'];
  var cell = grid[0][0];
  for (var f = 0; f < required.length; f++) {
    assert(required[f] in cell, 'cell missing field "' + required[f] + '"');
  }
});

test('Word letters match grid cells', function() {
  var words = resultMoeilik.words;
  var grid  = resultMoeilik.grid;
  for (var i = 0; i < words.length; i++) {
    var w  = words[i];
    var dr = w.direction === 'down' ? 1 : 0;
    var dc = w.direction === 'across' ? 1 : 0;
    for (var j = 0; j < w.length; j++) {
      var r = w.row + j * dr;
      var c = w.col + j * dc;
      assert(grid[r][c].letter === w.word[j],
        'word "' + w.word + '" char ' + j + ': grid=' + grid[r][c].letter + ' expected=' + w.word[j]);
    }
  }
});

test('Every word intersects at least one other word (connected grid)', function() {
  var words = resultMoeilik.words;
  var grid  = resultMoeilik.grid;
  // For each word, check at least one of its cells shares a letter with a word in the other direction
  for (var i = 0; i < words.length; i++) {
    var w  = words[i];
    if (words.length === 1) break; // single word can't intersect
    var dr = w.direction === 'down' ? 1 : 0;
    var dc = w.direction === 'across' ? 1 : 0;
    var hasIntersection = false;
    for (var j = 0; j < w.length; j++) {
      var r = w.row + j * dr;
      var c = w.col + j * dc;
      // Check if any other word passes through this cell in the opposite direction
      var oppositeDir = w.direction === 'across' ? 'down' : 'across';
      for (var k = 0; k < words.length; k++) {
        if (k === i) continue;
        if (words[k].direction !== oppositeDir) continue;
        var pw  = words[k];
        var pDr = pw.direction === 'down' ? 1 : 0;
        var pDc = pw.direction === 'across' ? 1 : 0;
        for (var l = 0; l < pw.length; l++) {
          if (pw.row + l * pDr === r && pw.col + l * pDc === c) {
            hasIntersection = true;
          }
        }
      }
    }
    assert(hasIntersection, 'word "' + w.word + '" has no intersection with any other word');
  }
});

// ── Game state API ─────────────────────────────────────────────────────────────

// Generate a fresh maklik game for state API tests
var stateResult = KruiswoordEngine.generate('maklik', clues);
var firstWord   = stateResult.words[0];

test('setLetter: changes entered field', function() {
  KruiswoordEngine.setLetter(firstWord.row, firstWord.col, 'X');
  var state = KruiswoordEngine.getState();
  assert(state.grid[firstWord.row][firstWord.col].entered === 'X',
    'entered should be X, got ' + state.grid[firstWord.row][firstWord.col].entered);
});

test('setLetter: uppercases the letter', function() {
  KruiswoordEngine.setLetter(firstWord.row, firstWord.col, 'a');
  var state = KruiswoordEngine.getState();
  assert(state.grid[firstWord.row][firstWord.col].entered === 'A',
    'entered should be A (uppercase), got ' + state.grid[firstWord.row][firstWord.col].entered);
});

test('undo: reverts last setLetter', function() {
  // At this point entered='A', previous was 'X'
  var result = KruiswoordEngine.undo();
  assert(result.success === true, 'undo should return success:true');
  var state = KruiswoordEngine.getState();
  assert(state.grid[firstWord.row][firstWord.col].entered === 'X',
    'after undo, entered should be X, got ' + state.grid[firstWord.row][firstWord.col].entered);
});

test('undo: can undo again', function() {
  var result = KruiswoordEngine.undo();
  assert(result.success === true, 'second undo should succeed');
  var state = KruiswoordEngine.getState();
  assert(state.grid[firstWord.row][firstWord.col].entered === '',
    'after second undo, entered should be empty');
});

test('undo: returns success:false when stack empty', function() {
  // Undo all remaining (may be 0)
  var maxUndo = 50;
  while (maxUndo-- > 0) {
    var res = KruiswoordEngine.undo();
    if (!res.success) break;
  }
  var result = KruiswoordEngine.undo();
  assert(result.success === false, 'undo on empty stack should return success:false');
});

test('checkWord: returns correct:false when letters wrong', function() {
  // Set wrong letter in first word
  KruiswoordEngine.setLetter(firstWord.row, firstWord.col, 'Z');
  var result = KruiswoordEngine.checkWord(firstWord.number, firstWord.direction);
  assert(result.correct === false, 'checkWord should be false with wrong letters');
  assert(Array.isArray(result.letters), 'letters should be array');
  assert(result.letters.length === firstWord.length,
    'letters array length should equal word length');
});

test('checkWord: returns correct:true when all letters match', function() {
  // Fill the first word with correct letters
  var dr = firstWord.direction === 'down' ? 1 : 0;
  var dc = firstWord.direction === 'across' ? 1 : 0;
  for (var i = 0; i < firstWord.length; i++) {
    KruiswoordEngine.setLetter(
      firstWord.row + i * dr,
      firstWord.col + i * dc,
      firstWord.word[i]
    );
  }
  var result = KruiswoordEngine.checkWord(firstWord.number, firstWord.direction);
  assert(result.correct === true, 'checkWord should be true with correct letters');
  assert(result.letters.length === firstWord.length,
    'letters array length should equal word length');
  // All individual letters should be marked correct
  for (var j = 0; j < result.letters.length; j++) {
    assert(result.letters[j].correct === true,
      'letter ' + j + ' should be correct');
  }
});

test('isComplete: false when not all words filled', function() {
  // Only one word is complete (firstWord). Others are empty.
  var complete = KruiswoordEngine.isComplete();
  var wordCount = stateResult.words.length;
  if (wordCount === 1) {
    // Edge case: only one word placed, and it's complete
    assert(complete === true, 'isComplete with 1 complete word of 1 should be true');
  } else {
    assert(complete === false, 'isComplete should be false with incomplete words');
  }
});

test('getElapsed: returns a non-negative number', function() {
  var elapsed = KruiswoordEngine.getElapsed();
  assert(typeof elapsed === 'number', 'getElapsed should return a number');
  assert(elapsed >= 0, 'getElapsed should be >= 0, got ' + elapsed);
});

test('getState: returns deep clone (not reference)', function() {
  var state1 = KruiswoordEngine.getState();
  var state2 = KruiswoordEngine.getState();
  // Mutating state1 should not affect state2
  state1.grid[0][0].entered = 'MUTATED';
  var fresh = KruiswoordEngine.getState();
  assert(fresh.grid[0][0].entered !== 'MUTATED',
    'getState should return deep clone, not reference');
});

test('DIFFICULTY constant is accessible', function() {
  assert(KruiswoordEngine.DIFFICULTY, 'DIFFICULTY should be exposed');
  assert(KruiswoordEngine.DIFFICULTY.maklik.size === 9, 'maklik size should be 9');
  assert(KruiswoordEngine.DIFFICULTY.medium.size === 13, 'medium size should be 13');
  assert(KruiswoordEngine.DIFFICULTY.moeilik.size === 17, 'moeilik size should be 17');
});

// ── Summary ────────────────────────────────────────────────────────────────────

var total = passed + failed;
console.log('');
console.log(passed + '/' + total + ' tests passed' + (failed > 0 ? ' (' + failed + ' failed)' : ''));

process.exit(failed > 0 ? 1 : 0);
