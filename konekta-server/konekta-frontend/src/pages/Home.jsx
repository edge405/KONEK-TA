import { useEffect, useRef, useCallback } from "react";
import { usePosts } from "../hooks/usePosts";
import CreatePost from "../components/posts/CreatePost";
import PostCard from "../components/posts/PostCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Button from "../components/ui/Button";
import { FileText } from "lucide-react";

export default function Home() {
  const { posts, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = usePosts();
  const observerRef = useRef(null);

  const lastPostRef = useCallback(
    (node) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreatePost />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="No posts yet"
          description="Be the first to share something with the community!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => {
            const isLast = index === posts.length - 1;
            return (
              <div key={post.id} ref={isLast ? lastPostRef : null}>
                <PostCard post={post} />
              </div>
            );
          })}
        </div>
      )}

      {hasNextPage && !isLoading && (
        <div className="flex justify-center py-4">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
