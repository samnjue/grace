import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

export default function MainAuthScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const theme = useSelector((state) => state.theme.theme);
    const styles = getStyle(theme);

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
            <View style={styles.container}>
                <Image source={require('../../../assets/adaptive-icon.png')} style={styles.logo} />
                <Text style={styles.header}>Your Church Companion,</Text>
                <Text style={styles.subHeader}>Grace</Text>
                <View style={{ paddingBottom: 30 }}>
                    <TouchableOpacity
                        style={styles.signUpButton}
                        onPress={() => navigation.navigate('SignUp')}
                    >
                        <Text style={styles.buttonText}>SIGN UP</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.logInButton}
                    onPress={() => navigation.navigate('LogIn')}
                >
                    <Text style={styles.buttonText}>LOG IN</Text>
                </TouchableOpacity>
                <Image source={require('../../../assets/ivorypng (2).png')} style={{ width: 120, height: 120, top: 110 }} />
            </View>
        </View>
    );
}

const getStyle = (theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme === 'dark' ? '#121212' : '#fff',
        width: '100%'
    },
    logo: {
        width: 250,
        height: 250,
        marginBottom: -30,
        bottom: 35
    },
    header: {
        fontSize: 24,
        fontFamily: 'Archivo_700Bold',
        textAlign: 'center',
        bottom: 38,
        color: theme === 'dark' ? '#fff' : '#333'
    },
    subHeader: {
        fontSize: 24,
        fontFamily: 'Archivo_700Bold',
        marginBottom: 40,
        bottom: 38,
        color: theme === 'dark' ? '#fff' : '#333'
    },
    signUpButton: {
        backgroundColor: '#6a5acd',
        width: 319,
        height: 57,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        marginBottom: 5,
    },
    logInButton: {
        backgroundColor: theme === 'dark' ? '##8bbac2' : '#2b3635',
        width: 319,
        height: 57,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Archivo_700Bold',
    },
})


// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#fff',
//     },
//     logo: {
//         width: 250,
//         height: 250,
//         marginBottom: -30,
//         bottom: 35
//     },
//     header: {
//         fontSize: 24,
//         fontFamily: 'Archivo_700Bold',
//         textAlign: 'center',
//         bottom: 38,
//         color: "#333"
//     },
//     subHeader: {
//         fontSize: 24,
//         fontFamily: 'Archivo_700Bold',
//         marginBottom: 40,
//         bottom: 38
//     },
//     signUpButton: {
//         backgroundColor: '#6a5acd',
//         width: 319,
//         height: 57,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRadius: 50,
//         marginBottom: 5,
//     },
//     logInButton: {
//         backgroundColor: '#2b3635',
//         width: 319,
//         height: 57,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRadius: 50,
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontFamily: 'Archivo_700Bold',
//     },
// });

//const styles = getStyles(theme);

// const getStyles = (theme) => ({
//     container: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: theme === 'dark' ? '#121212' : '#fff',
//     },
//     logo: {
//         width: 250,
//         height: 250,
//         marginBottom: -30,
//         bottom: 35
//     },
//     header: {
//         fontSize: 24,
//         fontFamily: 'Archivo_700Bold',
//         textAlign: 'center',
//         bottom: 38,
//         color: theme === 'dark' ? '#333' : '#fff'
//     },
//     subHeader: {
//         fontSize: 24,
//         fontFamily: 'Archivo_700Bold',
//         marginBottom: 40,
//         bottom: 38
//     },
//     signUpButton: {
//         backgroundColor: '#6a5acd',
//         width: 319,
//         height: 57,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRadius: 50,
//         marginBottom: 5,
//     },
//     logInButton: {
//         backgroundColor: theme === 'dark' ? '##8bbac2' : '#2b3635',
//         width: 319,
//         height: 57,
//         justifyContent: 'center',
//         alignItems: 'center',
//         borderRadius: 50,
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontFamily: 'Archivo_700Bold',
//     },
// })

