import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Platform,
    Switch,
    Image,
    SafeAreaView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { getCurrentUser } from '../utils/api';
import { getAvatarUri } from '../utils/media';

interface SettingsScreenProps {
    onLogout: () => void;
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { colors, isDark } = useTheme();
    const [user, setUser] = useState<any>(null);
    const [isActiveStatus, setIsActiveStatus] = useState(true);
    const [showHeaderInfo, setShowHeaderInfo] = useState(false);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        // Show header info when scrolled past 100px (profile section)
        setShowHeaderInfo(scrollY > 100);
    };

    useFocusEffect(
        React.useCallback(() => {
            loadUser();
        }, [])
    );

    const loadUser = async () => {
        try {
            const userData = await getCurrentUser();
            if (userData) {
                setUser(userData);
            }
        } catch (error) {
            console.log('Error loading user:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc chắn muốn đăng xuất?",
            [
                { text: "Hủy", style: "cancel" },
                { text: "Đăng xuất", style: "destructive", onPress: onLogout }
            ]
        );
    };

    const renderMenuItem = (icon: any, title: string, subtitle?: string, onPress?: () => void, rightElement?: React.ReactNode, isDestructive = false) => (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDestructive ? '#FEE2E2' : (isDark ? '#374151' : '#F3F4F6') }]}>
                    {icon}
                </View>
                <Text style={[styles.menuTitle, { color: isDestructive ? '#EF4444' : colors.text }]}>{title}</Text>
            </View>
            <View style={styles.menuRight}>
                {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
                {rightElement || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header Gradient Background */}
            <LinearGradient
                colors={colors.headerGradient}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.headerBackground}
            >
                {/* Decorative Circles - Only show in dark mode */}
                {isDark && (
                    <>
                        <View style={[styles.decorativeCircle, styles.circle1]} />
                        <View style={[styles.decorativeCircle, styles.circle2]} />
                        <View style={[styles.decorativeCircle, styles.circle3]} />
                    </>
                )}
            </LinearGradient>

            <SafeAreaView style={{ flex: 1 }}>
                {/* Header Bar */}
                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color={colors.text} />
                    </TouchableOpacity>

                    {/* Collapsed Header Info - shows when scrolled */}
                    {showHeaderInfo && (
                        <View style={styles.collapsedHeaderInfo}>
                            <Text style={[styles.collapsedName, { color: colors.text }]} numberOfLines={1}>
                                {user?.name || ''}
                            </Text>
                            <Text style={[styles.collapsedEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                                {user?.email || user?.phone || ''}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.scanButton} onPress={() => navigation.navigate('MyQRCode')}>
                        <Ionicons name="qr-code-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                >
                    {/* User Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: getAvatarUri(user?.avatar, user?.name || 'User') }}
                                style={styles.avatar}
                            />
                            <TouchableOpacity
                                style={styles.editAvatarBtn}
                                onPress={() => Linking.openURL('zyea://profile')}
                            >
                                <Ionicons name="camera" size={12} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.userName, { color: colors.text }]}>{user?.name || ''}</Text>
                        <Text style={[styles.department, { color: colors.textSecondary }]}>{user?.email || user?.phone || ''}</Text>
                    </View>

                    {/* Menu Group 1 */}
                    <View style={[styles.menuGroup, { backgroundColor: isDark ? colors.card : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB' }]}>
                        {renderMenuItem(
                            <Ionicons name="person-circle" size={20} color={colors.text} />,
                            "Hồ sơ thông tin",
                            undefined,
                            () => Linking.openURL('zyea://profile')
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="happy-outline" size={20} color={colors.text} />,
                            "Dòng trạng thái"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="ellipse" size={20} color={colors.text} />,
                            "Trạng thái hoạt động",
                            undefined,
                            undefined,
                            <View style={styles.statusToggle}>
                                <View style={[styles.statusDot, { backgroundColor: isActiveStatus ? '#22C55E' : '#9CA3AF' }]} />
                                <Text style={[styles.statusText, { color: colors.textSecondary }]}>{isActiveStatus ? 'Đang bật' : 'Tắt'}</Text>
                                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                            </View>
                        )}
                    </View>

                    {/* Menu Group 2 */}
                    <View style={[styles.menuGroup, { backgroundColor: isDark ? colors.card : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB', marginTop: 12 }]}>
                        {renderMenuItem(
                            <Ionicons name="folder-outline" size={20} color={colors.text} />,
                            "Thư mục tin nhắn"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="bookmark" size={20} color={colors.text} />,
                            "Tin nhắn lưu"
                        )}
                    </View>

                    {/* Menu Group 3 */}
                    <View style={[styles.menuGroup, { backgroundColor: isDark ? colors.card : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB', marginTop: 12 }]}>
                        {renderMenuItem(
                            <MaterialIcons name="devices" size={20} color={colors.text} />,
                            "Quản lý thiết bị"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="shield-checkmark" size={20} color={colors.text} />,
                            "Bảo mật & An toàn",
                            undefined,
                            () => navigation.navigate('SecuritySettings')
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="pie-chart-outline" size={20} color={colors.text} />,
                            "Quản lý tài nguyên"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="notifications" size={20} color={colors.text} />,
                            "Thông báo & âm thanh"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="color-palette-outline" size={20} color={colors.text} />,
                            "Giao diện",
                            "Hệ thống"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <MaterialCommunityIcons name="format-size" size={20} color={colors.text} />,
                            "Kích thước chữ"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="globe-outline" size={20} color={colors.text} />,
                            "Ngôn ngữ",
                            "Tiếng Việt"
                        )}
                    </View>

                    {/* Menu Group 4 */}
                    <View style={[styles.menuGroup, { backgroundColor: isDark ? colors.card : '#fff', borderColor: isDark ? '#374151' : '#E5E7EB', marginTop: 12 }]}>
                        {renderMenuItem(
                            <Ionicons name="chatbox-ellipses-outline" size={20} color={colors.text} />,
                            "Góp ý"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="help-circle-outline" size={20} color={colors.text} />,
                            "Hướng dẫn sử dụng"
                        )}
                        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
                        {renderMenuItem(
                            <Ionicons name="log-out-outline" size={20} color={colors.text} />,
                            "Đăng xuất",
                            undefined,
                            handleLogout
                        )}
                    </View>

                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        Zyea Chat v{Constants.expoConfig?.version || '1.0.0'} © 2026 Zyea Software.
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 200, // Background gradient height
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
        width: 300,
        height: 300,
        top: -120,
        right: -80,
    },
    circle2: {
        width: 200,
        height: 200,
        top: -60,
        right: 50,
    },
    circle3: {
        width: 150,
        height: 150,
        top: 20,
        left: -50,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
    },
    scanButton: {
        padding: 8,
    },
    collapsedHeaderInfo: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    collapsedName: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    collapsedEmail: {
        fontSize: 12,
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: '#fff',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4B5563',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    department: {
        fontSize: 13,
    },
    menuGroup: {
        marginHorizontal: 16,
        borderRadius: 16,
        overflow: 'hidden',
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        // Shadow for Android
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '400',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuSubtitle: {
        fontSize: 13,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 16, // Indent divider
    },
    statusToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        marginTop: 24,
        marginBottom: 10,
        opacity: 0.6,
    }
});
