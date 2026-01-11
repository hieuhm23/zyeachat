import React, { useState, useEffect, useRef } from 'react';
import { StatusBar, View, Text, ActivityIndicator, AppState, Linking, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootStackParamList } from './src/navigation/types';
import { User } from './src/types';
import { getCurrentUser, logout as apiLogout, getConversations, setToken, getToken } from './src/utils/api';
import { initSocket, disconnectSocket, getSocket } from './src/utils/socket';
import { registerForPushNotificationsAsync, schedulePushNotification, incrementBadge, clearBadge, setBadgeCount } from './src/utils/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Screens - Chat and Call
import MainTabScreen from './src/screens/MainTabScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import NewChatScreen from './src/screens/NewChatScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import GroupInfoScreen from './src/screens/GroupInfoScreen';
import CallScreen from './src/screens/CallScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import CreateStoryScreen from './src/screens/CreateStoryScreen';
import MyQRCodeScreen from './src/screens/MyQRCodeScreen';
import SecuritySettingsScreen from './src/screens/SecuritySettingsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import StoryViewerScreen from './src/screens/StoryViewerScreen';

// Components
import IncomingCallModal from './src/components/IncomingCallModal';
import UpdateModal from './src/components/UpdateModal';

// Hooks
import { useAppUpdates } from './src/hooks/useAppUpdates';

// Configure Notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const Stack = createStackNavigator<RootStackParamList>();

