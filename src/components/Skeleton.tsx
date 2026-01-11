import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

// Single Skeleton Item with shimmer effect
export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
    const { isDark } = useTheme();
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const shimmerAnimation = Animated.loop(
            Animated.timing(shimmerValue, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        );
        shimmerAnimation.start();
        return () => shimmerAnimation.stop();
    }, []);

    const translateX = shimmerValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    const backgroundColor = isDark ? '#2D2D2D' : '#E5E7EB';
    const shimmerColors = isDark
        ? ['transparent', 'rgba(255,255,255,0.05)', 'transparent']
        : ['transparent', 'rgba(255,255,255,0.5)', 'transparent'];

    return (
        <View
            style={[
                {
                    width: width as any,
                    height,
                    borderRadius,
                    backgroundColor,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    transform: [{ translateX }],
                }}
            >
                <LinearGradient
                    colors={shimmerColors as any}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
}

// Skeleton for Chat List Item
export function ChatItemSkeleton() {
    const { isDark, colors } = useTheme();

    return (
        <View style={[styles.chatItem, { backgroundColor: colors.background }]}>
            {/* Avatar */}
            <Skeleton width={52} height={52} borderRadius={26} />

            {/* Content */}
            <View style={styles.chatContent}>
                {/* Name & Time row */}
                <View style={styles.chatHeader}>
                    <Skeleton width={120} height={18} borderRadius={4} />
                    <Skeleton width={40} height={14} borderRadius={4} />
                </View>

                {/* Last message */}
                <Skeleton width="80%" height={16} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
}

// Skeleton for Chat List (multiple items)
interface ChatListSkeletonProps {
    count?: number;
}

export function ChatListSkeleton({ count = 8 }: ChatListSkeletonProps) {
    return (
        <View style={styles.listContainer}>
            {Array.from({ length: count }).map((_, index) => (
                <ChatItemSkeleton key={index} />
            ))}
        </View>
    );
}

// Skeleton for Message Bubble
export function MessageSkeleton({ isMe = false }: { isMe?: boolean }) {
    const { isDark } = useTheme();

    return (
        <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageOther]}>
            {!isMe && <Skeleton width={32} height={32} borderRadius={16} style={{ marginRight: 8 }} />}
            <View style={{ flex: 1, alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <Skeleton
                    width={isMe ? 180 : 200}
                    height={40}
                    borderRadius={16}
                />
            </View>
        </View>
    );
}

// Skeleton for Message List
export function MessageListSkeleton({ count = 6 }: { count?: number }) {
    const messages = Array.from({ length: count }).map((_, i) => ({
        isMe: i % 3 === 0,
    }));

    return (
        <View style={styles.messageListContainer}>
            {messages.map((msg, index) => (
                <MessageSkeleton key={index} isMe={msg.isMe} />
            ))}
        </View>
    );
}

// Skeleton for Profile/Settings
export function ProfileSkeleton() {
    return (
        <View style={styles.profileContainer}>
            {/* Avatar */}
            <Skeleton width={80} height={80} borderRadius={40} style={{ alignSelf: 'center' }} />

            {/* Name */}
            <Skeleton width={150} height={24} borderRadius={6} style={{ alignSelf: 'center', marginTop: 16 }} />

            {/* Email/Phone */}
            <Skeleton width={200} height={16} borderRadius={4} style={{ alignSelf: 'center', marginTop: 8 }} />

            {/* Menu Items */}
            <View style={styles.profileMenu}>
                {[1, 2, 3, 4].map((_, index) => (
                    <View key={index} style={styles.menuItemSkeleton}>
                        <Skeleton width={28} height={28} borderRadius={6} />
                        <Skeleton width="60%" height={18} borderRadius={4} style={{ marginLeft: 12 }} />
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    listContainer: {
        flex: 1,
        paddingTop: 8,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    chatContent: {
        flex: 1,
        marginLeft: 12,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messageBubble: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 4,
        paddingHorizontal: 16,
    },
    messageMe: {
        justifyContent: 'flex-end',
    },
    messageOther: {
        justifyContent: 'flex-start',
    },
    messageListContainer: {
        flex: 1,
        paddingVertical: 16,
    },
    profileContainer: {
        padding: 20,
    },
    profileMenu: {
        marginTop: 24,
    },
    menuItemSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
});

export default Skeleton;
