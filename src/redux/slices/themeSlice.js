import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const initialState = {
    theme: 'System Default',
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            console.log('Theme updated to:', action.payload); // Debug
            state.theme = action.payload;
            AsyncStorage.setItem('theme', action.payload);
        },
        loadTheme: (state, action) => {
            state.theme = action.payload || 'System Default';
        },
    },
});

export const { setTheme, loadTheme } = themeSlice.actions;

export const initializeTheme = () => (dispatch) => {
    const systemTheme = Appearance.getColorScheme();
    const initialTheme = systemTheme || 'light';
    dispatch(setTheme('System Default'));
    if (initialTheme) {
        dispatch(setTheme(systemTheme));
    }
};

export default themeSlice.reducer;
