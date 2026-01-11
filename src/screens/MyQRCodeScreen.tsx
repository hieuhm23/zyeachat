import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Dimensions, Alert, StatusBar } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { getCurrentUser } from '../utils/api';
import { getAvatarUri } from '../utils/media';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function MyQRCodeScreen() {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await getCurrentUser();
            if (userData) {
                setUser(userData);
            }
        } catch (error) {
            console.log('Load user QR error:', error);
        }
    };

    const qrValue = user ? `zyea://user/${user.id}` : 'zyea://loading';

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Kết bạn với tôi trên Zyea Chat nhé! ${qrValue}`,
                url: qrValue,
                title: 'QR Code Zyea Chat của tôi'
            });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text }}>Đang tải...</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: 'transparent' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: '#FFF' }]}>Mã QR của tôi</Text>
                <TouchableOpacity style={styles.scanButton}>
                    <Ionicons name="scan" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Gradient Background */}
            <LinearGradient
                colors={['#4F46E5', '#3B82F6', '#06B6D4']}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.content}>
                <View style={styles.cardContainer}>
                    {/* QR Card */}
                    <View style={styles.card}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={{ uri: getAvatarUri(user.avatar, user.name) }}
                                style={styles.avatar}
                            />
                        </View>

                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userBio}>Quét mã QR để thêm bạn với tôi</Text>

                        <View style={styles.qrContainer}>
                            <QRCode
                                value={qrValue}
                                size={200}
                                color="#000"
                                backgroundColor="#FFF"
                                logo={{ uri: getAvatarUri(user.avatar, user.name) }}
                                logoSize={40}
                                logoBackgroundColor='transparent'
                            />
                        </View>

                        <Text style={styles.copyright}>Zyea Chat</Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="share-social" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.actionText}>Chia sẻ QR</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="download-outline" size={24} color="#4F46E5" />
                            </View>
                            <Text style={styles.actionText}>Lưu về máy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
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
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingHorizontal: 20,
        paddingBottom: 20,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 5,
    },
    scanButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardContainer: {
        width: width * 0.85,
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'absolute',
        top: -40,
        padding: 4,
        backgroundColor: '#FFF',
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    userName: {
        marginTop: 40,
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    userBio: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
    },
    qrContainer: {
        padding: 10,
        backgroundColor: '#FFF',
    },
    copyright: {
        marginTop: 20,
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        gap: 20,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    }
});
