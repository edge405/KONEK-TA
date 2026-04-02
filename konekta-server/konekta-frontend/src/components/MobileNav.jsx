import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Search, Users, MessageCircle, User } from "lucide-react";

export default function MobileNav() {
  const items = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/groups", icon: Users, label: "Groups" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-bottom">
      <div className="flex items-center justify-around h-14 px-2">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 rounded-lg transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-gray-400"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
