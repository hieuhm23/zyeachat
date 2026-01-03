// Changelog - Thông tin các bản cập nhật Zyea Chat
// Thêm mục mới ở đầu mảng khi có bản cập nhật mới

export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.0.1",
        date: "03/01/2026",
        title: "CẬP NHẬT GIAO DIỆN",
        changes: [
            "🌙 Sửa lỗi Dark Mode cho header",
            "✨ Cập nhật branding Zyea Chat",
            "🔧 OTA Updates hoạt động ổn định",
        ]
    },
    {
        version: "1.0.0",
        date: "03/01/2026",
        title: "RA MẮT ZYEA CHAT",
        changes: [
            "🚀 Ra mắt ứng dụng Zyea Chat độc lập",
            "💬 Chat 1-1 và nhóm với giao diện đẹp",
            "📞 Hỗ trợ gọi thoại và video call",
            "🔔 Thông báo tin nhắn mới real-time",
            "🔄 Tự động cập nhật OTA không cần cài lại app",
        ]
    },
];

// Lấy changelog của phiên bản mới nhất
export const getLatestChangelog = (): ChangelogEntry | null => {
    return CHANGELOG.length > 0 ? CHANGELOG[0] : null;
};
