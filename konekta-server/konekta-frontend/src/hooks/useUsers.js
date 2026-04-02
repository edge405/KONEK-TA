import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getUser,
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowing,
  toggleBlock,
  search,
} from "../services/users";

export function useUser(id) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => toggleFollow(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["followStatus", userId] });
      queryClient.invalidateQueries({ queryKey: ["followers"] });
      queryClient.invalidateQueries({ queryKey: ["following"] });
      toast.success("Follow status updated!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.detail || "Failed to update follow status"
      );
    },
  });
}

export function useFollowStatus(userId) {
  return useQuery({
    queryKey: ["followStatus", userId],
    queryFn: () => getFollowStatus(userId),
    enabled: !!userId,
  });
}

export function useFollowers() {
  return useQuery({
    queryKey: ["followers"],
    queryFn: () => getFollowers(),
  });
}

export function useFollowing() {
  return useQuery({
    queryKey: ["following"],
    queryFn: () => getFollowing(),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId) => toggleBlock(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Block status updated!");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.detail || "Failed to update block status"
      );
    },
  });
}

export function useSearch(query) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => search(query),
    enabled: !!query && query.length >= 2,
  });
}
