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
} from "../services/groups";

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
