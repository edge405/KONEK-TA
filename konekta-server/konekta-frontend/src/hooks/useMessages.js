import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markRead,
} from "../services/messaging";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: getConversations,
    refetchInterval: 10000,
  });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }) => sendMessage(conversationId, data),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to send message");
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation started!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to create conversation");
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
