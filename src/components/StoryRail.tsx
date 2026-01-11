import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAvatarUri } from '../utils/media';
import { getStories, Story, getImageUrl } from '../utils/api';

interface StoryRailProps {
    currentUser?: any;
    onPressCreate?: () => void;
}

export default function StoryRail({ currentUser, onPressCreate }: StoryRailProps) {
    const { colors, isDark } = useTheme();
    const navigation = useNavigation<any>();
    const [stories, setStories] = useState<Story[]>([]);

    const loadStories = async () => {
        try {
            const data = await getStories();
            setStories(data);
        } catch (error) {
            console.log('Error loading stories:', error);
        }
    };

    // Reload stories when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            loadStories();
        }, [])
    );

    // Group stories by User
    const groupedStories = React.useMemo(() => {
        const groups: any[] = [];
        const userMap = new Map();

        stories.forEach(story => {
            if (!userMap.has(story.userId)) {
                const newGroup = {
                    userId: story.userId,
                    userName: story.userName,
                    userAvatar: story.userAvatar,
                    stories: [],
                    allViewed: true,
                    latestStoryTime: story.createdAt
                };
                userMap.set(story.userId, newGroup);
                groups.push(newGroup);
            }
            const group = userMap.get(story.userId);
            group.stories.push(story);
            if (!story.viewed) group.allViewed = false;
        });

        // Sort stories in each group by time ASC (Oldest -> Newest) for correct playback
        groups.forEach(group => {
            group.stories.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        });

        return groups;
    }, [stories]);

    const handlePressStory = (groupIndex: number) => {
        navigation.navigate('StoryViewer', {
            groupedStories: groupedStories,
            initialUserIndex: groupIndex
        });
    };

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Create Story Item */}
                <TouchableOpacity style={styles.itemContainer} onPress={onPressCreate}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{ uri: getAvatarUri(currentUser?.avatar, currentUser?.name) }}
                            style={[styles.avatar, { opacity: 0.8, borderColor: colors.border }]}
                        />
                        <View style={[styles.createBadge, { borderColor: colors.background }]}>
                            <Ionicons name="add" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                    <Text style={[styles.name, { color: isDark ? '#E5E7EB' : '#333' }]}>Tạo tin</Text>
                </TouchableOpacity>

                {/* 2. Friends Stories (Grouped) */}
                {groupedStories.map((group, index) => (
                    <TouchableOpacity
                        key={group.userId}
                        style={styles.itemContainer}
                        onPress={() => handlePressStory(index)}
                    >
                        <View style={styles.avatarBorderWrapper}>
                            {/* Gradient border for unviewed stories */}
                            {!group.allViewed ? (
                                <LinearGradient
                                    colors={['#0068FF', '#A855F7']} // Zalo Blue to Purple
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.gradientBorder}
                                >
                                    <View style={[styles.whiteBorder, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                                        <Image
                                            source={{ uri: getImageUrl(group.userAvatar) || getAvatarUri(undefined, group.userName) }}
                                            style={styles.storyAvatar}
                                        />
                                    </View>
                                </LinearGradient>
                            ) : (
                                // Gray border for viewed stories
                                <View style={[styles.viewedBorder, { borderColor: isDark ? '#444' : '#E5E7EB' }]}>
                                    <View style={[styles.whiteBorderItem, { backgroundColor: isDark ? '#000' : '#fff' }]}>
                                        <Image
                                            source={{ uri: getImageUrl(group.userAvatar) || getAvatarUri(undefined, group.userName) }}
                                            style={styles.storyAvatar}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.name,
                                {
                                    color: isDark ? '#E5E7EB' : '#333',
                                    fontWeight: !group.allViewed ? '600' : '400'
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {group.userName}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    itemContainer: {
        alignItems: 'center',
        marginRight: 16,
        width: 68,
    },
    avatarWrapper: {
        width: 56,
        height: 56,
        borderRadius: 28,
        position: 'relative',
        marginBottom: 6,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    createBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#0068FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    // Story Styles
    avatarBorderWrapper: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    gradientBorder: {
        width: 58,
        height: 58,
        borderRadius: 29,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewedBorder: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whiteBorder: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    whiteBorderItem: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storyAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    name: {
        fontSize: 11,
        textAlign: 'center',
        width: '100%',
    },
});
