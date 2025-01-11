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
            //console.log('logIn action payload:', action.payload);
            state.isLoggedIn = true;
            state.user = action.payload.user;
            state.session = action.payload.session;
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
            state.selectedDistrict = action.payload.select_district;
        },
    },
});

export const { logIn, logOut, selectChurch, selectDistrict } = userSlice.actions;
export default userSlice.reducer;
