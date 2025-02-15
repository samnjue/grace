import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const useSessionManagement = (supabase) => {
    useEffect(() => {
        const initializeProfile = async () => {
            try {
                const savedSession = await AsyncStorage.getItem('supabaseSession');
                if (!savedSession) return;

                const session = JSON.parse(savedSession);

                // Check if access token is expired or close to expiring
                const tokenExpiryTime = session.expires_at * 1000; // Convert to milliseconds
                const currentTime = Date.now();
                const timeBuffer = 60 * 1000; // 1 minute buffer

                if (currentTime >= tokenExpiryTime - timeBuffer) {
                    // Token is expired or about to expire, attempt to refresh
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                        refresh_token: session.refresh_token,
                    });

                    if (refreshError) {
                        console.error('Failed to refresh session:', refreshError);
                        // Clear stored session data
                        await AsyncStorage.removeItem('supabaseSession');
                        Alert.alert('Session Expired', 'Please log in again to continue.');
                        return;
                    }

                    if (refreshData.session) {
                        // Store the new session
                        await AsyncStorage.setItem(
                            'supabaseSession',
                            JSON.stringify(refreshData.session)
                        );

                        // Update the Supabase client with the new session
                        await supabase.auth.setSession({
                            access_token: refreshData.session.access_token,
                            refresh_token: refreshData.session.refresh_token,
                        });
                    }
                } else {
                    // Token is still valid, just set the existing session
                    const { error: setSessionError } = await supabase.auth.setSession({
                        access_token: session.access_token,
                        refresh_token: session.refresh_token,
                    });

                    if (setSessionError) {
                        console.error('Failed to set session:', setSessionError);
                        Alert.alert('Error', 'Failed to restore user session. Please log in again.');
                        return;
                    }
                }

                // Load data only after successful session restoration
                await loadOfflineData();
                await fetchUserData();

            } catch (err) {
                console.error('Session initialization error:', err);
                Alert.alert('Error', 'An unexpected error occurred while restoring your session.');
            }
        };

        initializeProfile();
    }, []);
};

export default useSessionManagement;