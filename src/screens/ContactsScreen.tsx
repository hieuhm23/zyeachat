import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Image,
    RefreshControl,
    Platform,
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

interface Contact {
    id: string;
    name: string;
    avatar?: string;
    status?: string;
    lastSeen?: string;
}

// Sort contacts by first letter
const sortContactsByLetter = (contacts: Contact[]) => {
    const sorted = [...contacts].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', 'vi')
    );

    const sections: { title: string; data: Contact[] }[] = [];
    let currentLetter = '';

    sorted.forEach(contact => {
        const firstLetter = (contact.name || '#')[0].toUpperCase();
        if (firstLetter !== currentLetter) {
            currentLetter = firstLetter;
            sections.push({ title: firstLetter, data: [] });
        }
        sections[sections.length - 1].data.push(contact);
    });

    return sections;
};

export default function ContactsScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

    const [contacts, setContacts] = useState<Contact[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadContacts = async () => {
        try {
            const users = await apiRequest<Contact[]>('/api/users');
            setContacts(users || []);
        } catch (error) {
            console.log('Load contacts error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadContacts().then(() => setRefreshing(false));
    }, []);

    // Filter contacts by search
    const filteredContacts = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    const sections = sortContactsByLetter(filteredContacts);

    const handleContactPress = (contact: Contact) => {
        navigation.navigate('ChatDetail', {
            partnerId: contact.id,
            userName: contact.name,
            avatar: contact.avatar,
        });
    };

    const renderContact = ({ item }: { item: Contact }) => (
        <TouchableOpacity
            style={[styles.contactItem, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}
            onPress={() => handleContactPress(item)}
            activeOpacity={0.7}
        >
            {item.avatar ? (
                <Image
                    source={{ uri: getAvatarUri(item.avatar, item.name) }}
                    style={styles.avatar}
                />
            ) : (
                <LinearGradient
                    colors={['#54A9EB', '#3B82F6']}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>
                        {item.name?.[0]?.toUpperCase()}
                    </Text>
                </LinearGradient>
            )}
            <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.contactStatus, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.status === 'online' ? 'Đang hoạt động' : 'Hoạt động gần đây'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderSectionHeader = (title: string) => (
        <View style={[styles.sectionHeader, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
        </View>
    );

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
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Danh bạ</Text>
                    <TouchableOpacity style={styles.addButton}>
                        <Ionicons name="add" size={28} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={[styles.searchBar, { backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="search" size={18} color={colors.placeholder} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Tìm kiếm"
                            placeholderTextColor={colors.placeholder}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#54A9EB" />
                </View>
            ) : (
                <FlatList
                    data={sections}
                    renderItem={({ item: section }) => (
                        <View>
                            {renderSectionHeader(section.title)}
                            {section.data.map(contact => (
                                <View key={contact.id}>
                                    {renderContact({ item: contact })}
                                </View>
                            ))}
                        </View>
                    )}
                    keyExtractor={(item) => item.title}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#54A9EB"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {searchText ? 'Không tìm thấy liên hệ' : 'Chưa có liên hệ nào'}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        width: '100%',
        paddingBottom: 4,
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
        fontSize: 34,
        fontWeight: 'bold',
    },
    addButton: {
        padding: 4,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 36,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 17,
    },
    listContent: {
        paddingTop: 8,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
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
    contactInfo: {
        flex: 1,
        marginLeft: 12,
    },
    contactName: {
        fontSize: 17,
        fontWeight: '400',
    },
    contactStatus: {
        fontSize: 14,
        marginTop: 2,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
