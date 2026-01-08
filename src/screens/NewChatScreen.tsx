import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    TextInput, FlatList, ActivityIndicator, Image, Keyboard, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { searchUsers, ChatUser } from '../utils/api';
import { COLORS } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getAvatarUri } from '../utils/media';
import { useTheme } from '../context/ThemeContext';

export default function NewChatScreen() {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialState, setInitialState] = useState(true);

    // Search debounce could be added here, but for now we search on submit or text change with delay
    useEffect(() => {
        if (!searchQuery.trim()) {
            setResults([]);
            setInitialState(true);
            return;
        }

        const delayDebounce = setTimeout(() => {
            handleSearch(searchQuery);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const handleSearch = async (query: string) => {
        setLoading(true);
        setInitialState(false);
        try {
            const users = await searchUsers(query);
            setResults(users);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleUserSelect = (user: ChatUser) => {
        navigation.navigate('ChatDetail', {
            conversationId: 'new', // Flag to indicate new chat or lookup needed
            partnerId: user.id,
            userName: user.name,
            avatar: getAvatarUri(user.avatar, user.name)
        });
    };

    const renderItem = ({ item }: { item: ChatUser }) => (
        <TouchableOpacity
            style={[styles.userItem, { borderBottomColor: colors.border }]}
            onPress={() => handleUserSelect(item)}
        >
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: getAvatarUri(item.avatar, item.name) }} style={styles.avatar} />
                ) : (
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.avatar}
                    >
                        <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
                    </LinearGradient>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                {/* Optional: Show email or status if available */}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            <LinearGradient
                colors={colors.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ paddingTop: insets.top }}
            >
                {/* Header */}
                <View style={[styles.header, { backgroundColor: 'transparent', borderBottomWidth: 0 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Tin nhắn mới</Text>
                </View>

                {/* Search Input */}
                <View style={[styles.searchContainer, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Tìm tên hoặc email..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <View style={{ flex: 1 }}>
                {loading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : results.length > 0 ? (
                    <FlatList
                        data={results}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
                        keyboardShouldPersistTaps="handled"
                    />
                ) : (
                    <View style={styles.centerContainer}>
                        {!initialState && searchQuery.length > 0 ? (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Không tìm thấy người dùng nào</Text>
                        ) : (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nhập tên bạn bè để tìm kiếm</Text>
                        )}
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20, // Rounded pill shape like ChatList
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        fontSize: 14,
    },
});
