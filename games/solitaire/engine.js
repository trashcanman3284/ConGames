/**
 * Solitaire Engine — Klondike rules, pure logic, zero DOM
 * Used by: games/solitaire/ui.js
 */
var SolitaireEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  var SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
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

  function isRed(suit) {
    return suit === 'hearts' || suit === 'diamonds';
  }

  function isOppositeColour(suit1, suit2) {
    return isRed(suit1) !== isRed(suit2);
  }

  function cloneCard(card) {
    return { rank: card.rank, suit: card.suit, faceUp: card.faceUp };
  }

  function createDeck() {
    var deck = [];
    for (var s = 0; s < SUITS.length; s++) {
      for (var r = 0; r < RANKS.length; r++) {
        deck.push({ rank: RANKS[r], suit: SUITS[s], faceUp: false });
      }
    }
    return deck;
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
      stock: state.stock.map(cloneCard),
      waste: state.waste.map(cloneCard),
      foundations: state.foundations.map(function(f) { return f.map(cloneCard); }),
      tableau: state.tableau.map(function(col) { return col.map(cloneCard); }),
      undoStack: [], // Don't expose undo stack in copies
      moves: state.moves,
      drawMode: state.drawMode,
      score: state.score
    };
  }

  // ── Public API ────────────────────────────────────────────

  /**
   * 1. newGame(drawMode) — Deal a new Klondike game
   */
  function newGame(drawMode) {
    drawMode = drawMode || 1;

    var deck = shuffle(createDeck());

    var tableau = [];
    var idx = 0;
    for (var col = 0; col < 7; col++) {
      var column = [];
      for (var row = 0; row <= col; row++) {
        var card = deck[idx++];
        card.faceUp = (row === col); // Only top card face-up
        column.push(card);
      }
      tableau.push(column);
    }

    // Remaining cards go to stock (24 cards)
    var stock = [];
    for (var i = idx; i < deck.length; i++) {
      deck[i].faceUp = false;
      stock.push(deck[i]);
    }

    _state = {
      stock: stock,
      waste: [],
      foundations: [[], [], [], []],
      tableau: tableau,
      undoStack: [],
      moves: 0,
      drawMode: drawMode,
      score: 0
    };

    return cloneState(_state);
  }

  /**
   * 2. getState() — Return current state copy
   */
  function getState() {
    if (!_state) return null;
    return cloneState(_state);
  }

  /**
   * 3. drawFromStock() — Flip drawMode cards from stock to waste
   */
  function drawFromStock() {
    if (!_state || _state.stock.length === 0) {
      return { success: false, cards: [] };
    }

    var count = Math.min(_state.drawMode, _state.stock.length);
    var moved = [];

    for (var i = 0; i < count; i++) {
      var card = _state.stock.pop();
      card.faceUp = true;
      _state.waste.push(card);
      moved.push(cloneCard(card));
    }

    _state.undoStack.push({ type: 'draw', cards: moved, count: count });
    _state.moves++;

    return { success: true, cards: moved };
  }

  /**
   * 4. recycleWaste() — Reverse waste back to stock
   */
  function recycleWaste() {
    if (!_state || _state.waste.length === 0 || _state.stock.length > 0) {
      return { success: false };
    }

    var originalWaste = _state.waste.map(cloneCard);

    // Reverse waste into stock, all face-down
    while (_state.waste.length > 0) {
      var card = _state.waste.pop();
      card.faceUp = false;
      _state.stock.push(card);
    }

    _state.undoStack.push({ type: 'recycle', cards: originalWaste });
    // Do NOT increment moves for recycle

    return { success: true };
  }

  /**
   * 5. canMoveToTableau(card, colIndex) — Validate tableau placement
   */
  function canMoveToTableau(card, colIndex) {
    if (!_state) return false;
    var col = _state.tableau[colIndex];

    if (col.length === 0) {
      // Empty column accepts only Kings
      return rankValue(card.rank) === 13;
    }

    var topCard = col[col.length - 1];
    return isOppositeColour(card.suit, topCard.suit) &&
           rankValue(card.rank) === rankValue(topCard.rank) - 1;
  }

  /**
   * 6. canMoveToFoundation(card, foundIndex) — Validate foundation placement
   */
  function canMoveToFoundation(card, foundIndex) {
    if (!_state) return false;
    var found = _state.foundations[foundIndex];

    if (found.length === 0) {
      // Empty foundation accepts only Aces
      return rankValue(card.rank) === 1;
    }

    var topCard = found[found.length - 1];
    return card.suit === topCard.suit &&
           rankValue(card.rank) === rankValue(topCard.rank) + 1;
  }

  /**
   * 7. moveCards(from, to) — Execute a validated move
   */
  function moveCards(from, to) {
    if (!_state) return { success: false };

    var sourceCards = [];
    var flipped = false;
    var prevScore = _state.score;

    // Get source cards
    if (from.zone === 'waste') {
      if (_state.waste.length === 0) return { success: false };
      var card = _state.waste[_state.waste.length - 1];
      sourceCards = [card];
    } else if (from.zone === 'tableau') {
      var col = _state.tableau[from.col];
      if (from.cardIndex === undefined) from.cardIndex = col.length - 1;
      if (from.cardIndex < 0 || from.cardIndex >= col.length) return { success: false };

      // Validate that all cards from cardIndex to end form valid sequence
      for (var i = from.cardIndex; i < col.length; i++) {
        if (!col[i].faceUp) return { success: false };
        if (i > from.cardIndex) {
          // Must be descending alternating colour
          if (!isOppositeColour(col[i].suit, col[i - 1].suit) ||
              rankValue(col[i].rank) !== rankValue(col[i - 1].rank) - 1) {
            return { success: false };
          }
        }
        sourceCards.push(col[i]);
      }
    } else if (from.zone === 'foundation') {
      var found = _state.foundations[from.col];
      if (found.length === 0) return { success: false };
      sourceCards = [found[found.length - 1]];
    } else {
      return { success: false };
    }

    if (sourceCards.length === 0) return { success: false };

    // Validate destination
    var topCard = sourceCards[0]; // The card being placed
    if (to.zone === 'tableau') {
      if (!canMoveToTableau(topCard, to.col)) return { success: false };
    } else if (to.zone === 'foundation') {
      if (sourceCards.length > 1) return { success: false }; // Only single cards to foundation
      if (!canMoveToFoundation(topCard, to.col)) return { success: false };
    } else {
      return { success: false };
    }

    // Execute the move — remove from source
    var movedCards = sourceCards.map(cloneCard);

    if (from.zone === 'waste') {
      _state.waste.pop();
    } else if (from.zone === 'tableau') {
      _state.tableau[from.col].splice(from.cardIndex, sourceCards.length);
      // Flip new top card if face-down
      var srcCol = _state.tableau[from.col];
      if (srcCol.length > 0 && !srcCol[srcCol.length - 1].faceUp) {
        srcCol[srcCol.length - 1].faceUp = true;
        flipped = true;
      }
    } else if (from.zone === 'foundation') {
      _state.foundations[from.col].pop();
    }

    // Place at destination
    if (to.zone === 'tableau') {
      for (var j = 0; j < sourceCards.length; j++) {
        _state.tableau[to.col].push(sourceCards[j]);
      }
    } else if (to.zone === 'foundation') {
      _state.foundations[to.col].push(sourceCards[0]);
    }

    // Scoring
    if (to.zone === 'foundation' && (from.zone === 'waste' || from.zone === 'tableau')) {
      _state.score += 10;
    } else if (to.zone === 'tableau' && from.zone === 'waste') {
      _state.score += 5;
    } else if (to.zone === 'tableau' && from.zone === 'foundation') {
      _state.score -= 15;
    }
    if (flipped) {
      _state.score += 5;
    }

    // Record undo
    _state.undoStack.push({
      type: 'move',
      from: { zone: from.zone, col: from.col, cardIndex: from.cardIndex },
      to: { zone: to.zone, col: to.col },
      cards: movedCards,
      flipped: flipped,
      prevScore: prevScore
    });

    _state.moves++;

    return {
      success: true,
      cards: movedCards,
      autoComplete: isAutoCompleteReady()
    };
  }

  /**
   * 8. undo() — Reverse last action
   */
  function undo() {
    if (!_state || _state.undoStack.length === 0) {
      return { success: false, action: null };
    }

    var action = _state.undoStack.pop();

    if (action.type === 'draw') {
      // Return drawn cards from waste to stock (face-down)
      for (var i = 0; i < action.count; i++) {
        if (_state.waste.length > 0) {
          var card = _state.waste.pop();
          card.faceUp = false;
          _state.stock.push(card);
        }
      }
      _state.moves--;
    } else if (action.type === 'recycle') {
      // Restore original waste, empty stock
      _state.stock = [];
      _state.waste = [];
      for (var j = 0; j < action.cards.length; j++) {
        var restoredCard = {
          rank: action.cards[j].rank,
          suit: action.cards[j].suit,
          faceUp: true
        };
        _state.waste.push(restoredCard);
      }
      // Recycle didn't increment moves, so don't decrement
    } else if (action.type === 'move') {
      // Un-flip the source top card if it was flipped
      if (action.flipped) {
        var srcCol = _state.tableau[action.from.col];
        if (srcCol.length > 0) {
          srcCol[srcCol.length - 1].faceUp = false;
        }
      }

      // Remove cards from destination
      if (action.to.zone === 'tableau') {
        var destCol = _state.tableau[action.to.col];
        destCol.splice(destCol.length - action.cards.length, action.cards.length);
      } else if (action.to.zone === 'foundation') {
        _state.foundations[action.to.col].pop();
      }

      // Return cards to source
      var cardsToReturn = [];
      for (var k = 0; k < action.cards.length; k++) {
        cardsToReturn.push({
          rank: action.cards[k].rank,
          suit: action.cards[k].suit,
          faceUp: true
        });
      }

      if (action.from.zone === 'waste') {
        _state.waste.push(cardsToReturn[0]);
      } else if (action.from.zone === 'tableau') {
        var tblCol = _state.tableau[action.from.col];
        for (var m = 0; m < cardsToReturn.length; m++) {
          tblCol.splice(action.from.cardIndex + m, 0, cardsToReturn[m]);
        }
      } else if (action.from.zone === 'foundation') {
        _state.foundations[action.from.col].push(cardsToReturn[0]);
      }

      // Restore score
      _state.score = action.prevScore;
      _state.moves--;
    }

    return { success: true, action: action };
  }

  /**
   * 9. isAutoCompleteReady() — All tableau face-up, stock and waste empty
   */
  function isAutoCompleteReady() {
    if (!_state) return false;

    // Stock and waste must be empty
    if (_state.stock.length > 0 || _state.waste.length > 0) return false;

    // All tableau cards must be face-up (or column empty)
    for (var c = 0; c < _state.tableau.length; c++) {
      var col = _state.tableau[c];
      for (var i = 0; i < col.length; i++) {
        if (!col[i].faceUp) return false;
      }
    }

    return true;
  }

  /**
   * 10. autoCompleteStep() — Move one card to foundation automatically
   */
  function autoCompleteStep() {
    if (!_state) return null;

    // Check waste first
    if (_state.waste.length > 0) {
      var wasteCard = _state.waste[_state.waste.length - 1];
      for (var f = 0; f < 4; f++) {
        if (canMoveToFoundation(wasteCard, f)) {
          var result = moveCards(
            { zone: 'waste' },
            { zone: 'foundation', col: f }
          );
          if (result.success) {
            return { card: cloneCard(wasteCard), foundIndex: f };
          }
        }
      }
    }

    // Then tableau left-to-right, find lowest-rank face-up card that fits
    var bestRank = 14;
    var bestMove = null;

    for (var c = 0; c < _state.tableau.length; c++) {
      var col = _state.tableau[c];
      if (col.length === 0) continue;

      var card = col[col.length - 1];
      if (!card.faceUp) continue;

      var rv = rankValue(card.rank);
      if (rv < bestRank) {
        for (var fi = 0; fi < 4; fi++) {
          if (canMoveToFoundation(card, fi)) {
            bestRank = rv;
            bestMove = { colIndex: c, foundIndex: fi, card: cloneCard(card) };
            break;
          }
        }
      }
    }

    if (bestMove) {
      var col = _state.tableau[bestMove.colIndex];
      var result = moveCards(
        { zone: 'tableau', col: bestMove.colIndex, cardIndex: col.length - 1 },
        { zone: 'foundation', col: bestMove.foundIndex }
      );
      if (result.success) {
        return { card: bestMove.card, foundIndex: bestMove.foundIndex };
      }
    }

    return null;
  }

  /**
   * 11. isWon() — All 4 foundations have 13 cards
   */
  function isWon() {
    if (!_state) return false;
    for (var f = 0; f < 4; f++) {
      if (_state.foundations[f].length !== 13) return false;
    }
    return true;
  }

  /**
   * 12. getValidMoves(from) — Return array of valid destinations
   */
  function getValidMoves(from) {
    if (!_state) return [];

    var sourceCards = [];

    if (from.zone === 'waste') {
      if (_state.waste.length === 0) return [];
      sourceCards = [_state.waste[_state.waste.length - 1]];
    } else if (from.zone === 'tableau') {
      var col = _state.tableau[from.col];
      var ci = from.cardIndex !== undefined ? from.cardIndex : col.length - 1;
      if (ci < 0 || ci >= col.length || !col[ci].faceUp) return [];

      // Validate sequence from cardIndex onward
      for (var i = ci; i < col.length; i++) {
        if (!col[i].faceUp) return [];
        if (i > ci) {
          if (!isOppositeColour(col[i].suit, col[i - 1].suit) ||
              rankValue(col[i].rank) !== rankValue(col[i - 1].rank) - 1) {
            return [];
          }
        }
        sourceCards.push(col[i]);
      }
    } else if (from.zone === 'foundation') {
      var found = _state.foundations[from.col];
      if (found.length === 0) return [];
      sourceCards = [found[found.length - 1]];
    } else {
      return [];
    }

    if (sourceCards.length === 0) return [];

    var topCard = sourceCards[0];
    var moves = [];

    // Check tableau destinations
    for (var t = 0; t < 7; t++) {
      if (from.zone === 'tableau' && t === from.col) continue;
      if (canMoveToTableau(topCard, t)) {
        moves.push({ zone: 'tableau', col: t });
      }
    }

    // Check foundation destinations (only single cards)
    if (sourceCards.length === 1) {
      for (var f = 0; f < 4; f++) {
        if (from.zone === 'foundation' && f === from.col) continue;
        if (canMoveToFoundation(topCard, f)) {
          moves.push({ zone: 'foundation', col: f });
        }
      }
    }

    return moves;
  }

  /**
   * 13. canAutoMoveToFoundation(card) — Safe to auto-move?
   */
  function canAutoMoveToFoundation(card) {
    if (!_state) return false;

    var rv = rankValue(card.rank);

    // Aces and 2s are always safe
    if (rv <= 2) return true;

    // Safe if both opposite-colour cards of rank-1 are already on foundations
    var neededRank = rv - 1;
    var oppositeOnFoundation = 0;

    for (var f = 0; f < 4; f++) {
      var found = _state.foundations[f];
      if (found.length === 0) continue;
      var topCard = found[found.length - 1];
      if (isOppositeColour(topCard.suit, card.suit) && rankValue(topCard.rank) >= neededRank) {
        oppositeOnFoundation++;
      }
    }

    return oppositeOnFoundation >= 2;
  }

  // ── Public interface ──────────────────────────────────────

  return {
    newGame: newGame,
    getState: getState,
    drawFromStock: drawFromStock,
    recycleWaste: recycleWaste,
    canMoveToTableau: canMoveToTableau,
    canMoveToFoundation: canMoveToFoundation,
    moveCards: moveCards,
    undo: undo,
    isAutoCompleteReady: isAutoCompleteReady,
    autoCompleteStep: autoCompleteStep,
    isWon: isWon,
    getValidMoves: getValidMoves,
    canAutoMoveToFoundation: canAutoMoveToFoundation,
    SUITS: SUITS,
    RANKS: RANKS
  };

})();
