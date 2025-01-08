import { SET_HIGHLIGHTED_VERSES } from './actions';
import { REMOVE_HIGHLIGHT } from './actions';

const initialState = {
    highlightedVerses: {},
};

export const versesReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_HIGHLIGHTED_VERSES:
            return {
                ...state,
                highlightedVerses: action.payload,
            };
        default:
            return state;
    }
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case REMOVE_HIGHLIGHT:
            const { [action.payload]: _, ...rest } = state.highlightedVerses;
            return {
                ...state,
                highlightedVerses: rest,
            };
        default:
            return state;
    }
};

export default reducer;
