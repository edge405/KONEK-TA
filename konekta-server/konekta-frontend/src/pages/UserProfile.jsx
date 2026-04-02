import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser, useFollowUser, useBlockUser } from "../hooks/useUsers";
import { usePosts } from "../hooks/usePosts";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import PostCard from "../components/posts/PostCard";
import { MapPin, Calendar, FileText, UserX, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const { data: user, isLoading } = useUser(id);
  const { posts, isLoading: postsLoading } = usePosts();
  const followMutation = useFollowUser();
  const blockMutation = useBlockUser();
  const [activeTab, setActiveTab] = useState("posts");

  const userPosts = posts.filter(
    (p) => p.author?.id === Number(id) || p.author?.id === id
  );

  const isOwnProfile = currentUser?.id === Number(id) || currentUser?.id === id;
  const isFollowing = user?.is_following;

  const handleFollowToggle = async () => {
    try {
      await followMutation.mutateAsync(id);
      toast.success(isFollowing ? "Unfollowed" : "Following");
    } catch {
      toast.error("Action failed");
    }
  };

  const handleBlock = async () => {
    if (!window.confirm("Are you sure you want to block this user?")) return;
    try {
      await blockMutation.mutateAsync(id);
      toast.success("User blocked");
    } catch {
      toast.error("Failed to block user");
    }
  };

  if (isLoading) return <Spinner className="py-20" />;
  if (!user) return <EmptyState title="User not found" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>

      <Card padding={false} className="overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-14">
            <div className="flex items-end gap-4">
              <Avatar
                src={user.profile_picture}
                name={`${user.first_name} ${user.last_name}`}
                size="2xl"
                className="border-4 border-white dark:border-gray-900"
              />
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.first_name} {user.last_name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{user.username}
                </p>
              </div>
            </div>
            {!isOwnProfile && (
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Button
                  variant={isFollowing ? "outline" : "primary"}
                  onClick={handleFollowToggle}
                  loading={followMutation.isPending}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleBlock}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {user.bio && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">{user.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {user.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Joined{" "}
              {new Date(user.date_joined).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex gap-6 mt-4">
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCount(user.posts_count || 0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                Posts
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCount(user.followers_count || 0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                Followers
              </span>
            </div>
            <div>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCount(user.following_count || 0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                Following
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {["posts", "about"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "posts" && (
        <div className="space-y-4">
          {postsLoading ? (
            <Spinner className="py-12" />
          ) : userPosts.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No posts yet"
              description="This user hasn't posted anything yet."
            />
          ) : (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}

      {activeTab === "about" && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About
          </h3>
          <div className="space-y-3 text-sm">
            {user.location && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Location:{" "}
                </span>
                <span className="text-gray-900 dark:text-white">
                  {user.location}
                </span>
              </div>
            )}
            {user.bio && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Bio: </span>
                <span className="text-gray-900 dark:text-white">{user.bio}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
