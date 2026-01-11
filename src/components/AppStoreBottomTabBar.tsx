import React, { useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Platform,
    Animated,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

export type AppStoreTabType = 'CONTACTS' | 'CALLS' | 'CHATS' | 'SETTINGS' | 'SEARCH';

interface AppStoreBottomTabBarProps {
    activeTab: AppStoreTabType;
    onTabChange: (tab: AppStoreTabType) => void;
    unreadChatCount?: number;
}

interface TabItem {
    key: AppStoreTabType;
    iconOutline: keyof typeof Ionicons.glyphMap;
    iconFilled: keyof typeof Ionicons.glyphMap;
    label: string;
}

// Main tabs (4 tabs in first container)
const mainTabs: TabItem[] = [
    { key: 'CONTACTS', iconOutline: 'people-outline', iconFilled: 'people', label: 'Danh bạ' },
    { key: 'CALLS', iconOutline: 'call-outline', iconFilled: 'call', label: 'Cuộc gọi' },
    { key: 'CHATS', iconOutline: 'chatbubbles-outline', iconFilled: 'chatbubbles', label: 'Chat' },
    { key: 'SETTINGS', iconOutline: 'cog-outline', iconFilled: 'cog', label: 'Cài đặt' },
];

// iOS system blue
const ACTIVE_BLUE = '#007AFF';
const INACTIVE_GRAY = '#8E8E93';

// Individual Tab Item Component with animation
const TabItemComponent = ({
    tab,
    isActive,
    showBadge,
    unreadCount,
    onPress,
}: {
    tab: TabItem;
    isActive: boolean;
    showBadge: boolean;
    unreadCount: number;
    onPress: () => void;
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const iconColor = isActive ? ACTIVE_BLUE : INACTIVE_GRAY;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    };

    return (
        <TouchableOpacity
            style={styles.tabItem}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.tabContent,
                    { transform: [{ scale: scaleAnim }] }
                ]}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={isActive ? tab.iconFilled : tab.iconOutline}
                        size={25}
                        color={iconColor}
                    />
                    {showBadge && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
                <Text
                    style={[
                        styles.label,
                        { color: iconColor }
                    ]}
                    numberOfLines={1}
                >
                    {tab.label}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// Search Button Component
const SearchButton = ({ isDark }: { isDark: boolean }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.85,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 8,
        }).start();
    };

    return (
        <TouchableOpacity
            onPress={() => Alert.alert('Thông báo', 'Tính năng tìm kiếm đang được phát triển')}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
        >
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <Ionicons
                    name="search"
                    size={25}
                    color={isDark ? '#FFFFFF' : '#000000'}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function AppStoreBottomTabBar({
    activeTab,
    onTabChange,
    unreadChatCount = 0
}: AppStoreBottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();

    const handlePress = (key: AppStoreTabType) => {
        onTabChange(key);
    };

    return (
        <View
            style={[
                styles.container,
                {
                    paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12,
                }
            ]}
        >
            <View style={styles.tabBarRow}>
                {/* Main tabs container (4 tabs) */}
                <View style={styles.mainTabsWrapper}>
                    <BlurView
                        intensity={60}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.blurContainer}
                    >
                        <View
                            style={[
                                styles.mainTabsContainer,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(60, 60, 67, 0.4)'
                                        : 'rgba(255, 255, 255, 0.7)',
                                    borderColor: isDark
                                        ? 'rgba(255, 255, 255, 0.2)'
                                        : 'rgba(0, 0, 0, 0.12)',
                                }
                            ]}
                        >
                            {mainTabs.map((tab) => {
                                const isActive = activeTab === tab.key;
                                const showBadge = tab.key === 'CHATS' && unreadChatCount > 0;

                                return (
                                    <TabItemComponent
                                        key={tab.key}
                                        tab={tab}
                                        isActive={isActive}
                                        showBadge={showBadge}
                                        unreadCount={unreadChatCount}
                                        onPress={() => handlePress(tab.key)}
                                    />
                                );
                            })}
                        </View>
                    </BlurView>
                </View>

                {/* Search button container (separate) */}
                <View style={styles.searchWrapper}>
                    <BlurView
                        intensity={60}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.searchBlurContainer}
                    >
                        <View
                            style={[
                                styles.searchContainer,
                                {
                                    backgroundColor: isDark
                                        ? 'rgba(60, 60, 67, 0.4)'
                                        : 'rgba(255, 255, 255, 0.7)',
                                    borderColor: isDark
                                        ? 'rgba(255, 255, 255, 0.2)'
                                        : 'rgba(0, 0, 0, 0.12)',
                                }
                            ]}
                        >
                            <SearchButton isDark={isDark} />
                        </View>
                    </BlurView>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    tabBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    // Main tabs wrapper (4 tabs)
    mainTabsWrapper: {
        flex: 1,
        borderRadius: 26,
        overflow: 'hidden',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        // Elevation for Android
        elevation: 6,
    },
    blurContainer: {
        borderRadius: 26,
        overflow: 'hidden',
    },
    mainTabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 26,
        borderWidth: 1,
    },
    // Search button wrapper (separate circle)
    searchWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        // Elevation for Android
        elevation: 6,
    },
    searchBlurContainer: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    searchContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        position: 'relative',
        width: 28,
        height: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
        textAlign: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -10,
        backgroundColor: '#FF3B30',
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: 'bold',
    },
});