// Screen shown when app is opened without token (not from main app)
function OpenFromMainAppScreen() {
    const { colors } = useTheme();

    return (
        <View style={styles.noTokenContainer}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={StyleSheet.absoluteFill}
            />
            <View style={styles.noTokenContent}>
                <View style={styles.iconContainer}>
                    <Ionicons name="chatbubbles" size={80} color="#fff" />
                </View>
                <Text style={styles.noTokenTitle}>Zyea Chat</Text>
                <Text style={styles.noTokenSubtitle}>
                    Ứng dụng tin nhắn
                </Text>
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#667eea" />
                    <Text style={styles.infoText}>
                        Vui lòng mở Zyea Chat từ ứng dụng myZyea để sử dụng tính năng chat.
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.openMainAppBtn}
                    onPress={() => {
                        // Try to open main app
                        Linking.openURL('zyea://').catch(() => {
                            Alert.alert('Thông báo', 'Vui lòng cài đặt ứng dụng myZyea');
                        });
                    }}
                >
                    <Text style={styles.openMainAppText}>Mở myZyea</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function AppContent({ navigationRef }: { navigationRef: any }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [authChecked, setAuthChecked] = useState(false);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const initialUrlProcessed = useRef(false);

    const { colors, isDark } = useTheme();
    const { isUpdateAvailable, isDownloading, downloadAndApply, dismissUpdate } = useAppUpdates();

    // Handle Deep Link from main app (zyeachat://chat?token=xxx&partnerId=xxx)
    useEffect(() => {
        const handleDeepLink = async (event: { url: string }) => {
            const url = event.url;
            if (!url) return;

            console.log('🔗 Deep link received:', url);

            // Parse URL parameters
            const params = new URLSearchParams(url.split('?')[1]);
            const token = params.get('token');
            const partnerId = params.get('partnerId');
            const userName = params.get('userName');
            const avatar = params.get('avatar');

            // If token is provided, check if it's different from current token
            if (token) {
                const currentToken = await getToken();

                // If token is different, logout current user first
                if (currentToken && currentToken !== token) {
                    console.log('🔄 Token changed, switching account...');
                    disconnectSocket();
                    setUser(null);
                }

                console.log('🔐 Token received from main app, authenticating...');
                await setToken(token);

                // Fetch user with new token
                const apiUser = await getCurrentUser();
                if (apiUser) {
                    setUser(apiUser);
                    console.log('✅ Auto-login successful:', apiUser.name);

                    // If partnerId is provided, navigate to chat
                    if (partnerId && navigationRef.isReady()) {
                        setTimeout(() => {
                            navigationRef.navigate('ChatDetail', {
                                partnerId,
                                userName: userName ? decodeURIComponent(userName) : 'Người dùng',
                                avatar: avatar ? decodeURIComponent(avatar) : undefined,
                            });
                        }, 500);
                    }
                } else {
                    // Token invalid, clear it
                    console.log('❌ Token invalid, clearing...');
                    await apiLogout();
                    setUser(null);
                }
            } else if (partnerId && navigationRef.isReady() && user) {
                // No token but has partnerId - just navigate (already logged in)
                navigationRef.navigate('ChatDetail', {
                    partnerId,
                    userName: userName ? decodeURIComponent(userName) : 'Người dùng',
                    avatar: avatar ? decodeURIComponent(avatar) : undefined,
                });
            }
        };

        // Handle deep link when app is already open
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Handle deep link when app is opened from cold start
        if (!initialUrlProcessed.current) {
            Linking.getInitialURL().then(url => {
                if (url) {
                    handleDeepLink({ url });
                }
            });
            initialUrlProcessed.current = true;
        }

        return () => subscription.remove();
    }, [navigationRef, user]);

    // Setup Notifications
    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) {
                setPushToken(token);
                console.log('✅ Push Token obtained');
            }
        }).catch(err => {
            console.log('⚠️ Push token error:', err.message);
        });

        // Handle notification tap
        const handleNotificationNavigation = (data: any) => {
            if (!data || !navigationRef.isReady()) return;

            if (data.conversationId || data.partnerId) {
                navigationRef.navigate('ChatDetail', {
                    conversationId: data.conversationId,
                    partnerId: data.partnerId,
                    userName: data.userName || 'Người dùng',
                    avatar: data.avatar
                });
            }
        };

        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            setTimeout(() => handleNotificationNavigation(data), 500);
        });

        Notifications.getLastNotificationResponseAsync().then(response => {
            if (response) {
                const data = response.notification.request.content.data;
                setTimeout(() => handleNotificationNavigation(data), 1000);
            }
        });

        return () => subscription.remove();
    }, []);

    // Update push token
    useEffect(() => {
        if (user && pushToken) {
            const { updatePushToken } = require('./src/utils/api');
            updatePushToken(pushToken)
                .then(() => console.log('✅ Push token sent'))
                .catch((err: any) => console.log('⚠️ Push token error:', err.message));
        }
    }, [user, pushToken]);

    // Socket management
    useEffect(() => {
        let socketListener: any = null;

        if (user?.id) {
            initSocket(user.id);
            const socket = getSocket();

            if (socket) {
                socketListener = async (message: any) => {
                    if (message.user && message.user._id !== user.id) {
                        await schedulePushNotification(
                            message.user.name || 'Tin nhắn mới',
                            message.type === 'image' ? '[Hình ảnh]' : (message.type === 'sticker' ? '[Nhãn dán]' : (message.text || 'Tin nhắn mới')),
                            {
                                conversationId: message.conversationId,
                                partnerId: message.user._id,
                                userName: message.user.name,
                                avatar: message.user.avatar
                            }
                        );
                        // Tăng badge count trên icon app
                        await incrementBadge();
                        setUnreadChatCount(prev => prev + 1);
                    }
                };

                socket.on('receiveMessage', socketListener);

                // Handle incoming call - redirect to main app for calls
                // Handle incoming call - Show IncomingCallModal
                socket.on('incomingCall', (data: any) => {
                    console.log('📞 Incoming call received:', data);
                    setIncomingCall(data);
                });

                // Handle call ended event
                socket.on('callEnded', () => {
                    setIncomingCall(null);
                });
            }
        } else {
            disconnectSocket();
        }

        return () => {
            const socket = getSocket();
            if (socket && socketListener) {
                socket.off('receiveMessage', socketListener);
                socket.off('incomingCall');
            }
        };
    }, [user?.id]);

    // Handle App State - verify token when app becomes active
    useEffect(() => {
        const handleAppStateChange = async (nextAppState: string) => {
            if (nextAppState === 'active') {
                // Verify token is still valid when app becomes active
                const token = await getToken();
                if (token) {
                    try {
                        const apiUser = await getCurrentUser();
                        if (apiUser) {
                            // Token valid, update user if needed
                            if (!user || user.id !== apiUser.id) {
                                setUser(apiUser);
                            }
                            // Clear badge and reconnect socket
                            await clearBadge();
                            const socket = getSocket();
                            if (socket) {
                                if (!socket.connected) socket.connect();
                                socket.emit('join', apiUser.id);
                            }
                        } else {
                            // Token invalid, logout
                            console.log('⚠️ Token invalid on app active, logging out...');
                            await apiLogout();
                            disconnectSocket();
                            setUser(null);
                        }
                    } catch (error) {
                        console.log('⚠️ Token verification failed:', error);
                        await apiLogout();
                        disconnectSocket();
                        setUser(null);
                    }
                } else if (user) {
                    // No token but user exists - this shouldn't happen, logout
                    console.log('⚠️ No token but user exists, logging out...');
                    disconnectSocket();
                    setUser(null);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [user]);

    // Check session - check if there's a saved token
    useEffect(() => {
        const checkSession = async () => {
            try {
                const token = await getToken();
                if (token) {
                    const apiUser = await getCurrentUser();
                    if (apiUser) {
                        setUser(apiUser);
                    }
                }
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setLoading(false);
                setAuthChecked(true);
            }
        };
        checkSession();
    }, []);

    // Fetch unread count
    useEffect(() => {
        if (!user) return;

        const fetchUnread = async () => {
            try {
                const conversations = await getConversations();
                const total = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
                setUnreadChatCount(total);
                // Sync badge với unread count từ server
                await setBadgeCount(total);
            } catch (error) {
                console.log('Error fetching unread:', error);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogout = async () => {
        try {
            await apiLogout();
            disconnectSocket();
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        // Go back to main app after logout
        Linking.openURL('zyea://').catch(() => { });
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea' }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 16 }}>Đang tải...</Text>
            </View>
        );
    }

    // If no user (not authenticated) - show "Open from main app" screen
    if (!user && authChecked) {
        return <OpenFromMainAppScreen />;
    }

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Main" component={MainTabScreen} />
                <Stack.Screen name="ChatList" component={ChatListScreen} />
                <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                <Stack.Screen name="NewChat" component={NewChatScreen} />
                <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
                <Stack.Screen name="Settings">
                    {(props) => <SettingsScreen {...props} onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                <Stack.Screen name="SecuritySettings" component={SecuritySettingsScreen} />
                <Stack.Screen name="MyQRCode" component={MyQRCodeScreen} options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="CreateStory" component={CreateStoryScreen} options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false }} />
                <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ headerShown: false, presentation: 'modal' }} />
            </Stack.Navigator>

            {/* Incoming Call Modal */}
            <IncomingCallModal
                visible={!!incomingCall}
                callerName={incomingCall?.callerName}
                callerAvatar={incomingCall?.callerAvatar}
                isVideo={incomingCall?.callType === 'video'}
                onAccept={() => {
                    const callData = incomingCall;
                    setIncomingCall(null);
                    navigationRef.navigate('Call', {
                        channelId: callData.channelId,
                        partnerName: callData.callerName,
                        partnerAvatar: callData.callerAvatar,
                        isVideo: callData.callType === 'video',
                        isIncoming: true,
                    });
                }}
                onReject={() => {
                    const socket = getSocket();
                    if (socket && incomingCall) {
                        socket.emit('callRejected', {
                            callerId: incomingCall.callerId,
                            receiverId: user?.id
                        });
                    }
                    setIncomingCall(null);
                }}
            />

            {/* OTA Update Modal */}
            <UpdateModal
                visible={isUpdateAvailable}
                isDownloading={isDownloading}
                onUpdate={downloadAndApply}
                onClose={dismissUpdate}
            />
        </>
    );
}

const styles = StyleSheet.create({
    noTokenContainer: {
        flex: 1,
    },
    noTokenContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    noTokenTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    noTokenSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 40,
    },
    infoBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 30,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    openMainAppBtn: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 30,
    },
    openMainAppText: {
        color: '#667eea',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default function App() {
    const navigationRef = useNavigationContainerRef<RootStackParamList>();

    return (
        <SafeAreaProvider>
            <ThemeProvider>
                <NavigationContainer ref={navigationRef}>
                    <AppContent navigationRef={navigationRef} />
                </NavigationContainer>
            </ThemeProvider>
        </SafeAreaProvider>
    );
}
