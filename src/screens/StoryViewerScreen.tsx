import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, FlatList, Animated, TextInput, KeyboardAvoidingView, Keyboard, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getImageUrl, markStoryAsViewed, Story, getCurrentUser, getToken } from '../utils/api';
import { getSocket } from '../utils/socket';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const StoryPlayer = React.memo(({
    userGroup,
    isActive,
    onNextUser,
    onPrevUser,
    onClose,
    startFromEnd = false,
    insets
}: any) => {
    const userStories = userGroup.stories || [];
    const [currentStoryIndex, setCurrentStoryIndex] = useState(startFromEnd ? userStories.length - 1 : 0);
    const currentStory: Story = userStories[currentStoryIndex];

    const progressAnim = useRef(new Animated.Value(0)).current;

    const [replyText, setReplyText] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isActive) {
            if (startFromEnd) {
                setCurrentStoryIndex(userStories.length - 1);
            }
        }
    }, [isActive, startFromEnd, userStories.length]);

    useEffect(() => {
        if (!isActive) return;
        const showSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
            setIsPaused(true);
            setKeyboardVisible(true);
        });
        const hideSubscription = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
            setIsPaused(false);
            setKeyboardVisible(false);
            inputRef.current?.blur();
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, [isActive]);

    useEffect(() => {
        if (!isActive || !currentStory) return;
        progressAnim.setValue(0);
        let animation: Animated.CompositeAnimation;
        const startAnim = () => {
            animation = Animated.timing(progressAnim, {
                toValue: 1,
                duration: 5000,
                useNativeDriver: false,
            });
            animation.start(({ finished }) => {
                if (finished) {
                    handleNext();
                }
            });
        };
        if (!isPaused) {
            startAnim();
        }
        return () => {
            if (animation) animation.stop();
        };
    }, [currentStoryIndex, isActive, currentStory, isPaused]);

    useEffect(() => {
        if (isActive && currentStory && !currentStory.viewed) {
            markStoryAsViewed(currentStory.id).catch(err => console.log('Mark viewed error', err));
            currentStory.viewed = true;
            const allViewed = userStories.every((s: Story) => s.viewed);
            userGroup.allViewed = allViewed;
        }
    }, [currentStory, isActive]);

    const handleNext = () => {
        if (currentStoryIndex < userStories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
        } else {
            onNextUser();
        }
    };

    const handlePrev = () => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
        } else {
            onPrevUser();
        }
    };

    const handleSendMessage = async () => {
        if (!replyText.trim()) return;
        const textToSend = replyText.trim();
        setReplyText('');
        Keyboard.dismiss();

        try {
            const socket = getSocket();
            const currentUser = await getCurrentUser();
            if (socket && currentUser) {
                const receiverId = currentStory.userId;
                socket.emit('sendMessage', {
                    senderId: currentUser.id,
                    receiverId: receiverId,
                    message: textToSend,
                    type: 'text',
                    tempId: Date.now().toString(),
                    replyToStory: {
                        storyId: currentStory.id,
                        mediaUrl: currentStory.mediaUrl
                    }
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert("Lỗi", "Không thể kết nối máy chủ chat");
            }
        } catch (error) {
            console.log('Send reply error:', error);
        }
    };

    if (!currentStory) return <View style={[styles.container, { backgroundColor: '#000' }]} />;

    // --- FORCE PADDING ---
    // Make sure content is VERY visible above bottom edge
    // Base 50px + Safe Area Bottom. If safe area is 0 (some androids), we still have 50px.
    const bottomPadding = (insets.bottom || 20) + 40;

    // Top: Safe area + 10px buffer
    const topPadding = (insets.top > 0 ? insets.top : (Platform.OS === 'ios' ? 44 : 35)) + 10;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <Image
                source={{ uri: getImageUrl(currentStory.mediaUrl) }}
                style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000', zIndex: -1 }]}
                contentFit="contain"
            />

            {/* Header Overlay */}
            <View style={[styles.headerContainer, { paddingTop: topPadding }]}>
                {/* Progress Bar */}
                <View style={[styles.progressContainer, { marginBottom: 15 }]}>
                    {userStories.map((_: any, idx: number) => {
                        return (
                            <View key={idx} style={styles.progressBarBackground}>
                                {idx === currentStoryIndex ? (
                                    <Animated.View
                                        style={[
                                            styles.progressBarFill,
                                            {
                                                width: progressAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: ['0%', '100%']
                                                })
                                            }
                                        ]}
                                    />
                                ) : (
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: idx < currentStoryIndex ? '100%' : '0%' }
                                        ]}
                                    />
                                )}
                            </View>
                        );
                    })}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" style={{ marginRight: 10 }} />
                    </TouchableOpacity>
                    <Image source={{ uri: getImageUrl(currentStory.userAvatar) }} style={styles.avatar} />
                    <View>
                        <Text style={styles.userName}>{currentStory.userName}</Text>
                        <Text style={styles.time}>{new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Caption */}
            {currentStory.caption && (
                <View style={[styles.captionContainer, { bottom: bottomPadding + 60 }]}>
                    <Text style={styles.captionText}>{currentStory.caption}</Text>
                </View>
            )}

            {/* Tap Zones */}
            <View style={[styles.touchArea, { top: topPadding + 60, bottom: bottomPadding + 60 }]}>
                <TouchableOpacity
                    style={styles.leftTap}
                    onPress={() => {
                        if (keyboardVisible) Keyboard.dismiss();
                        else handlePrev();
                    }}
                />
                <TouchableOpacity
                    style={styles.rightTap}
                    onPress={() => {
                        if (keyboardVisible) Keyboard.dismiss();
                        else handleNext();
                    }}
                />
            </View>

            {/* Footer with Input */}
            <View style={[
                styles.footer,
                { paddingBottom: bottomPadding, paddingTop: 10 },
                keyboardVisible ? { marginBottom: 0, paddingBottom: 10 } : {}
            ]}>
                <View style={styles.replyInputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.replyInput}
                        placeholder="Gửi tin nhắn..."
                        placeholderTextColor="#DDD"
                        value={replyText}
                        onChangeText={setReplyText}
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                        onFocus={() => setIsPaused(true)}
                        onBlur={() => setIsPaused(false)}
                    />
                    <TouchableOpacity onPress={handleSendMessage}>
                        <Ionicons name="send" size={24} color="#FFF" style={{ opacity: replyText ? 1 : 0.5, marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>

                {!keyboardVisible && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity style={{ marginLeft: 15 }}>
                            <Ionicons name="heart-outline" size={30} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 15 }}>
                            <Ionicons name="paper-plane-outline" size={28} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
});

