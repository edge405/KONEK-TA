import { useParams, Link } from "react-router-dom";
import { useGroup, useGroupMembers, useGroupPosts, useJoinGroup, useLeaveGroup } from "../hooks/useGroups";
import CreatePost from "../components/posts/CreatePost";
import PostCard from "../components/posts/PostCard";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Users, ArrowLeft, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";

export default function GroupDetail() {
  const { id } = useParams();
  const { data: group, isLoading } = useGroup(id);
  const { data: members } = useGroupMembers(id);
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
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Link>

      <Card padding={false} className="overflow-hidden">
        {group.cover_image ? (
          <img
            src={group.cover_image}
            alt={group.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
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
                {formatCount(group.members_count || 0)} members
              </p>
            </div>
            <Button
              variant={group.is_member ? "outline" : "primary"}
              onClick={handleJoinLeave}
              loading={joinGroup.isPending || leaveGroup.isPending}
            >
              {group.is_member ? "Leave Group" : "Join Group"}
            </Button>
          </div>
          {group.description && (
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              {group.description}
            </p>
          )}
        </div>
      </Card>

      {membersList.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Members
          </h3>
          <div className="flex flex-wrap gap-2">
            {membersList.slice(0, 20).map((member) => (
              <Link key={member.id} to={`/users/${member.id}`}>
                <Avatar
                  src={member.profile_picture}
                  name={`${member.first_name} ${member.last_name}`}
                  size="sm"
                  className="hover:ring-indigo-400 transition-all"
                />
              </Link>
            ))}
            {membersList.length > 20 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                +{membersList.length - 20}
              </div>
            )}
          </div>
        </Card>
      )}

      {group.is_member && <CreatePost />}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Posts
        </h3>
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
  );
}
