import { useState } from "react";
import { Link } from "react-router-dom";
import { useLikePost } from "../../hooks/usePosts";
import Avatar from "../ui/Avatar";
import Card from "../ui/Card";
import { Heart, MessageCircle, Share2, BadgeCheck } from "lucide-react";
import { timeAgo, formatCount } from "../../utils/formatters";
import { toast } from "react-hot-toast";

export default function PostCard({ post }) {
  const likePost = useLikePost();
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

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
          <div className="flex items-center gap-2">
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
