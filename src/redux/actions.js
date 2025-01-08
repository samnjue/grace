export const SET_HIGHLIGHTED_VERSES = 'SET_HIGHLIGHTED_VERSES';

export const setHighlightedVerses = (highlightedVerses) => ({
    type: SET_HIGHLIGHTED_VERSES,
    payload: highlightedVerses,
});

export const REMOVE_HIGHLIGHT = 'REMOVE_HIGHLIGHT';

export const removeHighlight = (verseKey) => {
    return {
        type: REMOVE_HIGHLIGHT,
        payload: verseKey,
    };
};
