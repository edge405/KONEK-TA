import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  useLikePost,
  useHidePost,
  useUnhidePost,
  useBookmarkPost,
  useComments,
  useAddComment,
  useDeleteComment,
  useUpdatePost,
  useDeletePost,
} from "../../hooks/usePosts";
import Avatar from "../ui/Avatar";
import Card from "../ui/Card";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  BadgeCheck,
  MoreHorizontal,
  EyeOff,
  Copy,
  Flag,
  Undo2,
  Send,
  Trash2,
  Pencil,
} from "lucide-react";
import { timeAgo, formatCount } from "../../utils/formatters";
import { toast } from "react-hot-toast";

export default function PostCard({ post }) {
  const { user: currentUser } = useAuth();
  const likePost = useLikePost();
  const hidePostMutation = useHidePost();
  const unhidePostMutation = useUnhidePost();
  const bookmarkPost = useBookmarkPost();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();

  const isAuthor = currentUser?.id === post.author?.id;

  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked || false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: commentsData, isLoading: commentsLoading } = useComments(
    showComments ? post.id : null
  );
  const addCommentMutation = useAddComment(post.id);
  const deleteCommentMutation = useDeleteComment(post.id);

  const commentsList = Array.isArray(commentsData)
    ? commentsData
    : commentsData?.results ?? [];

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

  const handleBookmark = async () => {
    const prev = bookmarked;
    setBookmarked(!prev);
    try {
      await bookmarkPost.mutateAsync(post.id);
    } catch {
      setBookmarked(prev);
    }
  };

  const handleAddComment = async (e) => {
    e?.preventDefault();
    const content = commentInput.trim();
    if (!content) return;
    setCommentInput("");
    setCommentsCount((prev) => prev + 1);
    try {
      await addCommentMutation.mutateAsync(content);
    } catch {
      setCommentsCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleDeleteComment = async (commentId) => {
    setCommentsCount((prev) => Math.max(0, prev - 1));
    try {
      await deleteCommentMutation.mutateAsync(commentId);
    } catch {
      setCommentsCount((prev) => prev + 1);
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      toast.error("Post content cannot be empty");
      return;
    }
    try {
      await updatePostMutation.mutateAsync({
        id: post.id,
        data: { content: trimmed },
      });
      setIsEditing(false);
    } catch {
      // toast is handled in mutation onError
    }
  };

  const handleDeletePost = async () => {
    setMenuOpen(false);
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        setIsDeleting(true);
        await deletePostMutation.mutateAsync(post.id);
      } catch {
        setIsDeleting(false);
      }
    }
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
                    {isAuthor ? (
                      <>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setEditContent(post.content || "");
                            setIsEditing(true);
                          }}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                          Edit Post
                        </button>
                        <button
                          onClick={handleDeletePost}
                          className="w-full px-3 py-2 text-left flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          Delete Post
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                      </>
                    ) : (
                      <button
                        onClick={handleHidePost}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                        Not Interested
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleBookmark();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-gray-400" />
                      {bookmarked ? "Remove from Saved" : "Save Post"}
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                      Copy Link
                    </button>
                    {!isAuthor && (
                      <button
                        onClick={handleReport}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <Flag className="w-3.5 h-3.5 text-gray-400" />
                        Report Post
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
            @{post.author?.username}
          </p>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full p-2.5 text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white resize-y"
                placeholder="What's on your mind?"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updatePostMutation.isPending}
                  className="px-3.5 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {updatePostMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            post.content && (
              <p className="mt-2 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                {post.content}
              </p>
            )
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

            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                showComments
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400"
              }`}
              title="View comments"
              aria-label="Comments"
            >
              <MessageCircle className="w-4.5 h-4.5" />
              <span>{formatCount(commentsCount)}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-500 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
            >
              <Share2 className="w-4.5 h-4.5" />
              <span>{formatCount(post.shares_count || 0)}</span>
            </button>

            <button
              onClick={handleBookmark}
              className={`ml-auto flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
                bookmarked
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
              }`}
              title={bookmarked ? "Remove from Saved" : "Save Post"}
              aria-label={bookmarked ? "Remove from Saved" : "Save Post"}
            >
              <Bookmark className={`w-4.5 h-4.5 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Inline Comments Thread */}
          {showComments && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {/* Comment composer */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2">
                <Avatar
                  src={currentUser?.profile_picture}
                  name={currentUser?.username || "You"}
                  size="sm"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full pl-3 pr-10 py-1.5 text-xs sm:text-sm bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim() || addCommentMutation.isPending}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-indigo-600 dark:text-indigo-400 disabled:text-gray-300 dark:disabled:text-gray-600 hover:opacity-80 transition-opacity cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Send comment"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Comments list */}
              {commentsLoading ? (
                <p className="text-xs text-center text-gray-400 py-2">Loading comments...</p>
              ) : commentsList.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-2">
                  No comments yet. Be the first to share your thoughts!
                </p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {commentsList.map((c) => {
                    const authorUser = c.author_details;
                    const isAuthor = currentUser?.id === authorUser?.id;
                    const isPostOwner = currentUser?.id === post.author?.id;
                    const canDelete = isAuthor || isPostOwner;

                    return (
                      <div key={c.id} className="flex items-start gap-2 group">
                        <Link to={`/users/${authorUser?.id || ""}`}>
                          <Avatar
                            src={authorUser?.profile_picture}
                            name={authorUser?.username || c.author}
                            size="sm"
                          />
                        </Link>
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800/60 rounded-xl px-3 py-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/users/${authorUser?.id || ""}`}
                              className="font-semibold text-gray-900 dark:text-white hover:underline truncate"
                            >
                              {authorUser?.first_name && authorUser?.last_name
                                ? `${authorUser.first_name} ${authorUser.last_name}`
                                : authorUser?.username || c.author}
                            </Link>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] text-gray-400">
                                {timeAgo(c.created_at)}
                              </span>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-0.5 opacity-70 group-hover:opacity-100 cursor-pointer"
                                  title="Delete comment"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

