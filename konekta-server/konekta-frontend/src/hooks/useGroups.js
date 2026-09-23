import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getGroups,
  getGroup,
  createGroup,
  joinGroup,
  leaveGroup,
  getGroupMembers,
  getGroupPosts,
  getInvitations,
  acceptInvitation,
  declineInvitation,
  createInvitation,
} from "../services/groups";
import { getGroupChat, sendGroupMessage } from "../services/messaging";

export function useGroups(search = "") {
  return useQuery({
    queryKey: ["groups", search],
    queryFn: () => getGroups(1, search),
  });
}

export function useGroup(id) {
  return useQuery({
    queryKey: ["group", id],
    queryFn: () => getGroup(id),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to create group");
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => joinGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      toast.success("Joined group successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to join group");
    },
  });
}

export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => leaveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
      toast.success("Left group successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to leave group");
    },
  });
}

export function useGroupMembers(id) {
  return useQuery({
    queryKey: ["groupMembers", id],
    queryFn: () => getGroupMembers(id),
    enabled: !!id,
  });
}

export function useGroupPosts(id) {
  return useQuery({
    queryKey: ["groupPosts", id],
    queryFn: () => getGroupPosts(id),
    enabled: !!id,
  });
}

export function useGroupChat(groupId) {
  return useQuery({
    queryKey: ["groupChat", groupId],
    queryFn: () => getGroupChat(groupId),
    enabled: !!groupId,
  });
}

export function useSendGroupMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }) => sendGroupMessage(groupId, data),
    onSuccess: (newMessage, { groupId }) => {
      queryClient.setQueryData(["groupChat", groupId], (oldData) => {
        if (!oldData) return [newMessage];
        if (Array.isArray(oldData)) {
          if (oldData.some((m) => m.id === newMessage.id)) return oldData;
          return [...oldData, newMessage];
        }
        const results = oldData.results || [];
        if (results.some((m) => m.id === newMessage.id)) return oldData;
        return {
          ...oldData,
          count: (oldData.count || results.length) + 1,
          results: [...results, newMessage],
        };
      });
    },
    onError: () => {
      toast.error("Failed to send group message");
    },
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["groupInvitations"],
    queryFn: () => getInvitations(),
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => acceptInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvitations"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Invitation accepted! You joined the group.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to accept invitation");
    },
  });
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => declineInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvitations"] });
      toast.success("Invitation declined.");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to decline invitation");
    },
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groupInvitations"] });
      toast.success("Invitation sent successfully!");
    },
    onError: (error) => {
      const err =
        error.response?.data?.invitee?.[0] ||
        error.response?.data?.group?.[0] ||
        error.response?.data?.detail ||
        "Failed to send invitation";
      toast.error(err);
    },
  });
}


