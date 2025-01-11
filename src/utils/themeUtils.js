import * as NavigationBar from 'expo-navigation-bar';

export const configureNavigationBar = async (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    await NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
    await NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
};
