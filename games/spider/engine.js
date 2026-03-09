/**
 * Spider Solitaire Engine — 1/2/4 suit modes, pure logic, zero DOM
 * Used by: games/spider/ui.js
 */
var SpiderEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  var SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // ── Internal state ────────────────────────────────────────

  var _state = null;

  // ── Helpers ───────────────────────────────────────────────

  function rankValue(rank) {
    for (var i = 0; i < RANKS.length; i++) {
      if (RANKS[i] === rank) return i + 1;
    }
    return 0;
  }

  function cloneCard(card) {
    return { rank: card.rank, suit: card.suit, faceUp: card.faceUp };
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function cloneState(state) {
    return {
      tableau: state.tableau.map(function(col) { return col.map(cloneCard); }),
      stock: state.stock.map(cloneCard),
      foundations: state.foundations.map(function(seq) { return seq.map(cloneCard); }),
      undoStack: [],
      moves: state.moves,
      score: state.score,
      suitMode: state.suitMode,
      dealsRemaining: state.dealsRemaining
    };
  }

  function createDeck(suitMode) {
    var deck = [];
    var suitsUsed;
    var copies;

    if (suitMode === 1) {
      suitsUsed = ['spades'];
      copies = 8;
    } else if (suitMode === 2) {
      suitsUsed = ['spades', 'hearts'];
      copies = 4;
    } else {
      suitsUsed = ['spades', 'hearts', 'diamonds', 'clubs'];
      copies = 2;
    }

    for (var c = 0; c < copies; c++) {
      for (var s = 0; s < suitsUsed.length; s++) {
        for (var r = 0; r < RANKS.length; r++) {
          deck.push({ rank: RANKS[r], suit: suitsUsed[s], faceUp: false });
        }
      }
    }

    return deck;
  }

  /**
   * Check if the last 13 cards of a column form a K->A same-suit run.
   * If found: remove them, push to foundations, score +100, push undo record.
   * Returns true if a sequence was completed.
   */
  function checkForCompletedSequence(colIndex) {
    var col = _state.tableau[colIndex];
    if (col.length < 13) return false;

    // Check last 13 cards: must be K down to A, all same suit, all face-up
    var startIdx = col.length - 13;
    var suit = col[startIdx].suit;

    for (var i = 0; i < 13; i++) {
      var card = col[startIdx + i];
      if (!card.faceUp) return false;
      if (card.suit !== suit) return false;
      if (rankValue(card.rank) !== 13 - i) return false;
    }

    // Found a complete sequence! Remove the 13 cards
    var removed = col.splice(startIdx, 13).map(cloneCard);
    _state.foundations.push(removed);
    _state.score += 100;

    // Check if we need to flip the new top card
    var flipped = false;
    if (col.length > 0 && !col[col.length - 1].faceUp) {
      col[col.length - 1].faceUp = true;
      flipped = true;
    }

    // Push undo record for sequence removal
    var prevScore = _state.score - 100;
    _state.undoStack.push({
      type: 'sequence',
      cards: removed,
      col: colIndex,
      cardIndex: startIdx,
      flipped: flipped,
      prevScore: prevScore
    });

    return true;
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * 1. newGame(suitMode) — Create and deal a new Spider game
   */
  function newGame(suitMode) {
    suitMode = suitMode || 1;
    if (suitMode !== 1 && suitMode !== 2 && suitMode !== 4) suitMode = 1;

    var deck = shuffle(createDeck(suitMode));

    var tableau = [];
    var idx = 0;

    // Columns 0-3: 6 cards (5 face-down + 1 face-up)
    for (var c = 0; c < 4; c++) {
      var column = [];
      for (var r = 0; r < 6; r++) {
        var card = deck[idx++];
        card.faceUp = (r === 5);
        column.push(card);
      }
      tableau.push(column);
    }

    // Columns 4-9: 5 cards (4 face-down + 1 face-up)
    for (var c2 = 4; c2 < 10; c2++) {
      var column2 = [];
      for (var r2 = 0; r2 < 5; r2++) {
        var card2 = deck[idx++];
        card2.faceUp = (r2 === 4);
        column2.push(card2);
      }
      tableau.push(column2);
    }

    // Remaining 50 cards go to stock
    var stock = [];
    for (var i = idx; i < deck.length; i++) {
      deck[i].faceUp = false;
      stock.push(deck[i]);
    }

    _state = {
      tableau: tableau,
      stock: stock,
      foundations: [],
      undoStack: [],
      moves: 0,
      score: 500 * suitMode,
      suitMode: suitMode,
      dealsRemaining: 5
    };

    return cloneState(_state);
  }

  /**
   * 2. getState() — Return deep-cloned state
   */
  function getState() {
    if (!_state) return null;
    return cloneState(_state);
  }

  /**
   * 3. moveCards(from, to) — Move a sequence of cards between tableau columns
   */
  function moveCards(from, to) {
    if (!_state) return { success: false, sequenceCompleted: false };

    // Only tableau-to-tableau moves
    if (from.zone !== 'tableau' || to.zone !== 'tableau') {
      return { success: false, sequenceCompleted: false };
    }

    var srcCol = _state.tableau[from.col];
    var destCol = _state.tableau[to.col];

    if (from.cardIndex === undefined) from.cardIndex = srcCol.length - 1;
    if (from.cardIndex < 0 || from.cardIndex >= srcCol.length) {
      return { success: false, sequenceCompleted: false };
    }

    // Validate: cards from cardIndex to end must form descending sequence, all face-up
    for (var i = from.cardIndex; i < srcCol.length; i++) {
      if (!srcCol[i].faceUp) return { success: false, sequenceCompleted: false };
      if (i > from.cardIndex) {
        if (rankValue(srcCol[i].rank) !== rankValue(srcCol[i - 1].rank) - 1) {
          return { success: false, sequenceCompleted: false };
        }
      }
    }

    // Validate destination: empty col accepts anything, non-empty needs rank one higher
    var movingCard = srcCol[from.cardIndex];
    if (destCol.length > 0) {
      var topCard = destCol[destCol.length - 1];
      if (rankValue(topCard.rank) !== rankValue(movingCard.rank) + 1) {
        return { success: false, sequenceCompleted: false };
      }
    }

    // Execute the move
    var prevScore = _state.score;
    var movedCards = srcCol.splice(from.cardIndex, srcCol.length - from.cardIndex).map(cloneCard);

    // Flip new top card of source column if face-down
    var flipped = false;
    if (srcCol.length > 0 && !srcCol[srcCol.length - 1].faceUp) {
      srcCol[srcCol.length - 1].faceUp = true;
      flipped = true;
    }

    // Place cards at destination
    for (var j = 0; j < movedCards.length; j++) {
      destCol.push({ rank: movedCards[j].rank, suit: movedCards[j].suit, faceUp: true });
    }

    // Push undo record
    _state.undoStack.push({
      type: 'move',
      cards: movedCards,
      fromCol: from.col,
      fromCardIndex: from.cardIndex,
      toCol: to.col,
      flipped: flipped,
      prevScore: prevScore
    });

    _state.moves++;
    _state.score--;

    // Check for completed sequence on destination column
    var seqCompleted = checkForCompletedSequence(to.col);

    return { success: true, sequenceCompleted: seqCompleted };
  }

  /**
   * 4. dealFromStock() — Deal 10 cards (1 per column)
   */
  function dealFromStock() {
    if (!_state) return { success: false, reason: 'no_game' };

    if (_state.stock.length === 0) {
      return { success: false, reason: 'empty' };
    }

    // Check all columns have at least 1 card
    for (var c = 0; c < 10; c++) {
      if (_state.tableau[c].length === 0) {
        return { success: false, reason: 'empty_column' };
      }
    }

    var prevScore = _state.score;
    var dealtCards = [];

    // Pop 10 cards from stock, one per column
    for (var i = 0; i < 10; i++) {
      var card = _state.stock.pop();
      card.faceUp = true;
      _state.tableau[i].push(card);
      dealtCards.push(cloneCard(card));
    }

    // Push single undo record
    _state.undoStack.push({
      type: 'deal',
      cards: dealtCards,
      prevScore: prevScore
    });

    _state.dealsRemaining--;
    _state.moves++;
    _state.score--;

    // Check all 10 columns for completed sequences after dealing
    for (var col = 0; col < 10; col++) {
      checkForCompletedSequence(col);
    }

    return { success: true, cards: dealtCards };
  }

  /**
   * 5. undo() — Reverse last action
   */
  function undo() {
    if (!_state || _state.undoStack.length === 0) {
      return { success: false, type: null };
    }

    var action = _state.undoStack.pop();

    if (action.type === 'sequence') {
      // Undo a completed sequence: restore 13 cards to column
      // Un-flip the card that was flipped when sequence was removed
      if (action.flipped) {
        var col = _state.tableau[action.col];
        if (col.length > 0) {
          col[col.length - 1].faceUp = false;
        }
      }

      // Insert cards back at the original position
      var cards = action.cards;
      for (var i = 0; i < cards.length; i++) {
        _state.tableau[action.col].splice(action.cardIndex + i, 0, {
          rank: cards[i].rank,
          suit: cards[i].suit,
          faceUp: true
        });
      }

      // Remove from foundations
      _state.foundations.pop();

      // Restore score
      _state.score = action.prevScore;

    } else if (action.type === 'deal') {
      // Undo a deal: remove last card from each column, push back to stock
      for (var c = 9; c >= 0; c--) {
        var removed = _state.tableau[c].pop();
        removed.faceUp = false;
        _state.stock.push(removed);
      }

      _state.dealsRemaining++;
      _state.moves--;
      _state.score = action.prevScore;

    } else if (action.type === 'move') {
      // Un-flip the source top card if it was flipped
      if (action.flipped) {
        var srcCol = _state.tableau[action.fromCol];
        if (srcCol.length > 0) {
          srcCol[srcCol.length - 1].faceUp = false;
        }
      }

      // Remove moved cards from destination
      var destCol = _state.tableau[action.toCol];
      destCol.splice(destCol.length - action.cards.length, action.cards.length);

      // Restore cards to source at original position
      for (var j = 0; j < action.cards.length; j++) {
        _state.tableau[action.fromCol].splice(action.fromCardIndex + j, 0, {
          rank: action.cards[j].rank,
          suit: action.cards[j].suit,
          faceUp: true
        });
      }

      _state.moves--;
      _state.score = action.prevScore;
    }

    return { success: true, type: action.type };
  }

  /**
   * 6. isWon() — Return true when all 8 sequences completed
   */
  function isWon() {
    if (!_state) return false;
    return _state.foundations.length === 8;
  }

  /**
   * 7. canDeal() — Can we deal from stock?
   */
  function canDeal() {
    if (!_state) return false;
    if (_state.stock.length === 0) return false;

    // All columns must have at least 1 card
    for (var c = 0; c < 10; c++) {
      if (_state.tableau[c].length === 0) return false;
    }

    return true;
  }

  /**
   * 8. isMovableSequence(colIndex, fromCardIndex) — Check if cards form a descending sequence
   */
  function isMovableSequence(colIndex, fromCardIndex) {
    if (!_state) return false;
    var col = _state.tableau[colIndex];
    if (fromCardIndex < 0 || fromCardIndex >= col.length) return false;

    for (var i = fromCardIndex; i < col.length; i++) {
      if (!col[i].faceUp) return false;
      if (i > fromCardIndex) {
        if (rankValue(col[i].rank) !== rankValue(col[i - 1].rank) - 1) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 9. getValidMoves(col, cardIndex) — Return array of valid destination column indices
   */
  function getValidMoves(col, cardIndex) {
    if (!_state) return [];
    var srcCol = _state.tableau[col];
    if (cardIndex < 0 || cardIndex >= srcCol.length) return [];
    if (!isMovableSequence(col, cardIndex)) return [];

    var movingCard = srcCol[cardIndex];
    var moves = [];

    for (var d = 0; d < 10; d++) {
      if (d === col) continue;
      var destCol = _state.tableau[d];
      if (destCol.length === 0) {
        moves.push(d);
      } else {
        var topCard = destCol[destCol.length - 1];
        if (rankValue(topCard.rank) === rankValue(movingCard.rank) + 1) {
          moves.push(d);
        }
      }
    }

    return moves;
  }

  // ── Public interface ──────────────────────────────────────

  return {
    newGame: newGame,
    getState: getState,
    moveCards: moveCards,
    dealFromStock: dealFromStock,
    undo: undo,
    isWon: isWon,
    canDeal: canDeal,
    isMovableSequence: isMovableSequence,
    getValidMoves: getValidMoves,
    SUITS: SUITS,
    RANKS: RANKS
  };

})();
