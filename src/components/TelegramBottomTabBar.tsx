import React from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

export type TelegramTabType = 'CONTACTS' | 'CALLS' | 'CHATS' | 'SETTINGS' | 'SEARCH';

interface TelegramBottomTabBarProps {
    activeTab: TelegramTabType;
    onTabChange: (tab: TelegramTabType) => void;
    unreadChatCount?: number;
}

interface TabItem {
    key: TelegramTabType;
    iconOutline: string;
    iconFilled: string;
    label?: string;
}

// Giống Telegram + Search icon
const tabs: TabItem[] = [
    { key: 'CONTACTS', iconOutline: 'person-outline', iconFilled: 'person', label: 'Danh bạ' },
    { key: 'CALLS', iconOutline: 'call-outline', iconFilled: 'call', label: 'Cuộc gọi' },
    { key: 'CHATS', iconOutline: 'chatbubble-outline', iconFilled: 'chatbubble', label: 'Chat' },
    { key: 'SETTINGS', iconOutline: 'settings-outline', iconFilled: 'settings', label: 'Cài đặt' },
    { key: 'SEARCH', iconOutline: 'search-outline', iconFilled: 'search', label: '' }, // Search visual only
];

// Telegram/iOS 18 blue
const ACTIVE_BLUE = '#007AFF';

export default function TelegramBottomTabBar({
    activeTab,
    onTabChange,
    unreadChatCount = 0
}: TelegramBottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const inactiveIcon = isDark ? '#8E8E93' : '#3C3C43';

    // Handler for tabs
    const handlePress = (key: TelegramTabType) => {
        if (key === 'SEARCH') {
            // Handle search press (could open modal or focus search)
            // For now, just select it or visual feedback
            console.log('Search pressed');
            return;
        }
        onTabChange(key);
    };

    return (
        <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[
                styles.container,
                {
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
                }
            ]}
        >
            <View style={styles.tabBar}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const showBadge = tab.key === 'CHATS' && unreadChatCount > 0;
                    const isSearch = tab.key === 'SEARCH';

                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.tabItem, isSearch && styles.searchItem]}
                            onPress={() => handlePress(tab.key)}
                            activeOpacity={0.7}
                        >
                            {isActive && !isSearch ? (
                                // ACTIVE: Pill xanh với icon + text
                                <View style={styles.activePill}>
                                    <Ionicons
                                        name={tab.iconFilled as any}
                                        size={18}
                                        color="#FFFFFF"
                                    />
                                    <Text style={styles.activeText}>{tab.label}</Text>
                                    {showBadge && (
                                        <View style={styles.badgeActive}>
                                            <Text style={styles.badgeText}>
                                                {unreadChatCount > 99 ? '99+' : unreadChatCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                // INACTIVE or Search: Chỉ icon
                                <View style={[styles.inactiveItem, isSearch && styles.searchIconContainer]}>
                                    <Ionicons
                                        name={isSearch ? "search" : tab.iconOutline as any}
                                        size={isSearch ? 26 : 24}
                                        color={isSearch ? (isDark ? '#FFF' : '#000') : inactiveIcon}
                                    />
                                    {showBadge && (
                                        <View style={styles.badge}>
                                            <Text style={styles.badgeText}>
                                                {unreadChatCount > 99 ? '99+' : unreadChatCount}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </BlurView>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTopWidth: 0.33,
        borderTopColor: 'rgba(255,255,255,0.2)', // Subtle border
        overflow: 'hidden', // Warning: overflow hidden might clip shadow on Android
        paddingTop: 8,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    searchItem: {
        // Special styling for search item if needed
    },
    searchIconContainer: {
        backgroundColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.05)' : 'transparent',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Active: Pill xanh giống Telegram/iOS 18
    activePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: ACTIVE_BLUE,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        gap: 5,
    },
    activeText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    // Inactive: Chỉ icon
    inactiveItem: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        position: 'relative',
    },
    // Badge
    badge: {
        position: 'absolute',
        top: 2,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeActive: {
        position: 'absolute',
        top: -2,
        right: -6,
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: ACTIVE_BLUE,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

