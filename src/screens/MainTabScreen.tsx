import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import TelegramBottomTabBar, { TelegramTabType } from '../components/TelegramBottomTabBar';
import ContactsScreen from './ContactsScreen';
import CallsScreen from './CallsScreen';
import ChatListScreen from './ChatListScreen';
import SettingsScreen from './SettingsScreen';
import { getConversations, apiRequest, logout as apiLogout } from '../utils/api';
import { disconnectSocket } from '../utils/socket';

export default function MainTabScreen() {
    const [activeTab, setActiveTab] = useState<TelegramTabType>('CHATS');
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Load unread count
    const loadUnreadCount = async () => {
        try {
            const conversations = await getConversations();
            const groups = await apiRequest<any[]>('/api/groups').catch(() => []);

            let totalUnread = 0;

            // Count from conversations
            if (Array.isArray(conversations)) {
                totalUnread += conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
            }

            // Count from groups
            if (Array.isArray(groups)) {
                totalUnread += groups.reduce((sum, g) => sum + (g.unreadCount || 0), 0);
            }

            setUnreadChatCount(totalUnread);
        } catch (error) {
            console.log('Load unread count error:', error);
        }
    };

    useEffect(() => {
        loadUnreadCount();

        // Poll for unread count every 10 seconds
        const interval = setInterval(loadUnreadCount, 10000);
        return () => clearInterval(interval);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadUnreadCount();
        }, [])
    );

    // Handle logout
    const handleLogout = async () => {
        try {
            await apiLogout();
            disconnectSocket();
        } catch (error) {
            console.log('Logout error:', error);
        }
        // Go back to main app after logout
        Linking.openURL('zyea://').catch(() => { });
    };

    const renderScreen = () => {
        switch (activeTab) {
            case 'CONTACTS':
                return <ContactsScreen />;
            case 'CALLS':
                return <CallsScreen />;
            case 'CHATS':
                return <ChatListScreen />;
            case 'SETTINGS':
                return <SettingsScreen onLogout={handleLogout} />;
            default:
                return <ChatListScreen />;
        }
    };

    return (
        <View style={styles.container}>
            {renderScreen()}
            <TelegramBottomTabBar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                unreadChatCount={unreadChatCount}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
