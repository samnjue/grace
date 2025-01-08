import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Modal, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';

const ShareAppScreen = ({ navigation }) => {
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

    const appLink = 'https://example.com/app';

    const handleCopyLink = () => {
        Clipboard.setString(appLink);
        setIsSuccessModalVisible(true);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Check out the Grace app: ${appLink}`,
            });
        } catch (error) {
            console.error('Error sharing app link:', error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerText} maxFontSizeMultiplier={1}>Share App Link</Text>
            </View>

            {/* App Image and Name */}
            <View style={styles.content}>
                <Image
                    source={require('../../../assets/adaptive-icon.png')}
                    style={styles.image}
                />
                <Text style={styles.appName} maxFontSizeMultiplier={1}>Grace</Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
                    <Text style={styles.copyButtonText} maxFontSizeMultiplier={1.2}>Copy Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText} maxFontSizeMultiplier={1.2}>Share</Text>
                </TouchableOpacity>
            </View>

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
                        <Text style={styles.modalText} maxFontSizeMultiplier={1.2}>Link copied to clipboard!</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
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
        </View>
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
        fontSize: 18,
        fontFamily: 'Archivo_700Bold',
        //left: 80,
        color: '#000',
    },
    content: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    image: {
        width: 400,
        height: 400,
        resizeMode: 'contain',
        bottom: 40
    },
    appName: {
        marginTop: 20,
        bottom: 130,
        fontSize: 24,
        fontFamily: 'Archivo_700Bold',
        color: '#000',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        marginBottom: 20,
    },
    copyButton: {
        flex: 1,
        marginRight: 10,
        backgroundColor: '#d3d3d3',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    copyButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#000',
        fontSize: 16,
    },
    shareButton: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#6a5acd',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
    },
    shareButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#fff',
        fontSize: 16,
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

export default ShareAppScreen;
