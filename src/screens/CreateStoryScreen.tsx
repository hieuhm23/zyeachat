import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image as RNImage, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL, createStory, getToken } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function CreateStoryScreen() {
    const navigation = useNavigation();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Pick image from gallery
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tiếp tục.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Take photo
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần quyền truy cập', 'Vui lòng cấp quyền camera để tiếp tục.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Handle Post Story
    const handlePostStory = async () => {
        if (!imageUri) return;

        try {
            setIsUploading(true);
            const token = await getToken();

            // 1. Upload Image
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                type: 'image/jpeg',
                name: 'story.jpg',
            } as any);

            const uploadRes = await fetch(`${API_URL}/api/upload/image`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const uploadData = await uploadRes.json();
            const mediaUrl = uploadData.url;

            // 2. Create Story API
            await createStory(mediaUrl, 'image', caption);

            Alert.alert('Thành công', 'Tin của bạn đã được đăng!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.log('Post story error:', error);
            Alert.alert('Lỗi', 'Không thể đăng tin. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    };

    if (!imageUri) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tạo tin</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.choiceContainer}>
                    <TouchableOpacity style={styles.choiceBtn} onPress={pickImage}>
                        <LinearGradient
                            colors={['#8B5CF6', '#EC4899']}
                            style={styles.gradientBtn}
                        >
                            <Ionicons name="images" size={32} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.choiceText}>Thư viện</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.choiceBtn} onPress={takePhoto}>
                        <LinearGradient
                            colors={['#3B82F6', '#10B981']}
                            style={styles.gradientBtn}
                        >
                            <Ionicons name="camera" size={32} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.choiceText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.choiceBtn} onPress={() => Alert.alert('Sắp ra mắt', 'Tính năng văn bản đang phát triển')}>
                        <LinearGradient
                            colors={['#F59E0B', '#EF4444']}
                            style={styles.gradientBtn}
                        >
                            <Ionicons name="text" size={32} color="#FFF" />
                        </LinearGradient>
                        <Text style={styles.choiceText}>Văn bản</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <StatusBar style="light" hidden />

            {/* Image Preview */}
            <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFillObject}
                contentFit="contain"
            />

            {/* Overlay Controls */}
            <View style={styles.editorOverlay}>
                {/* Top Bar */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => setImageUri(null)} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={28} color="#FFF" />
                    </TouchableOpacity>

                    <View style={styles.topRightTools}>
                        <TouchableOpacity style={styles.iconBtn}>
                            <MaterialIcons name="text-fields" size={26} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconBtn}>
                            <Ionicons name="happy-outline" size={26} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Bar */}
                <View style={styles.bottomBar}>
                    <TextInput
                        style={styles.captionInput}
                        placeholder="Thêm chú thích..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                    />

                    <TouchableOpacity
                        style={styles.postBtn}
                        onPress={handlePostStory}
                        disabled={isUploading}
                    >
                        <Text style={styles.postBtnText}>
                            {isUploading ? 'Đang đăng...' : 'Chia sẻ tin'}
                        </Text>
                        {!isUploading && <Ionicons name="chevron-forward" size={18} color="#FFF" />}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    closeBtn: {
        padding: 5,
    },
    choiceContainer: {
        flex: 1,
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 30,
        paddingHorizontal: 20,
        flexWrap: 'wrap',
        alignContent: 'center'
    },
    choiceBtn: {
        alignItems: 'center',
        marginBottom: 30
    },
    gradientBtn: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    choiceText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    editorOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 50,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    topRightTools: {
        flexDirection: 'row',
        gap: 20,
    },
    iconBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 20,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    captionInput: {
        flex: 1,
        minHeight: 44,
        maxHeight: 100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 10,
        color: '#FFF',
        fontSize: 16,
    },
    postBtn: {
        backgroundColor: '#0068FF',
        height: 44,
        paddingHorizontal: 20,
        borderRadius: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    postBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
