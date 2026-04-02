import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePosts } from "../hooks/usePosts";
import { authService } from "../services/auth";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import PostCard from "../components/posts/PostCard";
import { Edit, MapPin, Calendar, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { posts, isLoading: postsLoading } = usePosts();
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      location: user?.location || "",
    },
  });

  const userPosts = posts.filter(
    (p) => p.author?.id === user?.id || p.author?.username === user?.username
  );

  const onEdit = () => {
    reset({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      location: user?.location || "",
    });
    setEditOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const result = await authService.updateProfile(data);
      updateUser(result);
      toast.success("Profile updated!");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Spinner className="py-20" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="mt-4 sm:mt-0"
            >
              <Edit className="w-4 h-4 mr-1.5" />
              Edit Profile
            </Button>
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
              description="When you create posts, they will appear here."
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
            <div>
              <span className="text-gray-500 dark:text-gray-400">Email: </span>
              <span className="text-gray-900 dark:text-white">{user.email}</span>
            </div>
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

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              error={errors.first_name?.message}
              {...register("first_name", {
                required: "First name is required",
              })}
            />
            <Input
              label="Last name"
              error={errors.last_name?.message}
              {...register("last_name", {
                required: "Last name is required",
              })}
            />
          </div>
          <Textarea
            label="Bio"
            rows={3}
            placeholder="Tell us about yourself..."
            {...register("bio")}
          />
          <Input
            label="Location"
            placeholder="City, Country"
            {...register("location")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
