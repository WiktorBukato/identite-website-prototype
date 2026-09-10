'use strict';
// Pure, shared transition rules. Opening the last tab never supplies consent.
const IdentiteDemoState = Object.freeze({
  outcomes: ['waiting', 'approved', 'declined', 'expired'],
  transition(state, index, last, decision, replay = false) {
    if (!Number.isInteger(index) || index < 0 || index > last) return state;
    if (replay) return { index: 0, outcome: 'waiting' };
    if (state.outcome !== 'waiting') return { index, outcome: state.outcome };
    const outcome = index === last
      ? (this.outcomes.includes(decision) ? decision : state.index === last ? state.outcome : 'waiting')
      : 'waiting';
    return { index, outcome };
  }
});
if (typeof module !== 'undefined') module.exports = IdentiteDemoState;
