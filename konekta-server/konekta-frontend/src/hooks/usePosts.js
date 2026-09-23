import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getPosts,
  getPost,
  createPost,
  toggleLike,
  sharePost,
  getComments,
  addComment,
  deleteComment,
  hidePost,
  unhidePost,
  toggleBookmark,
  getBookmarks,
} from "../services/posts";

export function usePosts(filters = {}) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", filters],
    queryFn: ({ pageParam = 1 }) => getPosts(pageParam, filters),
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next, window.location.origin);
        return parseInt(url.searchParams.get("page"), 10);
      }
      return undefined;
    },
  });

  const posts = data?.pages.flatMap((page) => page.results ?? page) ?? [];

  return { posts, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage };
}

export function usePost(id) {
  return useQuery({
    queryKey: ["post", id],
    queryFn: () => getPost(id),
    enabled: !!id,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createPost(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (variables?.group) {
        queryClient.invalidateQueries({ queryKey: ["groupPosts", variables.group] });
      }
      toast.success("Post created successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to create post");
    },
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => toggleLike(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPosts = queryClient.getQueryData(["posts"]);

      queryClient.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            results: (page.results ?? page).map((post) =>
              post.id === postId
                ? {
                    ...post,
                    is_liked: !post.is_liked,
                    likes_count: post.is_liked
                      ? post.likes_count - 1
                      : post.likes_count + 1,
                  }
                : post
            ),
          })),
        };
      });

      return { previousPosts };
    },
    onError: (error, _postId, context) => {
      if (context?.previousPosts) {
        queryClient.setQueriesData(
          { queryKey: ["posts"] },
          context.previousPosts
        );
      }
      toast.error(error.response?.data?.detail || "Failed to update like");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSharePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => sharePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post shared successfully!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to share post");
    },
  });
}

export function useComments(postId) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => getComments(postId),
    enabled: !!postId,
  });
}

export function useAddComment(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content) => addComment(postId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment added!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to add comment");
    },
  });
}

export function useDeleteComment(postId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Comment deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || "Failed to delete comment");
    },
  });
}

export function useHidePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => hidePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to hide post");
    },
  });
}

export function useUnhidePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => unhidePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unhide post");
    },
  });
}

export function useBookmarks() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["bookmarks"],
    queryFn: ({ pageParam = 1 }) => getBookmarks(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage?.next) {
        const url = new URL(lastPage.next, window.location.origin);
        return parseInt(url.searchParams.get("page"), 10);
      }
      return undefined;
    },
  });

  const posts = data?.pages.flatMap((page) => page.results ?? page) ?? [];

  return { posts, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage };
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId) => toggleBookmark(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });

      const updatePostInPages = (old) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            results: (page.results ?? page).map((post) =>
              post.id === postId
                ? {
                    ...post,
                    is_bookmarked: !post.is_bookmarked,
                  }
                : post
            ),
          })),
        };
      };

      queryClient.setQueriesData({ queryKey: ["posts"] }, updatePostInPages);
      queryClient.setQueriesData({ queryKey: ["bookmarks"] }, updatePostInPages);
    },
    onSuccess: (data) => {
      if (data?.bookmarked) {
        toast.success("Post saved to bookmarks!");
      } else {
        toast.success("Post removed from bookmarks");
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update bookmark");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

