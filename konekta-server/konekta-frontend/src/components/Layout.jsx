import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

export default function Layout({ unreadCount = 0 }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="flex">
        <Sidebar unreadCount={unreadCount} />

        <div className="flex-1 flex flex-col min-h-screen lg:pb-0 pb-14">
          <Header unreadCount={unreadCount} />

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-7xl flex">
              {/* Main feed area */}
              <main className="flex-1 min-w-0 border-x border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 max-w-2xl">
                <Outlet />
              </main>

              {/* Right sidebar */}
              <aside className="hidden xl:block w-80 flex-shrink-0">
                <div className="sticky top-14 p-4 space-y-4">
                  {/* Who to follow */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                      Who to follow
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Follow people to see their posts in your feed.
                    </p>
                  </div>

                  {/* Trending */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                      Trending
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No trending topics yet.
                    </p>
                  </div>

                  {/* Footer links */}
                  <div className="px-2 text-xs text-gray-400 dark:text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>About</span>
                    <span>Help</span>
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span className="w-full mt-1">&copy; 2026 KONEK TA</span>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
