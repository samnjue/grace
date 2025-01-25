import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isLoggedIn: false,
    user: null,
    selectedChurch: null,
    selectedDistrict: null,
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logIn(state, action) {
            state.isLoggedIn = true;
            state.session = action.payload;
            state.user = action.payload.user
        },
        logOut(state) {
            state.isLoggedIn = false;
            state.user = null;
            state.selectedChurch = null;
            state.selectedDistrict = null;
        },
        selectChurch(state, action) {
            state.selectedChurch = action.payload;
        },
        selectDistrict(state, action) {
            state.selectedDistrict = action.payload;
        },
    },
});

export const { logIn, logOut, selectChurch, selectDistrict } = userSlice.actions;
export default userSlice.reducer;
