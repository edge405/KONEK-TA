import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  MessageCircle,
  Bell,
  User,
  Search,
  Settings,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import Avatar from "./ui/Avatar";

export default function Sidebar({ unreadCount = 0 }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/groups", icon: Users, label: "Groups" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-64 h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col px-3 py-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-3 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
            KONEK TA
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={user?.username} src={user?.profile_picture} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.first_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-2 mt-1">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <NavLink
              to="/settings"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </NavLink>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
