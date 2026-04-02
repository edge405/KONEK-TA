import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
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
} from "lucide-react";
import { toast } from "react-hot-toast";

export default function Settings() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
  };

  const handleDeleteAccount = () => {
    toast.success("Account deletion requested");
    setDeleteOpen(false);
  };

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
          description: "Update your password",
          action: () => toast("Password change coming soon"),
        },
      ],
    },
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Push Notifications",
          description: "Manage push notification preferences",
          action: () => toast("Notification settings coming soon"),
        },
        {
          label: "Email Notifications",
          description: "Manage email notification preferences",
          action: () => toast("Email settings coming soon"),
        },
      ],
    },
    {
      title: "Privacy",
      icon: Shield,
      items: [
        {
          label: "Blocked Users",
          description: "View and manage blocked users",
          action: () => toast("Blocked users list coming soon"),
        },
        {
          label: "Data & Privacy",
          description: "Download or manage your data",
          action: () => toast("Data settings coming soon"),
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

      {/* Other sections */}
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
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete your account? This action is
            permanent and cannot be undone. All your data will be removed.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAccount}>
              Delete my account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
