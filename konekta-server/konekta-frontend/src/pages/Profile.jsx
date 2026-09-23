import { useState, useRef } from "react";
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
import UserListModal from "../components/profile/UserListModal";
import { Edit, MapPin, Calendar, FileText, Camera, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { posts: userPosts, isLoading: postsLoading } = usePosts(
    user?.id ? { author: user.id } : {}
  );
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [saving, setSaving] = useState(false);
  const [userListModal, setUserListModal] = useState({
    isOpen: false,
    type: "followers",
    title: "Followers",
  });

  // Media upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

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

  const onEdit = () => {
    reset({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      bio: user?.bio || "",
      location: user?.location || "",
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setBannerFile(null);
    setBannerPreview(null);
    setEditOpen(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size must be less than 5MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Banner file size must be less than 5MB");
      return;
    }

    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("bio", data.bio || "");
      formData.append("location", data.location || "");

      if (avatarFile) {
        formData.append("profile_picture", avatarFile);
      }
      if (bannerFile) {
        formData.append("banner_image", bannerFile);
      }

      const result = await authService.updateProfile(formData);
      updateUser(result);
      toast.success("Profile updated successfully!");
      setEditOpen(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <Spinner className="py-20" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card padding={false} className="overflow-hidden">
        {/* Banner with Cover photo support */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {user.banner_image ? (
            <img
              src={user.banner_image}
              alt="Profile Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          )}
          <button
            onClick={onEdit}
            className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Edit cover banner"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Edit Cover</span>
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-14">
            <div className="flex items-end gap-4">
              {/* Avatar with Camera Overlay */}
              <div
                className="relative group cursor-pointer"
                onClick={onEdit}
                title="Change profile picture"
              >
                <Avatar
                  src={user.profile_picture}
                  name={`${user.first_name} ${user.last_name}`}
                  size="2xl"
                  className="border-4 border-white dark:border-gray-900 shadow-md"
                />
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150">
                  <Camera className="w-6 h-6" />
                </div>
              </div>

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
            <button
              type="button"
              onClick={() =>
                setUserListModal({
                  isOpen: true,
                  type: "followers",
                  title: `Followers (${formatCount(user.followers_count || 0)})`,
                })
              }
              className="text-left group hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {formatCount(user.followers_count || 0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                Followers
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setUserListModal({
                  isOpen: true,
                  type: "following",
                  title: `Following (${formatCount(user.following_count || 0)})`,
                })
              }
              className="text-left group hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {formatCount(user.following_count || 0)}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1 text-sm">
                Following
              </span>
            </button>
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

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Profile"
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Banner Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Profile Banner
            </label>
            <div className="relative h-28 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 group">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-full object-cover"
                />
              ) : user.banner_image ? (
                <img
                  src={user.banner_image}
                  alt="Current banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Change Banner
                </Button>
                {bannerPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-black/50"
                    onClick={() => {
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>

          {/* Avatar Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  src={avatarPreview || user.profile_picture}
                  name={`${user.first_name} ${user.last_name}`}
                  size="xl"
                  className="border-2 border-gray-200 dark:border-gray-700"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Upload Photo
                  </Button>
                  {avatarPreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                    >
                      Reset
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, GIF or WebP. Max 5MB.
                </p>
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Text Fields */}
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

      <UserListModal
        isOpen={userListModal.isOpen}
        onClose={() => setUserListModal((prev) => ({ ...prev, isOpen: false }))}
        title={userListModal.title}
        userId={user?.id}
        type={userListModal.type}
      />
    </div>
  );
}

