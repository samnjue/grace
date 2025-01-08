import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Linking, ScrollView, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { supabase } from '../../utils/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logOut } from '../../redux/slices/userSlice';
import { useSelector } from 'react-redux';

const ProfileScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch();
    const [userUID, setUserUID] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isThemeModalVisible, setThemeModalVisible] = useState(false);
    const [isLogOutModalVisible, setIsLogOutModalVisible] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState('System Default');
    const theme = useSelector((state) => state.theme.theme);
    //const styles = getStyles(theme); -- Goes to the bottom!


    const fetchUserData = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                setErrorMessage('Unable to load user data.');
                return;
            }

            setUserUID(user.id);
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('display_name')
                .eq('id', user.id)
                .single();

            if (userError || !userData) {
                setDisplayName('');
            } else {
                setDisplayName(userData.display_name || '');
            }
        } catch (err) {
            setErrorMessage('Unable to load user data.');
        }
    };


    useEffect(() => {
        fetchUserData();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchUserData();
        }, [])
    );

    const handleLogOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw new Error(error.message);

            dispatch(logOut());
            await AsyncStorage.removeItem('userSession');
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

    const handleThemeChange = (theme) => {
        setSelectedTheme(theme);
        setThemeModalVisible(false);
        dispatch(setTheme(theme));
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
            <Header title="Profile" />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <Ionicons name="person-circle" size={70} color="gray" />
                    <View style={styles.uidContainer}>
                        <Text style={styles.uidText} maxFontSizeMultiplier={0}>
                            {errorMessage || (displayName ? displayName : `#${userUID}`)}
                        </Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('EditScreen')}
                        >
                            <Ionicons name="create-outline" size={25} />
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
                        <Ionicons name="link-outline" size={30} />
                        <Text style={styles.buttonText} maxFontSizeMultiplier={0}>
                            Share App Link
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={showThemeSelector}>
                        <Ionicons name="bulb-outline" size={30} />
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
                            {['Light Theme', 'Dark Theme', 'System Default'].map((theme) => (
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
                        <Ionicons name="chatbubbles-outline" size={30} />
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
                        <Ionicons name="star-outline" size={30} />
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
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
        color: 'gray',
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
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    themeModalTitle: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#333',
        right: 75,
        bottom: 20,
        marginBottom: 0,
        marginTop: 10,
    },
    themeModalOptionText: {
        fontSize: 16,
        fontFamily: 'Inter_500Medium',
        color: '#333',
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
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#000',
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
});

{/*
    const getStyles = (theme) => ({
        container: {
            flex: 1,
            backgroundColor: theme === 'dark' ? '#000' : '#fff',
        },
    });
*/}




export default ProfileScreen;
