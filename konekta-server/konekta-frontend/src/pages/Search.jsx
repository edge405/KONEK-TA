import { useState } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../hooks/useSearch";
import { useJoinGroup, useLeaveGroup } from "../hooks/useGroups";
import { useFollowUser } from "../hooks/useUsers";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import PostCard from "../components/posts/PostCard";
import { Search as SearchIcon, Users, FileText, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

const tabs = ["All", "Users", "Groups", "Posts"];

export default function Search() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const { data, isLoading } = useSearch(query);
  const followUser = useFollowUser();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const users = data?.users ?? [];
  const groups = data?.groups ?? [];
  const posts = data?.posts ?? [];

  const hasResults =
    users.length > 0 || groups.length > 0 || posts.length > 0;

  const handleFollow = async (userId) => {
    try {
      await followUser.mutateAsync(userId);
      toast.success("Following");
    } catch {
      toast.error("Action failed");
    }
  };

  const handleJoinLeave = async (group) => {
    try {
      if (group.is_member) {
        await leaveGroup.mutateAsync(group.id);
      } else {
        await joinGroup.mutateAsync(group.id);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  const showUsers = activeTab === "All" || activeTab === "Users";
  const showGroups = activeTab === "All" || activeTab === "Groups";
  const showPosts = activeTab === "All" || activeTab === "Posts";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, groups, posts..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {!query ? (
        <EmptyState
          icon={<SearchIcon className="w-12 h-12" />}
          title="Search KONEK TA"
          description="Find users, groups, and posts."
        />
      ) : isLoading ? (
        <Spinner className="py-12" />
      ) : !hasResults ? (
        <EmptyState
          icon={<SearchIcon className="w-12 h-12" />}
          title="No results"
          description={`Nothing found for "${query}"`}
        />
      ) : (
        <div className="space-y-6">
          {showUsers && users.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Users
              </h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <Card key={user.id} className="flex items-center justify-between">
                    <Link
                      to={`/users/${user.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <Avatar
                        src={user.profile_picture}
                        name={`${user.first_name} ${user.last_name}`}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollow(user.id)}
                      loading={followUser.isPending}
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                      Follow
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {showGroups && groups.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Groups
              </h3>
              <div className="space-y-2">
                {groups.map((group) => (
                  <Card key={group.id} className="flex items-center justify-between">
                    <Link
                      to={`/groups/${group.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {group.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCount(group.members_count || 0)} members
                        </p>
                      </div>
                    </Link>
                    <Button
                      variant={group.is_member ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleJoinLeave(group)}
                      loading={joinGroup.isPending || leaveGroup.isPending}
                    >
                      {group.is_member ? "Leave" : "Join"}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {showPosts && posts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Posts
              </h3>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
