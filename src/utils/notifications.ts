import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
        // Get the token that uniquely identifies this device
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: "7244ecfc-4a54-4232-a0a3-e17d5039b55c" // Project ID from your app.json/eas.json
        })).data;
        console.log('Expo Push Token:', token);
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}

export async function schedulePushNotification(title: string, body: string, data = {}) {
    await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            data,
            sound: 'default',
        },
        trigger: null, // show immediately
    });
}

// ==================== BADGE MANAGEMENT ====================

/**
 * Lấy số badge hiện tại trên icon app
 * @returns Số badge hiện tại
 */
export async function getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
}

/**
 * Set số badge trên icon app
 * @param count - Số badge muốn hiển thị (0 để xóa badge)
 */
export async function setBadgeCount(count: number): Promise<boolean> {
    return await Notifications.setBadgeCountAsync(count);
}

/**
 * Tăng số badge lên 1 (khi có tin nhắn mới)
 */
export async function incrementBadge(): Promise<boolean> {
    const currentBadge = await getBadgeCount();
    return await setBadgeCount(currentBadge + 1);
}

/**
 * Tăng số badge theo số lượng cụ thể
 * @param amount - Số lượng muốn tăng thêm
 */
export async function incrementBadgeBy(amount: number): Promise<boolean> {
    const currentBadge = await getBadgeCount();
    return await setBadgeCount(currentBadge + amount);
}

/**
 * Giảm số badge đi 1 (khi đọc 1 tin nhắn)
 */
export async function decrementBadge(): Promise<boolean> {
    const currentBadge = await getBadgeCount();
    const newCount = Math.max(0, currentBadge - 1);
    return await setBadgeCount(newCount);
}

/**
 * Xóa badge (khi user đọc hết tin nhắn hoặc mở app)
 */
export async function clearBadge(): Promise<boolean> {
    return await setBadgeCount(0);
}
