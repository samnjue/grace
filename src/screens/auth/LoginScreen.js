import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import CustomError from '../../components/CustomError';
import { logIn } from '../../redux/slices/userSlice';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [error, setError] = useState('');
    const [signUpSuccess, setSignUpSuccess] = useState(false);

    const dispatch = useDispatch();

    const handleAuth = async () => {
        setError('');
        setSignUpSuccess(false);
        setIsLoading(true);

        try {
            let response;

            if (isSignUp) {
                response = await supabase.auth.signUp({ email, password });
                const { error: authError } = response;

                if (authError) {
                    throw new Error(authError.message);
                }

                setSignUpSuccess(true);
                return;
            } else {
                response = await supabase.auth.signInWithPassword({ email, password });
            }

            const { data, error: authError } = response;

            if (authError) {
                throw new Error(authError.message);
            }

            if (data?.session) {
                await AsyncStorage.setItem('userSession', JSON.stringify(data.session));
                dispatch(logIn({ email: data.session.user.email, session: data.session }));

                const { data: profile, error } = await supabase
                    .from('users')
                    .select('selected_church', 'selected_district')
                    .eq('id', data.session.user.id)
                    .single({ refresh: true });

                if (error) {
                    throw new Error(error.message);
                } else {
                    if (profile?.selected_church && profile?.selected_district == null) {
                        navigation.replace('MainApp');
                    } else {
                        navigation.replace('ChurchSelection');
                    }
                }
            }

        } catch (error) {
            setError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header} maxFontSizeMultiplier={1.2}>{isSignUp ? 'Sign Up' : 'Log In'}</Text>

            {error ? <CustomError message={error} /> : null}

            {/* Display the success message after sign-up */}
            {signUpSuccess && (
                <View style={styles.successMessageContainer}>
                    <Text style={styles.successMessage} maxFontSizeMultiplier={1.2}>
                        Check your mail and confirm your account then proceed to Log in.
                    </Text>
                </View>
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                maxFontSizeMultiplier={1.2}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                maxFontSizeMultiplier={1.2}
            />

            <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText} maxFontSizeMultiplier={1.2}>
                        {isSignUp ? 'Sign Up' : 'Log In'}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => setIsSignUp((prev) => !prev)}
                style={styles.switchMode}
            >
                <Text style={styles.switchModeText} maxFontSizeMultiplier={1.2}>
                    {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#6a5acd',
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    switchMode: {
        marginTop: 20,
        alignItems: 'center',
    },
    switchModeText: {
        color: '#6a5acd',
        fontSize: 14,
        fontWeight: 'bold',
    },
    successMessageContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#dff0d8',
        borderRadius: 8,
    },
    successMessage: {
        color: '#3c763d',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

{/* 
        
*/}




