/* ============================================================
   CARD RENDERER — JS Card DOM Factory
   Used by: Solitaire, Spider Solitaire, FreeCell
   Creates card DOM elements with proper CSS classes
   ============================================================ */

const CardRenderer = (() => {
  const SUITS = {
    hearts:   '\u2665',
    diamonds: '\u2666',
    spades:   '\u2660',
    clubs:    '\u2663'
  };

  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  /**
   * Create a playing card DOM element.
   * @param {string} rank - Card rank ('A', '2'-'10', 'J', 'Q', 'K')
   * @param {string} suit - Card suit ('hearts', 'diamonds', 'spades', 'clubs')
   * @param {boolean} faceUp - Whether the card is face-up (default: true)
   * @returns {HTMLDivElement} The card element
   */
  function createCard(rank, suit, faceUp) {
    if (faceUp === undefined) faceUp = true;

    var card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-rank', rank);
    card.setAttribute('data-suit', suit);

    if (faceUp) {
      card.classList.add('face-up', 'suit-' + suit, 'rank-' + rank);

      var suitSymbol = SUITS[suit] || '';

      // Top-left corner
      var topCorner = document.createElement('span');
      topCorner.className = 'card-corner top-left';
      topCorner.innerHTML = rank + '<br><span class="suit-symbol">' + suitSymbol + '</span>';

      // Center pip
      var center = document.createElement('span');
      center.className = 'card-center';
      center.textContent = suitSymbol;

      // Bottom-right corner (rotated 180deg via CSS)
      var bottomCorner = document.createElement('span');
      bottomCorner.className = 'card-corner bottom-right';
      bottomCorner.innerHTML = rank + '<br><span class="suit-symbol">' + suitSymbol + '</span>';

      card.appendChild(topCorner);
      card.appendChild(center);
      card.appendChild(bottomCorner);
    } else {
      card.classList.add('face-down');
    }

    return card;
  }

  /**
   * Create a placeholder element for empty card slots.
   * @returns {HTMLDivElement} The placeholder element
   */
  function createPlaceholder() {
    var placeholder = document.createElement('div');
    placeholder.className = 'card-placeholder';
    return placeholder;
  }

  return {
    createCard: createCard,
    createPlaceholder: createPlaceholder,
    SUITS: SUITS,
    RANKS: RANKS
  };
})();
