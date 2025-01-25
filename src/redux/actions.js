export const SET_HIGHLIGHTED_VERSES = 'SET_HIGHLIGHTED_VERSES';

export const setHighlightedVerses = (highlightedVerses) => ({
    type: SET_HIGHLIGHTED_VERSES,
    payload: highlightedVerses,
});

export const REMOVE_HIGHLIGHT = 'REMOVE_HIGHLIGHT';

export const removeHighlight = (verseKey) => ({
    type: REMOVE_HIGHLIGHT,
    payload: verseKey,
});

export const SET_CHURCH_AND_DISTRICT = 'SET_CHURCH_AND_DISTRICT';

export const setChurchAndDistrict = (church, district) => ({
    type: SET_CHURCH_AND_DISTRICT,
    payload: { church, district },
});

