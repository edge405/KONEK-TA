import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePost } from "../hooks/usePosts";
import PostCard from "../components/posts/PostCard";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { ArrowLeft, FileText } from "lucide-react";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: post, isLoading, error } = usePost(id);

  return (
    <div className="max-w-2xl mx-auto space-y-4 py-2">
      {/* Top navigation bar */}
      <div className="flex items-center gap-3 px-2 sm:px-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Post
        </h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : error || !post ? (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          title="Post not found"
          description="This post may have been deleted or is unavailable to you."
          actionText="Back to Feed"
          onAction={() => navigate("/")}
        />
      ) : (
        <PostCard post={post} />
      )}
    </div>
  );
}
