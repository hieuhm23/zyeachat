import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    action?: {
        label: string;
        onPress: () => void;
    };
}

interface ToastProps extends ToastConfig {
    visible: boolean;
    onHide: () => void;
}

const TOAST_COLORS = {
    success: { bg: '#10B981', icon: 'checkmark-circle' },
    error: { bg: '#EF4444', icon: 'close-circle' },
    info: { bg: '#3B82F6', icon: 'information-circle' },
    warning: { bg: '#F59E0B', icon: 'warning' },
};

export default function Toast({ visible, message, type = 'success', duration = 3000, action, onHide }: ToastProps) {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Haptic Feedback
            const hapticType = type === 'error'
                ? Haptics.NotificationFeedbackType.Error
                : type === 'warning'
                    ? Haptics.NotificationFeedbackType.Warning
                    : Haptics.NotificationFeedbackType.Success;
            Haptics.notificationAsync(hapticType);

            // Slide in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 50,
                    friction: 8,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto hide
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onHide());
    };

    if (!visible) return null;

    const colorConfig = TOAST_COLORS[type];

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    top: insets.top + 10,
                    backgroundColor: colorConfig.bg,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <Ionicons name={colorConfig.icon as any} size={22} color="#fff" />
            <Text style={styles.message} numberOfLines={2}>{message}</Text>
            {action && (
                <TouchableOpacity onPress={action.onPress} style={styles.actionButton}>
                    <Text style={styles.actionText}>{action.label}</Text>
                </TouchableOpacity>
            )}
            <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 9999,
    },
    message: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        fontWeight: '500',
        marginLeft: 10,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 6,
        marginRight: 8,
    },
    actionText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
});

// Toast Manager Hook
import { useState, useCallback } from 'react';

export function useToast() {
    const [toastConfig, setToastConfig] = useState<ToastConfig & { visible: boolean }>({
        visible: false,
        message: '',
        type: 'success',
        duration: 3000,
    });

    const showToast = useCallback((config: ToastConfig) => {
        setToastConfig({ ...config, visible: true });
    }, []);

    const hideToast = useCallback(() => {
        setToastConfig(prev => ({ ...prev, visible: false }));
    }, []);

    const success = useCallback((message: string, options?: Partial<ToastConfig>) => {
        showToast({ message, type: 'success', ...options });
    }, [showToast]);

    const error = useCallback((message: string, options?: Partial<ToastConfig>) => {
        showToast({ message, type: 'error', ...options });
    }, [showToast]);

    const info = useCallback((message: string, options?: Partial<ToastConfig>) => {
        showToast({ message, type: 'info', ...options });
    }, [showToast]);

    const warning = useCallback((message: string, options?: Partial<ToastConfig>) => {
        showToast({ message, type: 'warning', ...options });
    }, [showToast]);

    return {
        toastConfig,
        showToast,
        hideToast,
        success,
        error,
        info,
        warning,
        Toast: () => (
            <Toast
                visible={toastConfig.visible}
                message={toastConfig.message}
                type={toastConfig.type}
                duration={toastConfig.duration}
                action={toastConfig.action}
                onHide={hideToast}
            />
        ),
    };
}
