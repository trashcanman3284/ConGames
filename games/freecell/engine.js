/**
 * FreeCell Engine — pure logic, zero DOM
 * Used by: games/freecell/ui.js
 */
var FreeCellEngine = (function() {
  'use strict';

  // ── Constants ──────────────────────────────────────────────

  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUITS = ['clubs', 'diamonds', 'hearts', 'spades'];
  var RED_SUITS = ['hearts', 'diamonds'];
  var BLACK_SUITS = ['clubs', 'spades'];

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

  function cloneCards(cards) {
    var result = [];
    for (var i = 0; i < cards.length; i++) {
      result.push(cloneCard(cards[i]));
    }
    return result;
  }

  function createDeck() {
    var deck = [];
    for (var s = 0; s < SUITS.length; s++) {
      for (var r = 0; r < RANKS.length; r++) {
        deck.push({ rank: RANKS[r], suit: SUITS[s], faceUp: true });
      }
    }
    return deck;
  }

  // ── Seeded PRNG (LCG) ────────────────────────────────────

  function seededShuffle(deck, seed) {
    var s = seed;
    function nextRand() {
      s = (s * 214013 + 2531011) & 0x7FFFFFFF;
      return (s >> 16) & 0x7FFF;
    }
    for (var i = deck.length - 1; i > 0; i--) {
      var j = nextRand() % (i + 1);
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  // ── State cloning ────────────────────────────────────────

  function cloneState() {
    var s = {
      freecells: [],
      foundations: [],
      tableau: [],
      undoStack: [],
      moves: _state.moves,
      dealNumber: _state.dealNumber
    };
    for (var i = 0; i < 4; i++) {
      s.freecells.push(_state.freecells[i] ? cloneCard(_state.freecells[i]) : null);
    }
    for (var i = 0; i < 4; i++) {
      s.foundations.push(cloneCards(_state.foundations[i]));
    }
    for (var i = 0; i < 8; i++) {
      s.tableau.push(cloneCards(_state.tableau[i]));
    }
    return s;
  }

  // ── Foundation helpers ────────────────────────────────────

  function findFoundationForCard(card) {
    var rv = rankValue(card.rank);
    if (rv === 1) {
      // Ace: find first empty foundation
      for (var i = 0; i < 4; i++) {
        if (_state.foundations[i].length === 0) return i;
      }
      return -1;
    }
    // Non-ace: find foundation with same suit and top card one rank lower
    for (var i = 0; i < 4; i++) {
      var pile = _state.foundations[i];
      if (pile.length > 0 && pile[pile.length - 1].suit === card.suit &&
          rankValue(pile[pile.length - 1].rank) === rv - 1) {
        return i;
      }
    }
    return -1;
  }

  function canMoveToFoundation(card) {
    return findFoundationForCard(card) !== -1;
  }

  // ── Max movable calculation ───────────────────────────────

  function getMaxMovable(fromColIndex, toColIndex) {
    var emptyFreeCells = 0;
    for (var i = 0; i < 4; i++) {
      if (_state.freecells[i] === null) emptyFreeCells++;
    }

    var emptyColumns = 0;
    for (var i = 0; i < 8; i++) {
      if (i === fromColIndex) continue; // exclude source
      if (i === toColIndex) continue;   // exclude destination
      if (_state.tableau[i].length === 0) emptyColumns++;
    }

    // Formula: (emptyFreeCells + 1) x 2^emptyColumns
    return (emptyFreeCells + 1) * Math.pow(2, emptyColumns);
  }

  // ── Sequence validation ───────────────────────────────────

  function isValidSequence(cards) {
    for (var i = 0; i < cards.length - 1; i++) {
      if (!isOppositeColour(cards[i].suit, cards[i + 1].suit)) return false;
      if (rankValue(cards[i].rank) !== rankValue(cards[i + 1].rank) + 1) return false;
    }
    return true;
  }

  // ── Auto-foundation ──────────────────────────────────────

  function getFoundationMinRank(suit) {
    // Find the foundation pile for this suit and return its top rank value
    for (var i = 0; i < 4; i++) {
      var pile = _state.foundations[i];
      if (pile.length > 0 && pile[0].suit === suit) {
        return rankValue(pile[pile.length - 1].rank);
      }
    }
    return 0; // no foundation for this suit yet
  }

  function canSafeAutoMove(card) {
    var rv = rankValue(card.rank);
    // Aces: always safe
    if (rv === 1) return true;
    // 2s: always safe
    if (rv === 2) return true;
    // Higher cards: safe only when BOTH opposite-colour cards of rank-1 are on foundations
    var oppSuits = isRed(card.suit) ? BLACK_SUITS : RED_SUITS;
    for (var i = 0; i < oppSuits.length; i++) {
      var oppMin = getFoundationMinRank(oppSuits[i]);
      if (oppMin < rv - 1) return false;
    }
    return true;
  }

  function autoFoundation(groupId) {
    var count = 0;
    var moved = true;
    while (moved) {
      moved = false;

      // Check all freecells
      for (var i = 0; i < 4; i++) {
        var card = _state.freecells[i];
        if (card && canSafeAutoMove(card) && canMoveToFoundation(card)) {
          var foundCol = findFoundationForCard(card);
          _state.undoStack.push({
            type: 'auto-foundation',
            groupId: groupId,
            fromZone: 'freecell',
            fromCol: i,
            card: cloneCard(card),
            foundCol: foundCol
          });
          _state.foundations[foundCol].push(card);
          _state.freecells[i] = null;
          _state.moves++;
          count++;
          moved = true;
        }
      }

      // Check all tableau bottom cards
      for (var c = 0; c < 8; c++) {
        var col = _state.tableau[c];
        if (col.length === 0) continue;
        var card = col[col.length - 1];
        if (canSafeAutoMove(card) && canMoveToFoundation(card)) {
          var foundCol = findFoundationForCard(card);
          _state.undoStack.push({
            type: 'auto-foundation',
            groupId: groupId,
            fromZone: 'tableau',
            fromCol: c,
            card: cloneCard(card),
            foundCol: foundCol
          });
          _state.foundations[foundCol].push(col.pop());
          _state.moves++;
          count++;
          moved = true;
        }
      }
    }
    return count;
  }

  // ── Move cards ────────────────────────────────────────────

  function moveCards(from, to) {
    var groupId = _state.moves;

    // ── Tableau to Tableau ──────────────────────────────────
    if (from.zone === 'tableau' && to.zone === 'tableau') {
      var srcCol = _state.tableau[from.col];
      var dstCol = _state.tableau[to.col];
      var cardIndex = from.cardIndex;

      if (cardIndex < 0 || cardIndex >= srcCol.length) {
        return { success: false, autoMoves: 0 };
      }

      // Extract cards to move
      var cardsToMove = srcCol.slice(cardIndex);

      // Validate sequence
      if (!isValidSequence(cardsToMove)) {
        return { success: false, autoMoves: 0 };
      }

      // Validate count against max movable
      if (cardsToMove.length > 1) {
        var max = getMaxMovable(from.col, to.col);
        if (cardsToMove.length > max) {
          return { success: false, autoMoves: 0 };
        }
      }

      // Validate destination
      if (dstCol.length > 0) {
        var topDst = dstCol[dstCol.length - 1];
        if (rankValue(topDst.rank) !== rankValue(cardsToMove[0].rank) + 1 ||
            !isOppositeColour(topDst.suit, cardsToMove[0].suit)) {
          return { success: false, autoMoves: 0 };
        }
      }
      // Empty column accepts any card/sequence

      // Push undo record
      _state.undoStack.push({
        type: 'move',
        groupId: groupId,
        fromZone: 'tableau',
        fromCol: from.col,
        fromCardIndex: cardIndex,
        toZone: 'tableau',
        toCol: to.col,
        cards: cloneCards(cardsToMove),
        prevMoves: _state.moves
      });

      // Execute move
      _state.tableau[from.col] = srcCol.slice(0, cardIndex);
      for (var i = 0; i < cardsToMove.length; i++) {
        dstCol.push(cardsToMove[i]);
      }
      _state.moves++;

      var autoMoves = autoFoundation(groupId);
      return { success: true, autoMoves: autoMoves };
    }

    // ── Tableau to Freecell ─────────────────────────────────
    if (from.zone === 'tableau' && to.zone === 'freecell') {
      var srcCol = _state.tableau[from.col];
      if (srcCol.length === 0) return { success: false, autoMoves: 0 };

      // Only the bottom card (last in array) can move to freecell
      if (from.cardIndex !== undefined && from.cardIndex !== srcCol.length - 1) {
        return { success: false, autoMoves: 0 };
      }

      if (_state.freecells[to.col] !== null) {
        return { success: false, autoMoves: 0 };
      }

      var card = srcCol[srcCol.length - 1];
      _state.undoStack.push({
        type: 'move',
        groupId: groupId,
        fromZone: 'tableau',
        fromCol: from.col,
        fromCardIndex: srcCol.length - 1,
        toZone: 'freecell',
        toCol: to.col,
        cards: [cloneCard(card)],
        prevMoves: _state.moves
      });

      _state.freecells[to.col] = srcCol.pop();
      _state.moves++;

      var autoMoves = autoFoundation(groupId);
      return { success: true, autoMoves: autoMoves };
    }

    // ── Freecell to Tableau ─────────────────────────────────
    if (from.zone === 'freecell' && to.zone === 'tableau') {
      var card = _state.freecells[from.col];
      if (!card) return { success: false, autoMoves: 0 };

      var dstCol = _state.tableau[to.col];
      if (dstCol.length > 0) {
        var topDst = dstCol[dstCol.length - 1];
        if (rankValue(topDst.rank) !== rankValue(card.rank) + 1 ||
            !isOppositeColour(topDst.suit, card.suit)) {
          return { success: false, autoMoves: 0 };
        }
      }
      // Empty column accepts any card

      _state.undoStack.push({
        type: 'move',
        groupId: groupId,
        fromZone: 'freecell',
        fromCol: from.col,
        fromCardIndex: 0,
        toZone: 'tableau',
        toCol: to.col,
        cards: [cloneCard(card)],
        prevMoves: _state.moves
      });

      dstCol.push(card);
      _state.freecells[from.col] = null;
      _state.moves++;

      var autoMoves = autoFoundation(groupId);
      return { success: true, autoMoves: autoMoves };
    }

    // ── Tableau to Foundation ───────────────────────────────
    if (from.zone === 'tableau' && to.zone === 'foundation') {
      var srcCol = _state.tableau[from.col];
      if (srcCol.length === 0) return { success: false, autoMoves: 0 };

      var card = srcCol[srcCol.length - 1];
      var foundCol = findFoundationForCard(card);
      if (foundCol === -1) return { success: false, autoMoves: 0 };

      _state.undoStack.push({
        type: 'move',
        groupId: groupId,
        fromZone: 'tableau',
        fromCol: from.col,
        fromCardIndex: srcCol.length - 1,
        toZone: 'foundation',
        toCol: foundCol,
        cards: [cloneCard(card)],
        prevMoves: _state.moves
      });

      _state.foundations[foundCol].push(srcCol.pop());
      _state.moves++;

      var autoMoves = autoFoundation(groupId);
      return { success: true, autoMoves: autoMoves };
    }

    // ── Freecell to Foundation ──────────────────────────────
    if (from.zone === 'freecell' && to.zone === 'foundation') {
      var card = _state.freecells[from.col];
      if (!card) return { success: false, autoMoves: 0 };

      var foundCol = findFoundationForCard(card);
      if (foundCol === -1) return { success: false, autoMoves: 0 };

      _state.undoStack.push({
        type: 'move',
        groupId: groupId,
        fromZone: 'freecell',
        fromCol: from.col,
        fromCardIndex: 0,
        toZone: 'foundation',
        toCol: foundCol,
        cards: [cloneCard(card)],
        prevMoves: _state.moves
      });

      _state.foundations[foundCol].push(card);
      _state.freecells[from.col] = null;
      _state.moves++;

      var autoMoves = autoFoundation(groupId);
      return { success: true, autoMoves: autoMoves };
    }

    return { success: false, autoMoves: 0 };
  }

  // ── Undo ──────────────────────────────────────────────────

  function undo() {
    if (_state.undoStack.length === 0) return { success: false };

    var lastRecord = _state.undoStack[_state.undoStack.length - 1];
    var groupId = lastRecord.groupId;

    // Pop all records with the same groupId (reverse order)
    while (_state.undoStack.length > 0 &&
           _state.undoStack[_state.undoStack.length - 1].groupId === groupId) {
      var record = _state.undoStack.pop();

      if (record.type === 'auto-foundation') {
        // Move card from foundation back to source
        var pile = _state.foundations[record.foundCol];
        pile.pop(); // remove from foundation

        if (record.fromZone === 'freecell') {
          _state.freecells[record.fromCol] = cloneCard(record.card);
        } else if (record.fromZone === 'tableau') {
          _state.tableau[record.fromCol].push(cloneCard(record.card));
        }
        _state.moves--;
      } else if (record.type === 'move') {
        // Reverse the move
        if (record.toZone === 'tableau') {
          var dstCol = _state.tableau[record.toCol];
          // Remove moved cards from destination
          dstCol.splice(dstCol.length - record.cards.length, record.cards.length);
        } else if (record.toZone === 'freecell') {
          _state.freecells[record.toCol] = null;
        } else if (record.toZone === 'foundation') {
          _state.foundations[record.toCol].pop();
        }

        // Restore cards to source
        if (record.fromZone === 'tableau') {
          var srcCol = _state.tableau[record.fromCol];
          for (var i = 0; i < record.cards.length; i++) {
            srcCol.push(cloneCard(record.cards[i]));
          }
        } else if (record.fromZone === 'freecell') {
          _state.freecells[record.fromCol] = cloneCard(record.cards[0]);
        }

        _state.moves--;
      }
    }

    return { success: true };
  }

  // ── Win check ─────────────────────────────────────────────

  function isWon() {
    var total = 0;
    for (var i = 0; i < 4; i++) {
      total += _state.foundations[i].length;
    }
    return total === 52;
  }

  // ── New game ──────────────────────────────────────────────

  function newGame(dealNumber) {
    if (dealNumber === undefined || dealNumber === null) {
      dealNumber = Math.floor(Math.random() * 1000000) + 1;
    }

    var deck = createDeck();
    seededShuffle(deck, dealNumber);

    _state = {
      freecells: [null, null, null, null],
      foundations: [[], [], [], []],
      tableau: [[], [], [], [], [], [], [], []],
      undoStack: [],
      moves: 0,
      dealNumber: dealNumber
    };

    // Deal left-to-right wrapping: columns 0-3 get 7 cards, columns 4-7 get 6 cards
    var cardIndex = 0;
    for (var row = 0; row < 7; row++) {
      for (var col = 0; col < 8; col++) {
        if (row === 6 && col >= 4) continue; // columns 4-7 only get 6 cards
        _state.tableau[col].push(deck[cardIndex++]);
      }
    }

    return cloneState();
  }

  // ── Public API ────────────────────────────────────────────

  return {
    newGame: newGame,

    getState: function() {
      return cloneState();
    },

    getDealNumber: function() {
      return _state ? _state.dealNumber : 0;
    },

    moveCards: moveCards,

    autoFoundation: function() {
      var groupId = _state.moves;
      return autoFoundation(groupId);
    },

    undo: undo,

    isWon: isWon,

    getMaxMovable: function(fromColIndex, toColIndex) {
      return getMaxMovable(fromColIndex, toColIndex);
    },

    canMoveToFoundation: function(card) {
      return canMoveToFoundation(card);
    },

    restart: function() {
      return newGame(_state.dealNumber);
    }
  };
})();
