import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "../hooks/useNotifications";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Share2,
  CheckCheck,
} from "lucide-react";
import { timeAgo } from "../utils/formatters";

const iconMap = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  group_join: Users,
  share: Share2,
};

const colorMap = {
  like: "text-red-500 bg-red-50 dark:bg-red-950/30",
  comment: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
  follow: "text-green-500 bg-green-50 dark:bg-green-950/30",
  group_join: "text-purple-500 bg-purple-50 dark:bg-purple-950/30",
  share: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30",
};

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const notifications = Array.isArray(data)
    ? data
    : data?.results ?? [];

  const handleMarkAll = () => {
    markAll.mutate();
  };

  const handleMarkOne = (id) => {
    markAsRead.mutate(id);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notifications
        </h1>
        {notifications.some((n) => !n.is_read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAll}
            loading={markAll.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-1.5" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No notifications"
          description="You're all caught up! Check back later."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon =
              iconMap[notification.notification_type || notification.type] || Bell;
            const colorClass =
              colorMap[notification.notification_type || notification.type] ||
              "text-gray-500 bg-gray-50 dark:bg-gray-800";

            return (
              <Card
                key={notification.id}
                className={`flex items-start gap-3 cursor-pointer transition-colors ${
                  !notification.is_read
                    ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900"
                    : ""
                }`}
                onClick={() =>
                  !notification.is_read && handleMarkOne(notification.id)
                }
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {notification.message || notification.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-600 mt-1.5" />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
