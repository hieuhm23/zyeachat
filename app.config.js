module.exports = {
    expo: {
        name: "Zyea Chat",
        slug: "vinalive-chat",
        scheme: "zyeachat",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#667eea"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.zyea.chat",
            userInterfaceStyle: "automatic",
            infoPlist: {
                NSCameraUsageDescription: "Ứng dụng cần quyền camera để thực hiện cuộc gọi video.",
                NSMicrophoneUsageDescription: "Ứng dụng cần quyền microphone để gọi điện và gửi tin nhắn thoại.",
                NSPhotoLibraryUsageDescription: "Ứng dụng cần quyền truy cập thư viện ảnh để gửi hình ảnh.",
                NSPhotoLibraryAddUsageDescription: "Ứng dụng cần quyền lưu ảnh vào thư viện của bạn.",
                NSLocationWhenInUseUsageDescription: "Ứng dụng cần quyền vị trí để chia sẻ vị trí của bạn trong chat.",
                NSAppTransportSecurity: {
                    NSAllowsArbitraryLoads: true,
                    NSExceptionDomains: {
                        "data5g.site": {
                            NSExceptionAllowsInsecureHTTPLoads: true,
                            NSIncludesSubdomains: true,
                            NSRequiresCertificateTransparency: false
                        }
                    }
                }
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/icon.png",
                backgroundColor: "#667eea"
            },
            package: "com.zyea.chat",
            userInterfaceStyle: "automatic",
            permissions: [
                "android.permission.CAMERA",
                "android.permission.RECORD_AUDIO",
                "android.permission.READ_EXTERNAL_STORAGE",
                "android.permission.WRITE_EXTERNAL_STORAGE",
                "android.permission.MODIFY_AUDIO_SETTINGS",
                "android.permission.POST_NOTIFICATIONS",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION"
            ]
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            "expo-notifications",
            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 35,
                        targetSdkVersion: 35,
                        buildToolsVersion: "35.0.0",
                        enableProguardInReleaseBuilds: false,
                        enableShrinkResourcesInReleaseBuilds: false,
                        usesCleartextTraffic: true,
                        minSdkVersion: 24,
                        extraMavenRepos: ["https://jitpack.io"]
                    }
                }
            ],
            [
                "expo-av",
                {
                    microphonePermission: "Cho phép $(PRODUCT_NAME) ghi âm tin nhắn thoại."
                }
            ],
            [
                "expo-image-picker",
                {
                    photosPermission: "Cho phép $(PRODUCT_NAME) truy cập thư viện ảnh để gửi hình ảnh."
                }
            ],
            [
                "expo-location",
                {
                    locationWhenInUsePermission: "Cho phép $(PRODUCT_NAME) truy cập vị trí để chia sẻ trong chat."
                }
            ]
        ],
        // OTA updates disabled for Zyea Chat - update via new IPA builds
        updates: {
            enabled: false
        },
        extra: {
            // No EAS project - standalone app
        }
    }
};
