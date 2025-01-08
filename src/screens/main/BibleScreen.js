import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import nkjvBibleData from '../../data/bible.json';
// import kswBibleData from '../../data/biblia.json';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

export default function BibleScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const bibleVersions = useMemo(() => ({
        NKJV: nkjvBibleData,
        // KSW: kswBibleData
    }), []);
    const versionKeys = Object.keys(bibleVersions);
    const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
    const currentVersion = versionKeys[currentVersionIndex];
    const bibleData = bibleVersions[currentVersion];

    const books = useMemo(() => Object.keys(bibleData), [bibleData]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredBooks, setFilteredBooks] = useState(books);
    const [selectedBook, setSelectedBook] = useState(null);

    const toggleVersion = () => {
        const nextIndex = (currentVersionIndex + 1) % versionKeys.length;
        setCurrentVersionIndex(nextIndex);
    };

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredBooks(books);
        } else {
            const filtered = books.filter((book) =>
                book.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredBooks(filtered);
        }
    }, [searchQuery, books]);

    const handleBookPress = (book) => {
        setSelectedBook(book);
    };

    const handleCloseModal = () => {
        setSelectedBook(null);
    };

    const handleChapterSelect = (chapter) => {
        navigation.navigate('ChapterScreen', { book: selectedBook, chapter });
        handleCloseModal();
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
            <Header
                title="Bible"
                version={currentVersion}
                onVersionPress={toggleVersion}
                showVersionButton={true}
            />
            <View style={styles.container}>
                <View style={styles.search}>
                    <Ionicons name="search-outline" size={25} style={styles.icon} />
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search"
                        value={searchQuery}
                        onChangeText={(text) => setSearchQuery(text)}
                        maxFontSizeMultiplier={1.2}
                    />
                    {/* </View> */}
                </View>

                <FlatList
                    data={filteredBooks}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleBookPress(item)}>
                            <Text style={styles.bookName} maxFontSizeMultiplier={1.2}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />

                {selectedBook && (
                    <Modal
                        animationType='none'
                        visible={true}
                        transparent={true}
                        onRequestClose={handleCloseModal}
                    >
                        <View style={styles.modalBackground}>
                            <View style={styles.modalContainer}>
                                <Text style={styles.modalTitle} maxFontSizeMultiplier={1.2}>{selectedBook}</Text>
                                <ScrollView contentContainerStyle={styles.chapterGrid} showsVerticalScrollIndicator={false}>
                                    {Object.keys(bibleData[selectedBook]).map((chapter) => (
                                        <TouchableOpacity
                                            key={chapter}
                                            style={styles.chapterItem}
                                            onPress={() => handleChapterSelect(chapter)}
                                        >
                                            <Text style={styles.chapterText} maxFontSizeMultiplier={1.2}>{chapter}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleCloseModal}
                                >
                                    <Text style={styles.closeButtonText} maxFontSizeMultiplier={1.2}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        paddingBottom: 0,
        backgroundColor: '#fff',
    },
    searchBar: {
        flex: 1,
        height: 40,
        fontSize: 17,
        paddingLeft: 0,
        textAlignVertical: 'center'
    },
    icon: {
        marginRight: 10,
        marginLeft: 5,
    },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 0,
        borderRadius: 24,
        backgroundColor: '#ececec',
        width: '100%',
        padding: 5,
    },
    bookName: {
        fontSize: 18,
        fontFamily: 'Inter',
        padding: 20,
        paddingLeft: 10,
    },
    modalBackground: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    modalContainer: {
        width: '90%',
        maxHeight: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
    },
    modalTitle: {
        fontSize: 24,
        fontFamily: 'Archivo_700Bold',
        marginBottom: 0,
    },
    chapterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    chapterItem: {
        width: 50,
        height: 50,
        margin: 5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e6e6e6',
        borderRadius: 25,
    },
    chapterText: {
        fontSize: 16,
        fontFamily: "SourceSerif4_700Bold",
    },
    closeButton: {
        marginTop: 5,
        padding: 10,
        backgroundColor: '#6a5acd',
        borderRadius: 5,
    },
    closeButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontFamily: 'Inter_700Bold',
        fontSize: 18
    },
});