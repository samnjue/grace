import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
class AudioService {
    static sound = null;
    static isPlaying = false;
    static currentUri = null;
    static currentMetadata = null;
    static statusUpdateCallbacks = [];

    static async init() {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            playThroughEarpieceAndroid: false
        });

        await AudioService.tryRestoreSession();
    }

    static async tryRestoreSession() {
        try {
            const sessionData = await AsyncStorage.getItem('audioSession');
            if (sessionData) {
                const { uri, position, metadata } = JSON.parse(sessionData);
                if (uri) {
                    await AudioService.loadAudio(uri, metadata);
                    if (position) {
                        await AudioService.sound.setPositionAsync(parseInt(position, 10));
                    }
                }
            }
        } catch (error) {
            console.error("Error restoring audio session:", error);
        }
    }

    static async saveSession(position) {
        if (AudioService.currentUri) {
            try {
                await AsyncStorage.setItem('audioSession', JSON.stringify({
                    uri: AudioService.currentUri,
                    position: position || (AudioService.sound ? await AudioService.getCurrentPosition() : 0),
                    metadata: AudioService.currentMetadata
                }));
            } catch (error) {
                console.error("Error saving audio session:", error);
            }
        }
    }

    static async getCurrentPosition() {
        if (AudioService.sound) {
            const status = await AudioService.sound.getStatusAsync();
            return status.positionMillis;
        }
        return 0;
    }

    static registerStatusCallback(callback) {
        if (!AudioService.statusUpdateCallbacks.includes(callback)) {
            AudioService.statusUpdateCallbacks.push(callback);
        }
        return () => {
            AudioService.statusUpdateCallbacks =
                AudioService.statusUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    static updateAllCallbacks(status) {
        AudioService.statusUpdateCallbacks.forEach(callback => {
            try {
                callback(status);
            } catch (err) {
                console.error("Error in status callback:", err);
            }
        });
    }

    static async loadAudio(uri, metadata = {}, initialStatus = {}) {
        try {
            if (AudioService.sound && AudioService.currentUri === uri) {
                return AudioService.sound;
            }

            if (AudioService.sound) {
                await AudioService.sound.unloadAsync();
            }

            const source = { uri };
            const initialStatusWithMetadata = {
                shouldPlay: false,
                ...initialStatus,
                androidImplementation: 'MediaPlayer',
                progressUpdateIntervalMillis: 1000
            };

            if (Platform.OS === 'ios') {
                initialStatusWithMetadata.positionMillis = 0;
                initialStatusWithMetadata.progressUpdateIntervalMillis = 1000;
            }

            const { sound } = await Audio.Sound.createAsync(
                source,
                initialStatusWithMetadata,
                (status) => AudioService.onPlaybackStatusUpdate(status)
            );

            AudioService.sound = sound;
            AudioService.currentUri = uri;
            AudioService.currentMetadata = metadata;

            await AudioService.setupNotificationControls(metadata);

            return sound;
        } catch (error) {
            console.error("Error loading audio:", error);
            throw error;
        }
    }

    static async setupNotificationControls(metadata) {
        if (!AudioService.sound) return;

        try {
            if (Platform.OS === 'android') {
                await AudioService.sound.setStatusAsync({
                    androidImplementation: 'MediaPlayer',
                    android: {
                        appPackageName: Constants.manifest?.android?.package || undefined,
                        ...(metadata.title && { title: metadata.title }),
                        ...(metadata.author && { artist: metadata.author }),
                        ...(metadata.imageUri && { imageUrl: metadata.imageUri }),
                        showNotification: true
                    }
                });
            }

        } catch (error) {
            console.error("Error setting up notification:", error);
        }
    }

    static onPlaybackStatusUpdate(status) {
        if (status.isLoaded) {
            AudioService.isPlaying = status.isPlaying;

            AudioService.updateAllCallbacks(status);

            if (status.positionMillis % 5000 < 1000) {
                AudioService.saveSession(status.positionMillis);
            }
        } else if (status.error) {
            console.error(`Audio playback error: ${status.error}`);
        }
    }

    static async play() {
        if (AudioService.sound) {
            await AudioService.sound.playAsync();
            AudioService.isPlaying = true;
        }
    }

    static async pause() {
        if (AudioService.sound) {
            await AudioService.sound.pauseAsync();
            AudioService.isPlaying = false;
            await AudioService.saveSession();
        }
    }

    static async stop() {
        if (AudioService.sound) {
            await AudioService.sound.stopAsync();
            AudioService.isPlaying = false;
            await AudioService.saveSession();
        }
    }

    static async seekTo(position) {
        if (AudioService.sound) {
            await AudioService.sound.setPositionAsync(position);
        }
    }

    static async unload() {
        await AudioService.saveSession();
        if (AudioService.sound) {
            await AudioService.sound.unloadAsync();
            AudioService.sound = null;
            AudioService.isPlaying = false;
            AudioService.currentUri = null;
        }
    }
}

export default AudioService;