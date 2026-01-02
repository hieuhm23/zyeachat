import React, { useState, useEffect } from 'react';
import { StatusBar, View, Text, ActivityIndicator, AppState, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Notifications from 'expo-notifications';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { RootStackParamList } from './src/navigation/types';
import { User } from './src/types';
import { getCurrentUser, logout as apiLogout, getConversations } from './src/utils/api';
import { initSocket, disconnectSocket, getSocket } from './src/utils/socket';
import { registerForPushNotificationsAsync, schedulePushNotification } from './src/utils/notifications';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import NewChatScreen from './src/screens/NewChatScreen';
import CreateGroupScreen from './src/screens/CreateGroupScreen';
import GroupInfoScreen from './src/screens/GroupInfoScreen';
import CallScreen from './src/screens/CallScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

// Components
import IncomingCallModal from './src/components/IncomingCallModal';

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

function AppContent({ navigationRef }: { navigationRef: any }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [pushToken, setPushToken] = useState<string | null>(null);
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Incoming call state
    const [incomingCall, setIncomingCall] = useState<{
        visible: boolean;
        callerId: string;
        callerName?: string;
        callerAvatar?: string;
        channelName?: string;
        isVideo: boolean;
    }>({ visible: false, callerId: '', isVideo: false });

    const { colors, isDark } = useTheme();

    // Handle Deep Link from main app (zyeachat://chat?partnerId=...)
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const url = event.url;
            if (!url || !navigationRef.isReady()) return;

            console.log('🔗 Deep link received:', url);

            // Parse zyeachat://chat?partnerId=xxx&userName=xxx&avatar=xxx
            if (url.includes('zyeachat://chat')) {
                const params = new URLSearchParams(url.split('?')[1]);
                const partnerId = params.get('partnerId');
                const userName = params.get('userName');
                const avatar = params.get('avatar');

                if (partnerId) {
                    navigationRef.navigate('ChatDetail', {
                        partnerId,
                        userName: userName ? decodeURIComponent(userName) : 'Người dùng',
                        avatar: avatar ? decodeURIComponent(avatar) : undefined,
                    });
                }
            }
        };

        // Handle deep link when app is already open
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Handle deep link when app is opened from cold start
        Linking.getInitialURL().then(url => {
            if (url) {
                setTimeout(() => handleDeepLink({ url }), 1000);
            }
        });

        return () => subscription.remove();
    }, [navigationRef]);

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
                        setUnreadChatCount(prev => prev + 1);
                    }
                };

                socket.on('receiveMessage', socketListener);

                // Handle incoming call
                socket.on('incomingCall', (data: any) => {
                    setIncomingCall({
                        visible: true,
                        callerId: data.callerId,
                        callerName: data.callerName,
                        callerAvatar: data.callerAvatar,
                        channelName: data.channelName,
                        isVideo: data.isVideo,
                    });
                });

                socket.on('callEnded', (data: any) => {
                    setIncomingCall((prev) => {
                        if (prev.visible && prev.callerId === data.callerId) {
                            return { ...prev, visible: false };
                        }
                        return prev;
                    });
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
                socket.off('callEnded');
            }
        };
    }, [user?.id]);

    // Handle App State
    useEffect(() => {
        const handleAppStateChange = (nextAppState: string) => {
            if (nextAppState === 'active' && user?.id) {
                const socket = getSocket();
                if (socket) {
                    if (!socket.connected) socket.connect();
                    socket.emit('join', user.id);
                }
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [user?.id]);

    // Check session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const apiUser = await getCurrentUser();
                if (apiUser) setUser(apiUser);
            } catch (error) {
                console.error('Session check error:', error);
            } finally {
                setLoading(false);
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
            } catch (error) {
                console.log('Error fetching unread:', error);
            }
        };

        fetchUnread();
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [user]);

    const handleLogin = (loggedInUser: User) => {
        setUser(loggedInUser);
    };

    const handleLogout = async () => {
        try {
            await apiLogout();
            disconnectSocket();
        } catch (error) {
            console.error('Logout error:', error);
        }
        setUser(null);
        if (navigationRef.isReady()) {
            navigationRef.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
            });
        }
    };

    const handleAcceptCall = () => {
        const socket = getSocket();
        if (socket) {
            socket.emit('callAccepted', {
                callerId: incomingCall.callerId,
                receiverId: user?.id,
                channelName: incomingCall.channelName,
            });
        }

        setIncomingCall({ ...incomingCall, visible: false });

        if (navigationRef.isReady()) {
            navigationRef.navigate('Call', {
                partnerId: incomingCall.callerId,
                userName: incomingCall.callerName,
                avatar: incomingCall.callerAvatar,
                isVideo: incomingCall.isVideo,
                isIncoming: true,
                channelName: incomingCall.channelName,
            });
        }
    };

    const handleRejectCall = () => {
        const socket = getSocket();
        if (socket) {
            socket.emit('callRejected', {
                callerId: incomingCall.callerId,
                receiverId: user?.id,
            });
        }
        setIncomingCall({ ...incomingCall, visible: false });
    };

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#667eea' }}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={{ color: '#fff', marginTop: 16 }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!user ? (
                    <Stack.Screen name="Auth">
                        {() => <AuthScreen onLogin={handleLogin} />}
                    </Stack.Screen>
                ) : (
                    <>
                        <Stack.Screen name="ChatList" component={ChatListScreen} />
                        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                        <Stack.Screen name="NewChat" component={NewChatScreen} />
                        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
                        <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
                        <Stack.Screen
                            name="Call"
                            component={CallScreen}
                            options={{ gestureEnabled: false }}
                        />
                        <Stack.Screen name="Settings">
                            {(props) => <SettingsScreen {...props} onLogout={handleLogout} />}
                        </Stack.Screen>
                        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
                        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
                    </>
                )}
            </Stack.Navigator>

            <IncomingCallModal
                visible={incomingCall.visible}
                callerName={incomingCall.callerName}
                callerAvatar={incomingCall.callerAvatar}
                isVideo={incomingCall.isVideo}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
            />
        </>
    );
}

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
