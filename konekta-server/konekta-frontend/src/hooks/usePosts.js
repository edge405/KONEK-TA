import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  getPosts,
  createPost,
  toggleLike,
  sharePost,
  getComments,
  addComment,
} from "../services/posts";

export function usePosts() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: ({ pageParam = 1 }) => getPosts(pageParam),
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

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
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
