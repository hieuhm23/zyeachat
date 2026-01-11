import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { apiRequest, removeToken } from '../utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';

export default function SecuritySettingsScreen() {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();

    // Change Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    // Delete Account State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setIsLoading(true);
            await apiRequest('/api/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể đổi mật khẩu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            Alert.alert('Yêu cầu', 'Vui lòng nhập mật khẩu để xác nhận xóa tài khoản');
            return;
        }

        Alert.alert(
            'Cảnh báo cực kỳ quan trọng',
            'Hành động này sẽ XÓA VĨNH VIỄN tài khoản và toàn bộ tin nhắn, dữ liệu của bạn. Bạn KHÔNG THỂ khôi phục lại được. Bạn có chắc chắn muốn tiếp tục?',
            [
                { text: 'Hủy bỏ', style: 'cancel' },
                {
                    text: 'XÓA VĨNH VIỄN',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setIsLoading(true);
                            await apiRequest('/api/auth/account', {
                                method: 'DELETE',
                                body: JSON.stringify({
                                    password: deletePassword,
                                    reason: 'User requested deletion'
                                })
                            });

                            Alert.alert('Đã xóa', 'Tài khoản đã được xóa. Ứng dụng sẽ khởi động lại.', [
                                {
                                    text: 'OK',
                                    onPress: async () => {
                                        await removeToken();
                                        try {
                                            await Updates.reloadAsync();
                                        } catch (e) {
                                            // Fallback for dev client where reloadAsync might fail
                                            console.log('Reload error', e);
                                        }
                                    }
                                }
                            ]);
                        } catch (error: any) {
                            Alert.alert('Lỗi', error.message || 'Không thể xóa tài khoản');
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#374151' : '#E5E7EB' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Bảo mật & An toàn</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Change Password Section */}
                <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF' }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="key-outline" size={24} color="#4F46E5" />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Đổi mật khẩu</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu hiện tại</Text>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                secureTextEntry={!showCurrentPass}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Nhập mật khẩu cũ"
                                placeholderTextColor={colors.placeholder}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)}>
                                <Ionicons name={showCurrentPass ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Mật khẩu mới</Text>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                secureTextEntry={!showNewPass}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Tối thiểu 6 ký tự"
                                placeholderTextColor={colors.placeholder}
                            />
                            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                                <Ionicons name={showNewPass ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.textSecondary }]}>Xác nhận mật khẩu mới</Text>
                        <View style={[styles.inputContainer, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                secureTextEntry={!showNewPass}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Nhập lại mật khẩu mới"
                                placeholderTextColor={colors.placeholder}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#4F46E5', opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleChangePassword}
                        disabled={isLoading}
                    >
                        {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Cập nhật mật khẩu</Text>}
                    </TouchableOpacity>
                </View>

                {/* Login Activity (Placeholder) */}
                <View style={[styles.section, { backgroundColor: isDark ? colors.card : '#FFF', marginTop: 20 }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="phone-portrait-outline" size={24} color="#10B981" />
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Thiết bị đăng nhập</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
                        Tính năng đang phát triển.
                    </Text>
                </View>

                {/* Delete Account Section */}
                <View style={[styles.section, { backgroundColor: isDark ? '#451a1a' : '#FEF2F2', marginTop: 40, borderColor: '#EF4444', borderWidth: 1 }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="warning-outline" size={24} color="#EF4444" />
                        <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>Vùng nguy hiểm</Text>
                    </View>

                    <Text style={{ color: isDark ? '#FECACA' : '#991B1B', marginBottom: 16, lineHeight: 20 }}>
                        Khi xóa tài khoản, toàn bộ tin nhắn, hình ảnh và danh bạ sẽ bị xóa vĩnh viễn và không thể khôi phục.
                    </Text>

                    {!showDeleteConfirm ? (
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: '#EF4444' }]}
                            onPress={() => setShowDeleteConfirm(true)}
                        >
                            <Text style={styles.buttonText}>Xóa tài khoản</Text>
                        </TouchableOpacity>
                    ) : (
                        <View>
                            <TextInput
                                style={[styles.inputContainer, { backgroundColor: '#FFF', paddingHorizontal: 12, marginBottom: 12, color: '#000' }]}
                                secureTextEntry
                                placeholder="Nhập mật khẩu để xác nhận"
                                value={deletePassword}
                                onChangeText={setDeletePassword}
                            />
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    style={[styles.button, { flex: 1, backgroundColor: '#6B7280' }]}
                                    onPress={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                                >
                                    <Text style={styles.buttonText}>Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, { flex: 1, backgroundColor: '#EF4444' }]}
                                    onPress={handleDeleteAccount}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.buttonText}>XÓA VĨNH VIỄN</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 15,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: { padding: 8 },
    content: { padding: 16 },
    section: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        height: 48,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    button: {
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
