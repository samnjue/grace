import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

const EditScreen = ({ navigation }) => {
    const [displayName, setDisplayName] = useState('');
    const [isButtonVisible, setIsButtonVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

    const handleInputChange = (text) => {
        setDisplayName(text);
        setIsButtonVisible(text.trim() !== '' && /^[a-zA-Z\s]*$/.test(text) && text.length <= 25);
    };

    const handleDone = async () => {
        if (displayName.length > 25) {
            setErrorMessage('Excess characters');
            setIsErrorModalVisible(true);
        } else if (!/^[a-zA-Z\s]*$/.test(displayName)) {
            setErrorMessage('Invalid characters');
            setIsErrorModalVisible(true);
        } else {
            try {
                const { data: user, error: authError } = await supabase.auth.updateUser({
                    data: { display_name: displayName },
                });

                if (authError) {
                    setErrorMessage('Failed to update display name');
                    setIsErrorModalVisible(true);
                    return;
                }

                const { error: tableError } = await supabase
                    .from('users')
                    .update({ display_name: displayName })
                    .eq('id', user.user.id);

                if (tableError) {
                    setErrorMessage('Failed to update user table');
                    setIsErrorModalVisible(true);
                    return;
                }

                // Success
                setIsSuccessModalVisible(true);
            } catch (err) {
                setErrorMessage('An unexpected error occurred');
                setIsErrorModalVisible(true);
            }
        }
    };


    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText} maxFontSizeMultiplier={1}>Edit Display Name</Text>
            </View>

            {/* Input Field */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter name"
                    value={displayName}
                    onChangeText={handleInputChange}
                    maxFontSizeMultiplier={1.2}
                />
            </View>

            {/* Done Button */}
            {isButtonVisible && (
                <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
                    <Text style={styles.doneButtonText} maxFontSizeMultiplier={1.2}>DONE</Text>
                </TouchableOpacity>
            )}

            {/* Error Modal */}
            <Modal
                visible={isErrorModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => setIsErrorModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Ionicons name="close-circle" size={80} color="#d9534f" style={{ paddingTop: -10, bottom: 5 }} />
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>{errorMessage}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setIsErrorModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>Try again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                visible={isSuccessModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsSuccessModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Ionicons name="checkmark-circle" size={80} color="#32d15d" style={{ paddingTop: -10, bottom: 5 }} />
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>Changes saved</Text>
                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: '#6a5acd' }]}
                            onPress={() => {
                                setIsSuccessModalVisible(false);
                                navigation.goBack();
                            }}
                        >
                            <Text style={styles.modalButtonText} maxFontSizeMultiplier={1.2}>Nice!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        marginLeft: 10,
        //left: 65,
        fontSize: 18,
        fontFamily: 'Archivo_700Bold',
        color: '#000',
    },
    inputContainer: {
        marginTop: 50,
        alignItems: 'center',
    },
    input: {
        width: '85%',
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'gray',
        paddingHorizontal: 20,
        fontSize: 16,
    },
    doneButton: {
        marginTop: 40,
        backgroundColor: '#6a5acd',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 30,
        alignSelf: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 17,
        fontFamily: 'Inter_700Bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 25,
        padding: 45,
        paddingTop: 20,
        alignItems: 'center',
        width: '80%',
    },
    modalText: {
        fontSize: 22,
        color: '#333',
        marginVertical: 7,
        marginTop: -10,
        fontFamily: 'Inter_700Bold',
        textAlign: 'center',
        top: 18
    },
    modalButton: {
        marginTop: 20,
        backgroundColor: '#6a5acd',
        height: 50,
        width: 150,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        top: 25,
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Archivo_700Bold',
        textAlign: 'center',
    },
});

export default EditScreen;
