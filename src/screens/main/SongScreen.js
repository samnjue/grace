import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import tenziData from '../../data/tenzi.json';
import hymnsData from '../../data/hymns.json';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';

export default function SongScreen({ navigation }) {
    const insets = useSafeAreaInsets();

    const songTypes = useMemo(() => ({
        Tenzi: tenziData,
        //Hymns: hymnsData,
    }), []);

    const typeKeys = Object.keys(songTypes);
    const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
    const currentType = typeKeys[currentTypeIndex];
    const songData = songTypes[currentType];

    const songs = useMemo(() => Object.keys(songData), [songData]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSongs, setFilteredSongs] = useState(songs);

    const toggleType = () => {
        const nextIndex = (currentTypeIndex + 1) % typeKeys.length;
        setCurrentTypeIndex(nextIndex);
    };

    useEffect(() => {
        if (searchQuery === '') {
            setFilteredSongs(songs);
        } else {
            const filtered = songs.filter((song) =>
                song.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSongs(filtered);
        }
    }, [searchQuery, songs]);

    const handleSongPress = (song) => {
        navigation.navigate('SelectedSongScreen', {
            songTitle: song,
            songData: songData[song],
            type: currentType
        });
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
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <Header
                title="Songs"
                version={currentType}
                onVersionPress={toggleType}
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
                </View>

                <FlatList
                    data={filteredSongs}
                    keyExtractor={(item) => item}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleSongPress(item)}>
                            <Text style={styles.songName} maxFontSizeMultiplier={1.2}>{item}</Text>
                        </TouchableOpacity>
                    )}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
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
    songName: {
        fontSize: 18,
        fontFamily: 'Inter',
        padding: 20,
        paddingLeft: 10,
    },
});


