export type AppNotification = {
  body: string;
  createdAt: string;
  id: string;
  readAt: string | null;
  title: string;
};

export type NotificationPreview = {
  items: AppNotification[];
  unreadCount: number;
};

export function getNotificationPreview(): NotificationPreview {
  return {
    items: [],
    unreadCount: 0
  };
}