export default function StoryViewerScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { groupedStories, initialUserIndex = 0 } = route.params || {};
    const insets = useSafeAreaInsets();

    const flatListRef = useRef<FlatList>(null);
    const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
    const [backwardsNavigation, setBackwardsNavigation] = useState(false);

    useEffect(() => {
        if (initialUserIndex > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({ index: initialUserIndex, animated: false });
            }, 50);
        }
    }, [initialUserIndex]);

    const scrollToUser = (index: number, isBackwards: boolean = false) => {
        if (index >= 0 && index < groupedStories.length) {
            setBackwardsNavigation(isBackwards);
            setCurrentUserIndex(index);
            flatListRef.current?.scrollToIndex({ index, animated: true });
        } else if (index < 0) {
            // Already at start
        } else {
            // Finished all
            navigation.goBack();
        }
    };

    const renderItem = useCallback(({ item, index }: any) => {
        return (
            <View style={{ width, height }}>
                <StoryPlayer
                    userGroup={item}
                    isActive={index === currentUserIndex}
                    onNextUser={() => scrollToUser(index + 1, false)}
                    onPrevUser={() => {
                        if (index === 0) {
                        } else {
                            scrollToUser(index - 1, true);
                        }
                    }}
                    onClose={() => navigation.goBack()}
                    startFromEnd={index === currentUserIndex && backwardsNavigation}
                    insets={insets}
                />
            </View>
        );
    }, [currentUserIndex, backwardsNavigation, insets]);

    const onMomentumScrollEnd = (ev: any) => {
        const newIndex = Math.round(ev.nativeEvent.contentOffset.x / width);
        if (newIndex !== currentUserIndex) {
            setCurrentUserIndex(newIndex);
            setBackwardsNavigation(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <StatusBar style="light" hidden />
            <FlatList
                ref={flatListRef}
                data={groupedStories}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.userId}
                renderItem={renderItem}
                getItemLayout={(_, index) => ({
                    length: width,
                    offset: width * index,
                    index,
                })}
                onMomentumScrollEnd={onMomentumScrollEnd}
                onScrollToIndexFailed={info => {
                    const wait = new Promise(resolve => setTimeout(resolve, 500));
                    wait.then(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                    });
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 10,
        zIndex: 20
    },
    progressContainer: {
        flexDirection: 'row',
        height: 2,
        marginBottom: 12,
        gap: 4
    },
    progressBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 1,
        overflow: 'hidden',
        height: 2
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFF'
    },
    userInfo: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
    userName: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
    time: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginLeft: 8 },
    closeButton: { marginLeft: 'auto' },

    captionContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
        zIndex: 10
    },
    captionText: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },

    touchArea: {
        position: 'absolute',
        left: 0,
        right: 0,
        flexDirection: 'row',
        zIndex: 1
    },
    leftTap: { flex: 1 },
    rightTap: { flex: 1 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        zIndex: 30,
        backgroundColor: 'transparent' // Ensure transparent background so image shows through if needed
    },
    replyInputContainer: {
        flex: 1,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    replyInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 14,
        height: '100%'
    }
});
