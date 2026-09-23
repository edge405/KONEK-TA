import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useGroup,
  useGroupMembers,
  useGroupPosts,
  useJoinGroup,
  useLeaveGroup,
} from "../hooks/useGroups";
import CreatePost from "../components/posts/CreatePost";
import PostCard from "../components/posts/PostCard";
import GroupChatView from "../components/groups/GroupChatView";
import InviteMemberModal from "../components/groups/InviteMemberModal";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Users, ArrowLeft, FileText, MessageSquare, ShieldCheck, User, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

export default function GroupDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("posts");
  const [inviteOpen, setInviteOpen] = useState(false);
  const { data: group, isLoading } = useGroup(id);
  const { data: members, isLoading: membersLoading } = useGroupMembers(id);
  const { data: postsData, isLoading: postsLoading } = useGroupPosts(id);
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const posts = Array.isArray(postsData)
    ? postsData
    : postsData?.results ?? [];

  const membersList = Array.isArray(members)
    ? members
    : members?.results ?? [];

  const handleJoinLeave = async () => {
    try {
      if (group.is_member) {
        await leaveGroup.mutateAsync(id);
      } else {
        await joinGroup.mutateAsync(id);
      }
    } catch {
      toast.error("Action failed");
    }
  };

  if (isLoading) return <Spinner className="py-20" />;
  if (!group) return <EmptyState title="Group not found" />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/groups"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      <Card padding={false} className="overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
        {group.cover_image ? (
          <img
            src={group.cover_image}
            alt={group.name}
            className="w-full h-48 sm:h-56 object-cover"
          />
        ) : (
          <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
            <Users className="w-16 h-16 text-white/80" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {group.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formatCount(group.members_count || 0)} members · {formatCount(group.posts_count || 0)} posts
              </p>
            </div>
            <div className="flex items-center gap-2">
              {group.is_member && (
                <Button
                  variant="outline"
                  onClick={() => setInviteOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite
                </Button>
              )}
              <Button
                variant={group.is_member ? "outline" : "primary"}
                onClick={handleJoinLeave}
                loading={joinGroup.isPending || leaveGroup.isPending}
              >
                {group.is_member ? "Leave Group" : "Join Group"}
              </Button>
            </div>
          </div>
          {group.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
              {group.description}
            </p>
          )}
        </div>
      </Card>

      {/* Tabs Bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl px-2 shadow-xs">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "posts"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Posts</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all relative ${
            activeTab === "chat"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("members")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "members"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members</span>
          {membersList.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-medium">
              {membersList.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "posts" && (
        <div className="space-y-6">
          {group.is_member && <CreatePost groupId={id} />}

          <div className="space-y-4">
            {postsLoading ? (
              <Spinner className="py-8" />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="No posts yet"
                description="Be the first to post in this group!"
              />
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <GroupChatView
          group={group}
          isMember={group.is_member}
          onJoin={handleJoinLeave}
        />
      )}

      {activeTab === "members" && (
        <div className="space-y-4">
          {membersLoading ? (
            <Spinner className="py-8" />
          ) : membersList.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title="No members yet"
              description="Be the first to join!"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {membersList.map((member) => {
                const u = member.user_details || {};
                const displayName =
                  `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                  u.username ||
                  member.user ||
                  "Member";

                const memberUserId = u.id;
                const profilePath = memberUserId ? `/users/${memberUserId}` : null;

                return (
                  <Card
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {profilePath ? (
                        <Link to={profilePath}>
                          <Avatar
                            src={u.profile_picture}
                            name={displayName}
                            size="md"
                            className="hover:ring-2 hover:ring-indigo-400 transition-all"
                          />
                        </Link>
                      ) : (
                        <Avatar
                          src={u.profile_picture}
                          name={displayName}
                          size="md"
                        />
                      )}
                      <div className="min-w-0">
                        {profilePath ? (
                          <Link
                            to={profilePath}
                            className="font-semibold text-sm text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate block transition-colors"
                          >
                            {displayName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate block">
                            {displayName}
                          </span>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          @{u.username || member.user}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {member.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          <User className="w-3 h-3" />
                          Member
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {group.is_member && (
        <InviteMemberModal
          isOpen={inviteOpen}
          onClose={() => setInviteOpen(false)}
          group={group}
        />
      )}
    </div>
  );
}
