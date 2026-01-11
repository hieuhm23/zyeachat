import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Image,
    RefreshControl,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../utils/api';
import { getAvatarUri } from '../utils/media';
import { LinearGradient } from 'expo-linear-gradient';

interface CallHistory {
    id: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar?: string;
    type: 'incoming' | 'outgoing' | 'missed';
    isVideo: boolean;
    timestamp: string;
    duration?: number;
}

export default function CallsScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [calls, setCalls] = useState<CallHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const loadCallHistory = async () => {
        try {
            // Giả lập data cuộc gọi - có thể thay bằng API thực
            const mockCalls: CallHistory[] = [
                {
                    id: '1',
                    partnerId: '1',
                    partnerName: 'Nguyễn Văn A',
                    type: 'outgoing',
                    isVideo: false,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: '2',
                    partnerId: '2',
                    partnerName: 'Trần Thị B',
                    type: 'missed',
                    isVideo: true,
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                },
                {
                    id: '3',
                    partnerId: '3',
                    partnerName: 'Lê Văn C',
                    type: 'incoming',
                    isVideo: false,
                    timestamp: new Date(Date.now() - 86400000).toISOString(),
                    duration: 185,
                },
            ];
            setCalls(mockCalls);
        } catch (error) {
            console.log('Load call history error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCallHistory();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCallHistory().then(() => setRefreshing(false));
    }, []);

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 86400000) {
            return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 604800000) {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return days[date.getDay()];
        } else {
            return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return '';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `(${mins}:${secs.toString().padStart(2, '0')})`;
    };

    const getCallIcon = (call: CallHistory) => {
        if (call.type === 'missed') {
            return { name: 'arrow-down-left', color: '#FF3B30' };
        } else if (call.type === 'incoming') {
            return { name: 'arrow-down-left', color: '#34C759' };
        } else {
            return { name: 'arrow-up-right', color: '#34C759' };
        }
    };

    const handleCall = (call: CallHistory, isVideo: boolean) => {
        navigation.navigate('Call', {
            partnerId: call.partnerId,
            userName: call.partnerName,
            avatar: call.partnerAvatar,
            isVideo: isVideo,
        });
    };

    const renderCall = ({ item }: { item: CallHistory }) => {
        const callIcon = getCallIcon(item);

        return (
            <TouchableOpacity
                style={[styles.callItem, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
                onPress={() => handleCall(item, item.isVideo)}
                activeOpacity={0.7}
            >
                {/* Avatar */}
                {item.partnerAvatar ? (
                    <Image
                        source={{ uri: getAvatarUri(item.partnerAvatar, item.partnerName) }}
                        style={styles.avatar}
                    />
                ) : (
                    <LinearGradient
                        colors={['#54A9EB', '#3B82F6']}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>
                            {item.partnerName?.[0]?.toUpperCase()}
                        </Text>
                    </LinearGradient>
                )}

                {/* Call Info */}
                <View style={styles.callInfo}>
                    <Text style={[
                        styles.callName,
                        { color: item.type === 'missed' ? '#FF3B30' : colors.text }
                    ]} numberOfLines={1}>
                        {item.partnerName}
                    </Text>
                    <View style={styles.callDetails}>
                        <Ionicons
                            name={callIcon.name as any}
                            size={14}
                            color={callIcon.color}
                        />
                        <Ionicons
                            name={item.isVideo ? 'videocam' : 'call'}
                            size={12}
                            color={colors.textSecondary}
                            style={{ marginLeft: 4 }}
                        />
                        <Text style={[styles.callType, { color: colors.textSecondary }]}>
                            {item.type === 'missed' ? 'Nhỡ' :
                                item.type === 'incoming' ? 'Đến' : 'Đi'}
                            {formatDuration(item.duration)}
                        </Text>
                    </View>
                </View>

                {/* Time & Action */}
                <View style={styles.callActions}>
                    <Text style={[styles.callTime, { color: colors.textSecondary }]}>
                        {formatTime(item.timestamp)}
                    </Text>
                    <TouchableOpacity
                        style={styles.callButton}
                        onPress={() => handleCall(item, false)}
                    >
                        <Ionicons name="call-outline" size={22} color="#54A9EB" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* Gradient Header */}
            <LinearGradient
                colors={colors.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.headerGradient}
            >
                {/* Decorative Circles - Only show in dark mode */}
                {isDark && (
                    <>
                        <View style={[styles.decorativeCircle, styles.circle1]} />
                        <View style={[styles.decorativeCircle, styles.circle2]} />
                    </>
                )}

                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
                        <Text style={[styles.editButton, { color: colors.primary }]}>
                            {isEditing ? 'Xong' : 'Sửa'}
                        </Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Cuộc gọi</Text>
                    <TouchableOpacity>
                        <Ionicons name="call" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Call List */}
            <FlatList
                data={calls}
                renderItem={renderCall}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="call-outline" size={64} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Chưa có cuộc gọi nào
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        width: '100%',
        paddingBottom: 8,
        overflow: 'hidden',
    },
    decorativeCircle: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: 'transparent',
    },
    circle1: {
        width: 250,
        height: 250,
        top: -100,
        right: -60,
    },
    circle2: {
        width: 180,
        height: 180,
        top: -40,
        left: -60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 10,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    editButton: {
        fontSize: 17,
    },
    listContent: {
        paddingTop: 8,
    },
    callItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    callInfo: {
        flex: 1,
        marginLeft: 12,
    },
    callName: {
        fontSize: 17,
        fontWeight: '400',
    },
    callDetails: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    callType: {
        fontSize: 14,
        marginLeft: 4,
    },
    callActions: {
        alignItems: 'flex-end',
    },
    callTime: {
        fontSize: 14,
        marginBottom: 4,
    },
    callButton: {
        padding: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 12,
    },
});
