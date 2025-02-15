import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { StatusBar } from 'react-native';

const SermonScreen = ({ route }) => {
    const { sermon_image, sermon, sermon_metadata, sermon_content } = route.params;
    const navigation = useNavigation();
    const theme = useSelector((state) => state.theme.theme);
    const insets = useSafeAreaInsets();

    const [scrollY] = useState(new Animated.Value(0));

    const fadeInOut = scrollY.interpolate({
        inputRange: [250, 330],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const styles = getStyle(theme, insets);
    const isDarkTheme = theme.toLowerCase().includes('dark');

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle={isDarkTheme ? 'light-content' : 'dark-content'}
                //backgroundColor={isDarkTheme ? '#121212' : '#fff'}
                animated
            />
            <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.imageContainer}>
                    <Image source={{ uri: sermon_image }} style={styles.image} />
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.title}>{sermon}</Text>
                    <Text style={styles.metadata}>{sermon_metadata}</Text>
                    <Text style={styles.content}>{sermon_content}</Text>
                </View>
            </ScrollView>

            <Animated.View style={[styles.topBar, { opacity: fadeInOut }]}>
                <TouchableOpacity style={styles.topBarBackButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={isDarkTheme ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text
                    style={styles.topBarTitle}
                    numberOfLines={1}
                    ellipsizeMode='tail'
                >{sermon}</Text>
            </Animated.View>
        </View>
    );
};

const getStyle = (theme, insets) => {
    const isDarkTheme = theme.toLowerCase().includes('dark');

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
        },
        imageContainer: {
            height: 300,
            position: 'relative',
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        backButton: {
            position: 'absolute',
            top: insets.top + 10,
            left: 15,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            padding: 10,
            borderRadius: 50,
        },
        contentContainer: {
            padding: 20,
        },
        title: {
            fontSize: 28,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#333',
        },
        metadata: {
            fontSize: 13,
            fontFamily: 'Inter_700Bold',
            color: isDarkTheme ? '#bbb' : '#777',
            marginTop: 5,
            marginLeft: 15,
            lineHeight: 21
        },
        content: {
            fontSize: 20,
            fontWeight: '600',
            fontFamily: 'SourceSerif4_400Regular',
            color: isDarkTheme ? '#f7f7f7' : '#222',
            marginTop: 20,
            lineHeight: 24,
        },
        topBar: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: isDarkTheme ? '#121212' : '#fff',
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 15,
            paddingTop: insets.top,
        },
        topBarBackButton: {
            padding: 10,
        },
        topBarTitle: {
            fontSize: 18,
            fontFamily: 'Archivo_700Bold',
            color: isDarkTheme ? '#fff' : '#121212',
            marginLeft: 10,
            flex: 1,
        },
    });
};

export default SermonScreen;
