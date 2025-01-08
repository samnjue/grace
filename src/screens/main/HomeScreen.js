import React, { useState, useCallback, useEffect } from 'react';
import { RefreshControl, StyleSheet, View, FlatList, Modal, Text, TouchableOpacity, BackHandler } from 'react-native';
import VerseCard from '../../components/VerseCard';
import DistrictNewsCard from '../../components/DistrictNewsCard';
import SundayGuideCard from '../../components/SundayGuideCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../../components/Header';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isExitModalVisible, setIsExitModalVisible] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setRefreshKey((prevKey) => prevKey + 1);
        setTimeout(() => {
            setRefreshing(false);
        }, 10);
    }, []);

    const handleBackPress = () => {
        setIsExitModalVisible(true);
        return true;
    };

    useFocusEffect(
        React.useCallback(() => {
            BackHandler.addEventListener('hardwareBackPress', handleBackPress);

            return () => BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
        }, [])
    );

    const renderItem = ({ item }) => {
        switch (item) {
            case 'VerseCard':
                return <VerseCard refreshKey={refreshKey} />;
            case 'DistrictNewsCard':
                return <DistrictNewsCard refreshKey={refreshKey} />;
            case 'SundayGuideCard':
                return <SundayGuideCard refreshKey={refreshKey} />;
            default:
                return null;
        }
    };

    return (
        <View
            style={{
                flex: 1,
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                paddingLeft: insets.left,
                paddingRight: insets.right,
                backgroundColor: '#fff',
            }}
        >
            <Header title="Home" />
            <FlatList
                data={['VerseCard', 'DistrictNewsCard', 'SundayGuideCard']}
                renderItem={renderItem}
                keyExtractor={(item) => item}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
            />

            {/* Exit App Modal */}
            <Modal
                visible={isExitModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsExitModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalText}>
                            Are you sure you want to exit Grace?
                        </Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity
                                style={styles.exitButton}
                                onPress={() => {
                                    setIsExitModalVisible(false);
                                    BackHandler.exitApp();
                                }}
                            >
                                <Text style={styles.exitButtonText}>Exit</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsExitModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 16,
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
    modalText: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#555',
        textAlign: 'center',
        marginBottom: 10,
        marginTop: 10,
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 25,
        width: '100%',
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
    exitButton: {
        flex: 1,
        backgroundColor: '#D2042D',
        borderRadius: 25,
        paddingVertical: 12,
        alignItems: 'center',
        marginLeft: 10,
    },
    exitButtonText: {
        fontFamily: 'Inter_700Bold',
        color: '#fff',
        fontSize: 16,
    },
});
