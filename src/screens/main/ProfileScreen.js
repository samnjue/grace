import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Linking, ScrollView, BackHandler, StatusBar, Image, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { supabase } from '../../utils/supabase';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logOut } from '../../redux/slices/userSlice';
import { useSelector } from 'react-redux';
import { setTheme } from '../../redux/slices/themeSlice';
import * as NavigationBar from 'expo-navigation-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const [userUID, setUserUID] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [profileImage, setProfileImage] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isThemeModalVisible, setThemeModalVisible] = useState(false);
    const [isLogOutModalVisible, setIsLogOutModalVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('');
    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');

    const fetchUserData = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                Alert.alert('Error', 'Unable to fetch user data');
                return;
            }

            setUserUID(user.id);

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('display_name, profile_image_url')
                .eq('id', user.id)
                .single();

            if (userError) {
                Alert.alert('Error', 'Unable to fetch profile data');
                return;
            }

            setDisplayName(userData.display_name || '');
            setProfileImage(userData.profile_image_url || '');

            await AsyncStorage.setItem('displayName', userData.display_name || '');
            await AsyncStorage.setItem('profileImage', userData.profile_image_url || '');
        } catch (err) {
            Alert.alert('Error', 'Something went wrong');
        }
    };

    const loadOfflineData = async () => {
        try {
            const offlineDisplayName = await AsyncStorage.getItem('displayName');
            const offlineProfileImage = await AsyncStorage.getItem('profileImage');

            if (offlineDisplayName) setDisplayName(offlineDisplayName);
            if (offlineProfileImage) setProfileImage(offlineProfileImage);
        } catch (err) {
            console.error('Failed to load offline data:', err);
        }
    };

    useEffect(() => {
        const initializeProfile = async () => {
            const hasSession = await checkAuthSession();
            if (!hasSession) return;

            await loadOfflineData();
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                if (error || !user) {
                    console.error('User fetch error:', error);
                    return;
                }
                await fetchUserData();
            } catch (err) {
                console.error('Initialization error:', err);
            }
        };

        initializeProfile();
    }, []);

    const getBlobFromUri = async (uri) => {
        const response = await fetch(uri);
        if (!response.ok) throw new Error('Failed to fetch image URI');
        return await response.blob();
    };

    const resizeImage = async (uri) => {
        const manipResult = await manipulateAsync(
            uri,
            [{ resize: { width: 500, height: 500 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        return manipResult.uri;
    };

    const handleProfileImageChange = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            console.log('Image URI:', imageUri);

            try {
                const resizedUri = await resizeImage(imageUri);
                const blob = await getBlobFromUri(resizedUri);
                console.log('Blob created successfully');

                const fileName = `${userUID}-${Date.now()}.jpg`;

                const { data, error } = await supabase.storage
                    .from('profile_images')
                    .upload(fileName, blob, { contentType: 'image/jpeg' });

                if (error) {
                    console.error('Supabase upload error:', error.message);
                    Alert.alert('Error', 'Failed to upload image');
                    return;
                }

                const { publicUrl } = supabase.storage
                    .from('profile_images')
                    .getPublicUrl(fileName).data;

                const { error: updateError } = await supabase
                    .from('users')
                    .update({ profile_image_url: publicUrl })
                    .eq('id', userUID);

                if (updateError) {
                    console.error('Database update error:', updateError.message);
                    Alert.alert('Error', 'Failed to update profile image');
                    return;
                }

                setProfileImage(publicUrl);
                await AsyncStorage.setItem('profileImage', publicUrl);
                Alert.alert('Success', 'Profile image updated');
            } catch (err) {
                console.error('Image upload error:', err);
                Alert.alert('Error', 'Something went wrong while uploading the image');
            }
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };

    const handleLogOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw new Error(error.message);

            dispatch(logOut());
            navigation.replace('AuthStack');
        } catch (err) {
            setErrorMessage('Failed to log out. Please try again.');
        }
    };

    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => false);
        return () => backHandler.remove();
    }, []);

    const openPlayStore = () => {
        Linking.openURL('https://play.google.com/store');
    };

    const showThemeSelector = () => {
        setThemeModalVisible(true);
    };

    const handleThemeChange = async (theme) => {
        try {
            setSelectedTheme(theme);
            await AsyncStorage.setItem('selectedTheme', theme);
            dispatch(setTheme(theme));
            setThemeModalVisible(false);
        } catch (err) {
            console.error('Failed to save theme:', err);
        }
    };

    useEffect(() => {
        const loadSavedTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('selectedTheme');
                if (savedTheme) {
                    dispatch(setTheme(savedTheme));
                }
            } catch (err) {
                console.error('Failed to load theme from AsyncStorage:', err);
            }
        };
        loadSavedTheme();
    }, [dispatch]);

    const styles = getStyle(theme);

    useEffect(() => {
        const loadSavedTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('selectedTheme');
                if (savedTheme) {
                    dispatch(setTheme(savedTheme));
                    setSelectedTheme(savedTheme);
                }
            } catch (err) {
                console.error('Failed to load theme from AsyncStorage:', err);
            }
        };
        loadSavedTheme();
    }, [dispatch]);

    useEffect(() => {
        NavigationBar.setBackgroundColorAsync(isDarkTheme ? '#121212' : '#fff');
        NavigationBar.setButtonStyleAsync(isDarkTheme ? 'dark' : 'light');
    }, [isDarkTheme]);


    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            />
            <Header title="Profile" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Profile Section */}
                {/* <View style={styles.profileSection}>
                    <Ionicons name="person-circle" size={70} color="gray" />
                    <View style={styles.uidContainer}>
                        <Text style={styles.uidText} maxFontSizeMultiplier={0}>
                            {errorMessage || (displayName ? displayName : `#${userUID}`)}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditScreen')}
                        >
                            <Ionicons name="create-outline" size={25} color={isDarkTheme ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>
                </View> */}
                <View style={styles.profileSection}>
                    <TouchableOpacity onPress={handleProfileImageChange}>
                        {profileImage ? (
                            <Image
                                source={{ uri: profileImage }}
                                style={{ width: 100, height: 100, borderRadius: 50 }}
                            />
                        ) : (
                            <Ionicons name="person-circle" size={70} color="gray" />
                        )}
                    </TouchableOpacity>

                    <View style={styles.uidContainer}>
                        <Text style={styles.uidText} maxFontSizeMultiplier={0}>
                            {errorMessage || (displayName ? displayName : `#${userUID}`)}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditScreen')}
                        >
                            <Ionicons name="create-outline" size={25} color={isDarkTheme ? '#fff' : '#000'} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
                        SETTINGS
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ShareScreen')}
                    >
                        <Ionicons name="link-outline" size={30} color={isDarkTheme ? '#fff' : '#333'} />
                        <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
                            Share App Link
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={showThemeSelector}>
                        <Ionicons name="bulb-outline" size={30} color={isDarkTheme ? '#fff' : '#333'} />
                        <Text style={styles.buttonText}>Appearance</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.logOutButton}
                        onPress={() => setIsLogOutModalVisible(true)}
                    >
                        <Ionicons name="exit-outline" size={25} color="white" />
                        <Text style={styles.logOutText} maxFontSizeMultiplier={0}>
                            LOG OUT
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Log Out Modal */}
                <Modal
                    visible={isLogOutModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsLogOutModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Are you sure you want to log out?
                            </Text>
                            <View style={styles.modalButtons}>
                                <View style={styles.modalButtonContainer}>
                                    <TouchableOpacity
                                        style={styles.yesButton}
                                        onPress={handleLogOut}
                                    >
                                        <Text style={styles.yesButtonText}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={() => setIsLogOutModalVisible(false)}
                                    >
                                        <Text style={styles.cancelButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Theme Selector Modal */}
                <Modal
                    visible={isThemeModalVisible}
                    transparent={true}
                    animationType="none"
                    onRequestClose={() => setThemeModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <Text style={styles.themeModalTitle} maxFontSizeMultiplier={0}>
                                Appearance
                            </Text>
                            {['Light Theme', 'Dark Theme'].map((theme) => (
                                <TouchableOpacity
                                    key={theme}
                                    style={styles.modalOption}
                                    onPress={() => handleThemeChange(theme)}
                                >
                                    <Ionicons
                                        name={
                                            selectedTheme === theme
                                                ? 'radio-button-on'
                                                : 'radio-button-off'
                                        }
                                        size={20}
                                        color="#6a5acd"
                                    />
                                    <Text
                                        style={styles.themeModalOptionText}
                                        maxFontSizeMultiplier={0}
                                    >
                                        {theme}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <View style={styles.modalButtons}>
                                <Pressable
                                    style={styles.modalButton}
                                    onPress={() => setThemeModalVisible(false)}
                                >
                                    <Text style={styles.modalButtonText} maxFontSizeMultiplier={0}>
                                        Cancel
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </Modal>


                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
                        SUPPORT
                    </Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('ContactScreen')}
                    >
                        <Ionicons name="chatbubbles-outline" size={30} color={isDarkTheme ? '#fff' : '#333'} />
                        <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
                            Contact Us
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle} maxFontSizeMultiplier={0}>
                        ABOUT
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={openPlayStore}>
                        <Ionicons name="star-outline" size={30} color={isDarkTheme ? '#fff' : '#333'} />
                        <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
                            Rate the App!
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.versionText} maxFontSizeMultiplier={0}>
                        Version 1.13.3
                    </Text>
                    <Text style={styles.versionText} maxFontSizeMultiplier={0}>
                        © 2025 ivory
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const getStyle = (theme) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');
    return {
        container: {
            flex: 1,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
        },
        profileSection: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 20
        },
        uidContainer: {
            flex: 1,
            flexWrap: 'wrap',
            flexDirection: 'row',
            alignItems: 'center',
            marginLeft: 10
        },
        uidText: {
            fontSize: 17,
            fontWeight: 'bold',
            color: isDarkTheme ? '#f5f5f5' : '#333',
            marginRight: 10,
            flexShrink: 1
        },
        section: {
            padding: 20,
            paddingBottom: -8
        },
        sectionTitle: {
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#FFF' : '#333',
            marginBottom: 10,
            left: 4
        },
        button: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 15,
            marginBottom: 15
        },
        buttonText: {
            marginLeft: 10,
            fontSize: 17,
            fontFamily: 'Inter',
            color: isDarkTheme ? '#FFF' : '#333',
        },
        logOutButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'red',
            padding: 10,
            borderRadius: 25,
            marginTop: 10,
        },
        logOutText: {
            color: 'white',
            fontWeight: 'bold',
            marginLeft: 10,
            fontSize: 14,
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        modalContent: {
            width: '80%',
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#fff',
            borderRadius: 20,
            padding: 20,
            alignItems: 'center',
        },
        modalTitle: {
            fontSize: 20,
            fontFamily: 'Inter_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
            textAlign: 'center',
            marginBottom: 10,
            marginTop: 10,
        },
        themeModalTitle: {
            fontSize: 20,
            fontFamily: 'Inter_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
            right: 75,
            bottom: 20,
            marginBottom: 0,
            marginTop: 10,
        },
        themeModalOptionText: {
            fontSize: 16,
            fontFamily: 'Inter_500Medium',
            color: isDarkTheme ? '#fff' : '#333',
            paddingLeft: 10
        },
        modalButtonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
        },
        modalOption: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            width: '100%',
            marginBottom: 10,
            marginLeft: 10,
        },
        modalOptionText: {
            fontSize: 16,
            marginLeft: 10,
            fontFamily: 'Inter'
        },
        modalButtons: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            marginTop: 20
        },
        yesButton: {
            flex: 1,
            backgroundColor: 'red',
            borderRadius: 25,
            paddingVertical: 12,
            alignItems: 'center',
            marginLeft: 10,
        },
        yesButtonText: {
            fontFamily: 'Inter_700Bold',
            color: '#fff',
            fontSize: 16,
        },
        cancelButton: {
            flex: 1,
            backgroundColor: '#fff',
            backgroundColor: isDarkTheme ? '#2c2c2c' : '#fff',
            borderRadius: 25,
            paddingVertical: 12,
            alignItems: 'center',
            marginRight: 10,
        },
        cancelButtonText: {
            fontFamily: 'Inter_700Bold',
            color: isDarkTheme ? '#fff' : '#000',
            fontSize: 16,
        },
        modalButtonText: {
            fontSize: 18,
            color: '#6a5acd',
            fontFamily: 'Inter_700Bold'
        },
        versionText: {
            fontSize: 12,
            color: 'gray',
            marginTop: 10,
            left: 15
        },
        scrollContent: {
            paddingBottom: 60,
        }
    }
};

export default ProfileScreen;
