import { useState } from "react";
import { Link } from "react-router-dom";
import { useLikePost, useHidePost, useUnhidePost } from "../../hooks/usePosts";
import Avatar from "../ui/Avatar";
import Card from "../ui/Card";
import {
  Heart,
  MessageCircle,
  Share2,
  BadgeCheck,
  MoreHorizontal,
  EyeOff,
  Copy,
  Flag,
  Undo2,
} from "lucide-react";
import { timeAgo, formatCount } from "../../utils/formatters";
import { toast } from "react-hot-toast";

export default function PostCard({ post }) {
  const likePost = useLikePost();
  const hidePostMutation = useHidePost();
  const unhidePostMutation = useUnhidePost();

  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  const handleLike = async () => {
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      await likePost.mutateAsync(post.id);
    } catch {
      setLiked(prevLiked);
      setLikesCount(prevCount);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "KONEK TA Post", text: post.content });
    } else {
      navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
      toast.success("Link copied!");
    }
  };

  const handleCopyLink = () => {
    setMenuOpen(false);
    navigator.clipboard.writeText(window.location.origin + `/posts/${post.id}`);
    toast.success("Post link copied!");
  };

  const handleHidePost = async () => {
    setMenuOpen(false);
    setIsHidden(true);
    try {
      await hidePostMutation.mutateAsync(post.id);
      toast.success("Post marked as not interested");
    } catch {
      setIsHidden(false);
      toast.error("Failed to hide post");
    }
  };

  const handleUndoHide = async () => {
    setIsHidden(false);
    try {
      await unhidePostMutation.mutateAsync(post.id);
      toast.success("Post restored to feed");
    } catch {
      setIsHidden(true);
      toast.error("Failed to restore post");
    }
  };

  const handleReport = () => {
    setMenuOpen(false);
    toast.success("Post reported for community review");
  };

  if (isHidden) {
    return (
      <Card className="py-3 px-4 bg-gray-50/80 dark:bg-gray-800/40 border-dashed border-gray-200 dark:border-gray-800 transition-all">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <EyeOff className="w-3.5 h-3.5 text-gray-400" />
            <span>Post marked as not interested</span>
          </div>
          <button
            onClick={handleUndoHide}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <Link to={`/users/${post.author?.id}`}>
          <Avatar
            src={post.author?.profile_picture}
            name={post.author?.username || `${post.author?.first_name} ${post.author?.last_name}`}
            size="md"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/users/${post.author?.id}`}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:underline truncate"
              >
                {post.author?.first_name && post.author?.last_name
                  ? `${post.author.first_name} ${post.author.last_name}`
                  : post.author?.username}
              </Link>
              {post.author?.is_verified && (
                <BadgeCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              )}
              <span className="text-xs text-gray-400 flex-shrink-0">
                {timeAgo(post.created_at)}
              </span>
            </div>

            {/* Post Options Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-7 z-30 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 text-xs">
                    <button
                      onClick={handleHidePost}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                      Not Interested
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      Copy Link
                    </button>
                    <button
                      onClick={handleReport}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5 text-gray-400" />
                      Report Post
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
            @{post.author?.username}
          </p>

          {post.content && (
            <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}

          {post.image && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <img
                src={post.image}
                alt="Post"
                className="w-full object-cover max-h-96"
              />
            </div>
          )}

          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                liked
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
              }`}
            >
              <Heart className={`w-4.5 h-4.5 ${liked ? "fill-current" : ""}`} />
              <span>{formatCount(likesCount)}</span>
            </button>

            <Link
              to={`/posts/${post.id}`}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>{formatCount(post.comments_count || 0)}</span>
            </Link>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            >
              <Share2 className="w-4.5 h-4.5" />
              <span>{formatCount(post.shares_count || 0)}</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

