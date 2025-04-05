import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { configureNavigationBar } from "../../utils/themeUtils";

const initialState = {
  theme: "Light theme",
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      AsyncStorage.setItem("theme", action.payload);
      configureNavigationBar(action.payload);
    },
    loadTheme: (state, action) => {
      state.theme = action.payload || "Light theme";
      configureNavigationBar(action.payload || "Light Theme");
    },
  },
});

export const { setTheme, loadTheme } = themeSlice.actions;
export default themeSlice.reducer;
