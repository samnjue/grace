import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { supabase } from '../../utils/supabase';

const PostNewsScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const theme = useSelector((state) => state.theme.theme);
    const isDarkTheme = theme.toLowerCase().includes('dark');
    const styles = getStyle(theme);
    const insets = useSafeAreaInsets();

    const validateFields = () => {
        if (!title.trim()) return 'Title is required';
        if (!content.trim()) return 'Content is required';
        return null;
    };

    const handleSend = async () => {
        const error = validateFields();
        if (error) {
            setErrorMessage(error);
            setIsErrorModalVisible(true);
            return;
        }

        try {
            const storedDistrict = await AsyncStorage.getItem('selectedDistrict');
            const parsedDistrict = JSON.parse(storedDistrict);

            if (!parsedDistrict || !parsedDistrict.district_id) {
                throw new Error('Selected district not found. Please re-select your district.');
            }

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) {
                throw new Error('User not authenticated. Please log in again.');
            }

            const { error: supabaseError } = await supabase.from('districtNews').insert([
                {
                    title,
                    content,
                    district_id: parsedDistrict.district_id,
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                },
            ]);

            if (supabaseError) {
                throw new Error(supabaseError.message);
            }

            setIsSuccessModalVisible(true);
            setTitle('');
            setContent('');
        } catch (err) {
            setErrorMessage(err.message || 'Failed to post news. Please try again.');
            setIsErrorModalVisible(true);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={isDarkTheme ? '#121212' : '#fff'}
            />
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} style={{ color: isDarkTheme ? '#fff' : '#000' }} />
                </TouchableOpacity>
                <Text style={styles.headerText} maxFontSizeMultiplier={1.2}>Post</Text>
            </View>

            {/* Input Fields */}
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Title"
                    placeholderTextColor="#999"
                    value={title}
                    onChangeText={setTitle}
                />
                <TextInput
                    style={styles.commentInput}
                    placeholder="Write something..."
                    placeholderTextColor="#999"
                    value={content}
                    onChangeText={setContent}
                    multiline
                />
            </View>

            {/* Send Button */}
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText} maxFontSizeMultiplier={1.2}>Send</Text>
            </TouchableOpacity>

            {/* Success Modal */}
            <Modal
                visible={isSuccessModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSuccessModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Ionicons name="checkmark-circle" size={80} color="#32d15d" />
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>News posted successfully!</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setIsSuccessModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                visible={isErrorModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsErrorModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Ionicons name="close-circle" size={80} color="#d9534f" />
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setIsErrorModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
        },
        headerText: {
            marginLeft: 10,
            fontSize: 24,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#000',
        },
        formContainer: {
            marginTop: 20,
            marginHorizontal: 16,
        },
        input: {
            height: 40,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 10,
            marginBottom: 15,
            color: isDarkTheme ? '#f5f5f5' : '#000',
            backgroundColor: isDarkTheme ? '#1e1e1e' : '#fff',
        },
        commentInput: {
            height: 100,
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingTop: 10,
            textAlignVertical: 'top',
            backgroundColor: isDarkTheme ? '#ccc' : '#f7f7f7',
        },
        sendButton: {
            marginTop: 20,
            backgroundColor: '#6a5acd',
            marginHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 25,
            alignItems: 'center',
        },
        sendButtonText: {
            color: '#fff',
            fontSize: 16,
            fontFamily: 'Archivo_700Bold',
        },
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        modalContent: {
            width: 300,
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 20,
            alignItems: 'center',
        },
        modalText: {
            fontSize: 22,
            fontFamily: 'Archivo_700Bold',
            marginVertical: 10,
            textAlign: 'center',
        },
        modalButton: {
            marginTop: 15,
            padding: 10,
            borderRadius: 5,
            backgroundColor: '#6a5acd',
        },
        modalButtonText: {
            color: '#fff',
            fontFamily: 'Archivo_700Bold',
            fontSize: 16,
        },
    };
};

export default PostNewsScreen;
