import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useFollowers, useFollowing, useFollowUser } from "../../hooks/useUsers";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import EmptyState from "../ui/EmptyState";
import { Users, Search, UserCheck, UserPlus } from "lucide-react";

export default function UserListModal({ isOpen, onClose, title, userId, type }) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const followMutation = useFollowUser();

  const isFollowers = type === "followers";
  const { data: followersData, isLoading: followersLoading } = useFollowers(
    isOpen && isFollowers ? userId : null
  );
  const { data: followingData, isLoading: followingLoading } = useFollowing(
    isOpen && !isFollowers ? userId : null
  );

  const rawData = isFollowers ? followersData : followingData;
  const isLoading = isFollowers ? followersLoading : followingLoading;

  const usersList = Array.isArray(rawData)
    ? rawData
    : rawData?.results ?? [];

  const filteredUsers = usersList.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const username = (u.username || "").toLowerCase();
    return fullName.includes(term) || username.includes(term);
  });

  const handleFollowToggle = async (targetUser) => {
    try {
      await followMutation.mutateAsync(targetUser.id);
    } catch {
      // toast is handled in mutation
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search people..."
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>

        {/* User list */}
        <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Spinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={<Users className="w-10 h-10 text-gray-400" />}
                title={searchTerm ? "No users found" : `No ${type} yet`}
                description={
                  searchTerm
                    ? "Try a different search term"
                    : isFollowers
                    ? "No one is following this profile yet."
                    : "This profile isn't following anyone yet."
                }
              />
            </div>
          ) : (
            filteredUsers.map((u) => {
              const displayName =
                `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                u.username;

              const isMe = u.id === currentUser?.id;
              const profileLink = isMe ? "/profile" : `/users/${u.id}`;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                >
                  <Link
                    to={profileLink}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <Avatar
                      src={u.profile_picture}
                      name={displayName}
                      size="md"
                      className="group-hover:ring-2 group-hover:ring-indigo-400 transition-all flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        @{u.username}
                      </p>
                      {u.bio && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5 max-w-xs">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {!isMe && (
                    <Button
                      size="sm"
                      variant={u.is_following ? "outline" : "primary"}
                      onClick={() => handleFollowToggle(u)}
                      loading={
                        followMutation.isPending &&
                        followMutation.variables === u.id
                      }
                      className="ml-3 flex-shrink-0 text-xs px-3 py-1.5"
                    >
                      {u.is_following ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
