import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    ActivityIndicator,
    StatusBar,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getConversations, apiRequest } from '../utils/api';
import { getAvatarUri } from '../utils/media';
import { useTheme } from '../context/ThemeContext';

interface User {
    id: string;
    name: string;
    avatar?: string;
}

export default function CreateGroupScreen() {
    const navigation = useNavigation<any>();
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [contacts, setContacts] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const conversations = await getConversations();

            const uniqueUsers: User[] = [];
            const seenIds = new Set<string>();

            conversations.forEach((conv: any) => {
                const partnerId = conv.partner_id || conv.partnerId;
                const partnerName = conv.name || conv.partnerName || conv.partner_name || 'Người dùng';
                const partnerAvatar = conv.avatar || conv.partnerAvatar || conv.partner_avatar;

                if (partnerId && !seenIds.has(partnerId)) {
                    seenIds.add(partnerId);
                    uniqueUsers.push({
                        id: partnerId,
                        name: partnerName,
                        avatar: partnerAvatar
                    });
                }
            });

            setContacts(uniqueUsers);
        } catch (error) {
            console.error('Load contacts error:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (user: User) => {
        const isSelected = selectedUsers.some(u => u.id === user.id);
        if (isSelected) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập tên nhóm');
            return;
        }
        if (selectedUsers.length < 1) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 thành viên');
            return;
        }

        try {
            setCreating(true);
            const response = await apiRequest('/api/groups', {
                method: 'POST',
                body: JSON.stringify({
                    name: groupName.trim(),
                    memberIds: selectedUsers.map(u => u.id)
                })
            }) as { error?: string; id?: string; name?: string; avatar?: string; members?: any[] };

            if (response.error) {
                Alert.alert('Lỗi', response.error);
                return;
            }

            if (!response.id) {
                Alert.alert('Lỗi', 'Không nhận được ID nhóm từ server');
                return;
            }

            navigation.replace('ChatDetail', {
                conversationId: undefined,
                partnerId: undefined,
                groupId: response.id,
                userName: response.name || groupName.trim(),
                avatar: response.avatar || null,
                isGroup: true,
                members: response.members || selectedUsers
            });

        } catch (error: any) {
            console.error('Create group error:', error);
            const errorMessage = error?.message || 'Không thể tạo nhóm. Vui lòng thử lại.';
            Alert.alert('Lỗi', errorMessage);
        } finally {
            setCreating(false);
        }
    };

    const filteredContacts = contacts.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderUserItem = ({ item }: { item: User }) => {
        const isSelected = selectedUsers.some(u => u.id === item.id);

        return (
            <TouchableOpacity
                style={[styles.userItem, { borderBottomColor: colors.border }]}
                onPress={() => toggleUserSelection(item)}
                activeOpacity={0.7}
            >
                <View style={styles.userInfo}>
                    {item.avatar ? (
                        <Image
                            source={{ uri: getAvatarUri(item.avatar, item.name) }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                                {item.name?.[0]?.toUpperCase() || '?'}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.userName, { color: colors.text }]}>{item.name}</Text>
                </View>

                <View style={[styles.checkbox, isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }, !isSelected && { borderColor: colors.border }]}>
                    {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Gradient Header */}
            <LinearGradient
                colors={colors.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={{ paddingTop: insets.top }}
            >
                <View style={[styles.header, { borderBottomColor: 'transparent' }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Tạo nhóm mới</Text>
                    <TouchableOpacity
                        style={[
                            styles.createButton,
                            { backgroundColor: colors.primary },
                            (!groupName.trim() || selectedUsers.length < 1) && styles.createButtonDisabled
                        ]}
                        onPress={handleCreateGroup}
                        disabled={!groupName.trim() || selectedUsers.length < 1 || creating}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.createButtonText}>Tạo</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Group Name Input */}
                <View style={[styles.groupNameSection, { borderBottomColor: colors.border }]}>
                    <View style={[styles.groupIconContainer, { backgroundColor: isDark ? colors.card : '#E8F4FF' }]}>
                        <Ionicons name="people" size={28} color={colors.primary} />
                    </View>
                    <TextInput
                        style={[styles.groupNameInput, { color: colors.text }]}
                        placeholder="Tên nhóm"
                        placeholderTextColor={colors.textSecondary}
                        value={groupName}
                        onChangeText={setGroupName}
                        maxLength={50}
                    />
                </View>

                {/* Selected Users */}
                {selectedUsers.length > 0 && (
                    <View style={[styles.selectedSection, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                            Đã chọn ({selectedUsers.length})
                        </Text>
                        <FlatList
                            horizontal
                            data={selectedUsers}
                            keyExtractor={item => item.id}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.selectedList}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.selectedUser}
                                    onPress={() => toggleUserSelection(item)}
                                >
                                    {item.avatar ? (
                                        <Image
                                            source={{ uri: getAvatarUri(item.avatar, item.name) }}
                                            style={styles.selectedAvatar}
                                        />
                                    ) : (
                                        <View style={[styles.selectedAvatar, styles.avatarPlaceholder]}>
                                            <Text style={styles.avatarTextSmall}>
                                                {item.name?.[0]?.toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.removeButton}>
                                        <Ionicons name="close" size={12} color="#fff" />
                                    </View>
                                    <Text style={[styles.selectedName, { color: colors.text }]} numberOfLines={1}>
                                        {item.name.split(' ').pop()}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Search */}
                <View style={styles.searchSection}>
                    <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground }]}>
                        <Ionicons name="search" size={20} color={colors.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: colors.text }]}
                            placeholder="Tìm kiếm liên hệ..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Contacts List */}
                <View style={styles.contactsSection}>
                    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Liên hệ gần đây</Text>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : filteredContacts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {searchQuery ? 'Không tìm thấy liên hệ' : 'Chưa có liên hệ nào'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredContacts}
                            keyExtractor={item => item.id}
                            renderItem={renderUserItem}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.contactsList}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    createButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.5
    },
    createButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    groupNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 8,
    },
    groupIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    groupNameInput: {
        flex: 1,
        fontSize: 17,
        paddingVertical: 8,
    },
    selectedSection: {
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '500',
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    selectedList: {
        paddingHorizontal: 12,
    },
    selectedUser: {
        alignItems: 'center',
        marginHorizontal: 6,
        width: 60,
    },
    selectedAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    removeButton: {
        position: 'absolute',
        top: 0,
        right: 6,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#ff4444',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    selectedName: {
        fontSize: 12,
        marginTop: 4,
        textAlign: 'center',
    },
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 40,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        marginLeft: 8,
    },
    contactsSection: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: {
        fontSize: 15,
        marginTop: 12,
    },
    contactsList: {
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: '#A0AEC0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    avatarTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
