import { Audio } from 'expo-av';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_AUDIO_TASK = 'background-audio-task';

class AudioService {
    static sound = null;
    static isPlaying = false;
    static currentUri = null;
    static currentMetadata = null;
    static statusUpdateCallbacks = [];

    static async init() {
        // Request audio mode permissions for background playback
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
            playThroughEarpieceAndroid: false
        });

        // Register background task
        TaskManager.defineTask(BACKGROUND_AUDIO_TASK, async () => {
            // This task keeps the audio service alive in background
            return BackgroundFetch.BackgroundFetchResult.NewData;
        });

        // Try to register the task (it's okay if it fails because it's already registered)
        try {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_AUDIO_TASK, {
                minimumInterval: 60, // 1 minute
                stopOnTerminate: false,
                startOnBoot: true,
            });
        } catch (err) {
            console.log('Background task already registered');
        }

        // Try to restore last session if app was closed
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
        // Add callback to array if not already present
        if (!AudioService.statusUpdateCallbacks.includes(callback)) {
            AudioService.statusUpdateCallbacks.push(callback);
        }
        return () => {
            // Return a function to unregister
            AudioService.statusUpdateCallbacks =
                AudioService.statusUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    static updateAllCallbacks(status) {
        // Call all registered callbacks with the status
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
            // If we already have this sound loaded, don't reload it
            if (AudioService.sound && AudioService.currentUri === uri) {
                return AudioService.sound;
            }

            // Unload any existing sound
            if (AudioService.sound) {
                await AudioService.sound.unloadAsync();
            }

            // Configure playback with metadata for notification
            const playbackConfig = {
                shouldPlay: false,
                ...initialStatus
            };

            // Create sound object
            const { sound } = await Audio.Sound.createAsync(
                { uri },
                playbackConfig,
                (status) => AudioService.onPlaybackStatusUpdate(status)
            );

            // Store references
            AudioService.sound = sound;
            AudioService.currentUri = uri;
            AudioService.currentMetadata = metadata;

            // Set up notification controls
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
            // Set the metadata for the notification
            await Audio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                staysActiveInBackground: true,
            });

            await AudioService.sound.setStatusAsync({
                progressUpdateIntervalMillis: 1000,
                androidImplementation: 'MediaPlayer',
            });

            // Configure notification
            const title = metadata.title || 'Sermon';
            const author = metadata.author || 'Speaker';
            const albumArt = metadata.imageUri;

            await AudioService.sound.setOnPlaybackStatusUpdate(null);
            await AudioService.sound.setOnPlaybackStatusUpdate(
                (status) => AudioService.onPlaybackStatusUpdate(status)
            );
        } catch (error) {
            console.error("Error setting up notification:", error);
        }
    }

    static onPlaybackStatusUpdate(status) {
        if (status.isLoaded) {
            AudioService.isPlaying = status.isPlaying;

            // Update all registered callbacks
            AudioService.updateAllCallbacks(status);

            // Save session periodically
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