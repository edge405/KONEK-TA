import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useBlockedUsers, useBlockUser } from "../hooks/useUsers";
import { authService } from "../services/auth";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input from "../components/ui/Input";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import {
  User,
  Bell,
  Shield,
  Palette,
  LogOut,
  Trash2,
  ChevronRight,
  Sun,
  Moon,
  Lock,
  Download,
  UserX,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Modals state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    notify_follows: true,
    notify_likes: true,
    notify_comments: true,
    notify_messages: true,
  });
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);

  // Privacy & Data settings state
  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: "public",
    search_visibility: true,
  });
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [exportingData, setExportingData] = useState(false);

  // Blocked users
  const { data: blockedData, isLoading: blockedLoading, refetch: refetchBlocked } = useBlockedUsers();
  const blockMutation = useBlockUser();
  const [unblockingId, setUnblockingId] = useState(null);

  // Account deletion state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  // Fetch notification settings on open
  useEffect(() => {
    if (notificationsOpen) {
      setNotificationsLoading(true);
      authService
        .getNotificationSettings()
        .then((data) => setNotificationSettings(data))
        .catch(() => toast.error("Failed to load notification settings"))
        .finally(() => setNotificationsLoading(false));
    }
  }, [notificationsOpen]);

  // Fetch privacy settings on open
  useEffect(() => {
    if (privacyOpen) {
      setPrivacyLoading(true);
      authService
        .getPrivacySettings()
        .then((data) => setPrivacySettings(data))
        .catch(() => toast.error("Failed to load privacy settings"))
        .finally(() => setPrivacyLoading(false));
    }
  }, [privacyOpen]);

  // Handle password submit
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword(passwordForm);
      toast.success("Password changed successfully!");
      setPasswordOpen(false);
      setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      const msg =
        err.response?.data?.errors?.old_password?.[0] ||
        err.response?.data?.errors?.new_password?.[0] ||
        err.response?.data?.errors?.confirm_password?.[0] ||
        err.response?.data?.message ||
        "Failed to change password.";
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle notification settings save
  const handleSaveNotifications = async () => {
    setSavingNotifications(true);
    try {
      const updated = await authService.updateNotificationSettings(notificationSettings);
      setNotificationSettings(updated);
      toast.success("Notification preferences saved!");
      setNotificationsOpen(false);
    } catch {
      toast.error("Failed to save notification preferences");
    } finally {
      setSavingNotifications(false);
    }
  };

  // Handle privacy settings save
  const handleSavePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const updated = await authService.updatePrivacySettings(privacySettings);
      setPrivacySettings(updated);
      toast.success("Privacy preferences saved!");
      setPrivacyOpen(false);
    } catch {
      toast.error("Failed to save privacy preferences");
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Handle data export download
  const handleExportData = async () => {
    setExportingData(true);
    try {
      const data = await authService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `konekta_data_export_${user?.username || "user"}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Account data export downloaded!");
    } catch {
      toast.error("Failed to export account data.");
    } finally {
      setExportingData(false);
    }
  };

  // Handle unblock
  const handleUnblock = async (blockedUserId) => {
    setUnblockingId(blockedUserId);
    try {
      await blockMutation.mutateAsync(blockedUserId);
      await refetchBlocked();
      toast.success("User unblocked");
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setUnblockingId(null);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteError("");
    if (!deletePassword) {
      setDeleteError("Please enter your current password to proceed.");
      return;
    }

    setDeleteLoading(true);
    try {
      await authService.deleteAccount({ password: deletePassword });
      toast.success("Your account has been deleted.");
      logout();
      navigate("/register");
    } catch (err) {
      const msg =
        err.response?.data?.errors?.password?.[0] ||
        err.response?.data?.message ||
        "Incorrect password. Could not delete account.";
      setDeleteError(msg);
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Blocked users list extraction (handles paginated DRF responses)
  const blockedList = Array.isArray(blockedData)
    ? blockedData
    : blockedData?.results || [];

  const sections = [
    {
      title: "Account",
      icon: User,
      items: [
        {
          label: "Edit Profile",
          description: "Update your name, bio, and photo",
          to: "/profile",
        },
        {
          label: "Change Password",
          description: "Update your password and security credentials",
          action: () => {
            setPasswordError("");
            setPasswordForm({ old_password: "", new_password: "", confirm_password: "" });
            setPasswordOpen(true);
          },
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          description: "Manage in-app and push notification preferences",
          action: () => setNotificationsOpen(true),
        },
        {
          label: "Email Notifications",
          description: "Manage emails for activity and updates",
          action: () => setNotificationsOpen(true),
        },
      ],
    },
    {
      title: "Privacy & Data",
      icon: Shield,
      items: [
        {
          label: "Blocked Users",
          description: "View and manage blocked users",
          action: () => setBlockedOpen(true),
        },
        {
          label: "Data & Privacy",
          description: "Manage profile visibility and export your data",
          action: () => setPrivacyOpen(true),
        },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Appearance */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <Palette className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Appearance
          </h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Theme
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-200 dark:bg-indigo-600 transition-colors"
              aria-label="Toggle theme"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
              <span className="absolute left-1.5">
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
              </span>
              <span className="absolute right-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-200" />
              </span>
            </button>
          </div>
        </div>
      </Card>

      {/* Sections */}
      {sections.map((section) => (
        <Card key={section.title} padding={false}>
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <section.icon className="w-5 h-5 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {section.title}
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {section.items.map((item) =>
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              )
            )}
          </div>
        </Card>
      ))}

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-4">
          Danger Zone
        </h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
          <Button
            variant="danger"
            className="w-full justify-center"
            onClick={() => {
              setDeletePassword("");
              setDeleteError("");
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Modal 1: Change Password */}
      <Modal
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your current password and choose a secure new password of at least 8 characters.
          </p>

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            required
            value={passwordForm.old_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, old_password: e.target.value })
            }
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 characters"
            required
            value={passwordForm.new_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, new_password: e.target.value })
            }
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            required
            value={passwordForm.confirm_password}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirm_password: e.target.value,
              })
            }
          />

          {passwordError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">
              {passwordError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPasswordOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={passwordLoading}>
              <Lock className="w-4 h-4 mr-2" />
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Notification Preferences */}
      <Modal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notification Preferences"
        size="lg"
      >
        {notificationsLoading ? (
          <Spinner className="py-12" />
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Customize which notifications you receive across email and in-app alerts.
            </p>

            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Channel Toggles */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive email digests and crucial updates
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      email_notifications: !notificationSettings.email_notifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.email_notifications
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.email_notifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Push Notifications
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Receive instant alerts on your connected devices
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      push_notifications: !notificationSettings.push_notifications,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.push_notifications
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.push_notifications
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Activity Triggers */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    New Followers
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When someone starts following your profile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notify_follows: !notificationSettings.notify_follows,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.notify_follows
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.notify_follows
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Post Likes & Reactions
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When other users like or react to your posts
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notify_likes: !notificationSettings.notify_likes,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.notify_likes
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.notify_likes
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Comments & Mentions
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When someone comments on your post or replies to you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notify_comments: !notificationSettings.notify_comments,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.notify_comments
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.notify_comments
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Direct Messages
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When you receive a new chat or direct message
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotificationSettings({
                      ...notificationSettings,
                      notify_messages: !notificationSettings.notify_messages,
                    })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notificationSettings.notify_messages
                      ? "bg-indigo-600"
                      : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      notificationSettings.notify_messages
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setNotificationsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNotifications}
                loading={savingNotifications}
              >
                <Check className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Blocked Users */}
      <Modal
        isOpen={blockedOpen}
        onClose={() => setBlockedOpen(false)}
        title="Blocked Users"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Blocked accounts cannot view your profile, posts, or message you.
          </p>

          {blockedLoading ? (
            <Spinner className="py-12" />
          ) : blockedList.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <UserX className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p className="font-medium">No blocked users</p>
              <p className="text-xs mt-1">Users you block will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-80 overflow-y-auto">
              {blockedList.map((item) => {
                const blockedUser = item.blocked_user;
                if (!blockedUser) return null;
                const isUnblocking = unblockingId === blockedUser.id;

                return (
                  <div
                    key={item.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={blockedUser.profile_picture}
                        name={
                          blockedUser.first_name
                            ? `${blockedUser.first_name} ${blockedUser.last_name || ""}`
                            : blockedUser.username
                        }
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {blockedUser.first_name
                            ? `${blockedUser.first_name} ${blockedUser.last_name || ""}`
                            : blockedUser.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          @{blockedUser.username}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      loading={isUnblocking}
                      onClick={() => handleUnblock(blockedUser.id)}
                    >
                      Unblock
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={() => setBlockedOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Data & Privacy */}
      <Modal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Data & Privacy Settings"
        size="lg"
      >
        {privacyLoading ? (
          <Spinner className="py-12" />
        ) : (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Privacy Controls
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Profile Visibility
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Choose who can view your posts and profile activity
                    </p>
                  </div>
                  <select
                    value={privacySettings.profile_visibility}
                    onChange={(e) =>
                      setPrivacySettings({
                        ...privacySettings,
                        profile_visibility: e.target.value,
                      })
                    }
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="public">Public (Everyone)</option>
                    <option value="private">Private (Followers only)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Search Indexing
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Allow your profile to be discoverable in user searches
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPrivacySettings({
                        ...privacySettings,
                        search_visibility: !privacySettings.search_visibility,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      privacySettings.search_visibility
                        ? "bg-indigo-600"
                        : "bg-gray-300 dark:bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        privacySettings.search_visibility
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Data Export Card */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Download Your Data Archive
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Export a full JSON archive of your personal profile, posts, comments, likes, and group memberships.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    loading={exportingData}
                    onClick={handleExportData}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download Archive (.JSON)
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setPrivacyOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePrivacy} loading={savingPrivacy}>
                <Check className="w-4 h-4 mr-2" />
                Save Privacy Settings
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 5: Delete Account (Verified) */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Account"
      >
        <form onSubmit={handleDeleteAccount} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete your account? This action is
            permanent and cannot be undone. All your posts, followers, and profile details will be permanently erased.
          </p>

          <Input
            label="Confirm with Password"
            type="password"
            placeholder="Enter your current password"
            required
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
          />

          {deleteError && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-2.5 rounded-lg">
              {deleteError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleteLoading}>
              Permanently Delete My Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

