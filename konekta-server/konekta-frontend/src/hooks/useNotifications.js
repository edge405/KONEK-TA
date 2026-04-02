import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../services/notifications";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 15000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to mark as read");
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to mark all as read");
    },
  });
}

export function useUnreadCount() {
  const { data } = useNotifications();
  const items = Array.isArray(data) ? data : data?.results ?? [];
  return items.filter((n) => !n.is_read).length;
}
