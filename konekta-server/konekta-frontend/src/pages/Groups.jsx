import { useState } from "react";
import {
  useGroups,
  useCreateGroup,
  useJoinGroup,
  useLeaveGroup,
  useInvitations,
  useAcceptInvitation,
  useDeclineInvitation,
} from "../hooks/useGroups";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Avatar from "../components/ui/Avatar";
import { Plus, Search, Users, Compass, Mail, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { formatCount, timeAgo } from "../utils/formatters";
import { Link } from "react-router-dom";

export default function Groups() {
  const [activeTab, setActiveTab] = useState("explore");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useGroups(search);
  const { data: invitationsData, isLoading: invitationsLoading } = useInvitations();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();
  const acceptInvitation = useAcceptInvitation();
  const declineInvitation = useDeclineInvitation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const groups = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
  const invitations = Array.isArray(invitationsData?.results)
    ? invitationsData.results
    : Array.isArray(invitationsData)
    ? invitationsData
    : [];

  const pendingInvitations = invitations.filter((i) => i.status === "pending");
  const joinedGroups = groups.filter((g) => g.is_member);
  const displayedGroups = activeTab === "joined" ? joinedGroups : groups;

  const onCreate = async (formData) => {
    try {
      await createGroup.mutateAsync(formData);
      toast.success("Group created!");
      setCreateOpen(false);
      reset();
    } catch {
      toast.error("Failed to create group");
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Groups
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Discover, join, and collaborate with communities
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Create Group
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl px-2 shadow-xs">
        <button
          onClick={() => setActiveTab("explore")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "explore"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => setActiveTab("joined")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "joined"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Groups</span>
          {joinedGroups.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full font-medium">
              {joinedGroups.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("invitations")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "invitations"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Invitations</span>
          {pendingInvitations.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full font-bold animate-pulse">
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Explore & My Groups View */}
      {activeTab !== "invitations" && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups by name or description..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
            />
          </div>

          {isLoading ? (
            <Spinner className="py-12" />
          ) : displayedGroups.length === 0 ? (
            <EmptyState
              icon={<Users className="w-12 h-12" />}
              title={activeTab === "joined" ? "You haven't joined any groups yet" : "No groups found"}
              description={
                activeTab === "joined"
                  ? "Explore available groups and join communities that match your interests!"
                  : "Create a group to get started or try a different search."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayedGroups.map((group) => (
                <Card key={group.id} padding={false} className="overflow-hidden hover:shadow-md transition-shadow">
                  <Link to={`/groups/${group.id}`}>
                    {group.cover_image ? (
                      <img
                        src={group.cover_image}
                        alt={group.name}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-10 h-10 text-white/80" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <Link to={`/groups/${group.id}`}>
                      <h3 className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {group.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {group.description}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCount(group.members_count || 0)} members · {formatCount(group.posts_count || 0)} posts
                      </span>
                      <Button
                        variant={group.is_member ? "outline" : "primary"}
                        size="sm"
                        onClick={() => handleJoinLeave(group)}
                        loading={joinGroup.isPending || leaveGroup.isPending}
                      >
                        {group.is_member ? "Leave" : "Join"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {data?.next && (
            <div className="flex justify-center">
              <p className="text-sm text-gray-500">More groups available</p>
            </div>
          )}
        </div>
      )}

      {/* Invitations View */}
      {activeTab === "invitations" && (
        <div className="space-y-4">
          {invitationsLoading ? (
            <Spinner className="py-12" />
          ) : pendingInvitations.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-12 h-12 text-gray-400" />}
              title="No pending invitations"
              description="When group members invite you to join their community, you'll see them here."
            />
          ) : (
            <div className="space-y-3">
              {pendingInvitations.map((inv) => {
                const grp = inv.group_details || {};
                const inviter = inv.inviter_details || {};
                const inviterName =
                  `${inviter.first_name || ""} ${inviter.last_name || ""}`.trim() ||
                  inviter.username ||
                  inv.inviter;

                return (
                  <Card
                    key={inv.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-gray-200 dark:border-gray-800 hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {grp.cover_image ? (
                        <img
                          src={grp.cover_image}
                          alt={grp.name}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold text-lg">
                          {(grp.name || "G")[0]}
                        </div>
                      )}

                      <div className="min-w-0">
                        <Link
                          to={`/groups/${inv.group}`}
                          className="text-base font-bold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate block"
                        >
                          {grp.name || inv.group_name || "Community Group"}
                        </Link>

                        <div className="flex items-center gap-2 mt-1">
                          <Avatar
                            src={inviter.profile_picture}
                            name={inviterName}
                            size="xs"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            Invited by <span className="font-semibold text-gray-900 dark:text-white">{inviterName}</span> · {timeAgo(inv.created_at)}
                          </p>
                        </div>

                        {inv.message && (
                          <p className="text-xs italic text-gray-500 dark:text-gray-400 mt-2 bg-gray-50 dark:bg-gray-800/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                            "{inv.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => acceptInvitation.mutate(inv.id)}
                        loading={acceptInvitation.isPending && acceptInvitation.variables === inv.id}
                        className="flex items-center gap-1 text-xs px-3.5 py-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => declineInvitation.mutate(inv.id)}
                        loading={declineInvitation.isPending && declineInvitation.variables === inv.id}
                        className="flex items-center gap-1 text-xs px-3.5 py-1.5 text-gray-500 hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Group"
        size="lg"
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <Input
            label="Group name"
            placeholder="My awesome group"
            error={errors.name?.message}
            {...register("name", { required: "Name is required" })}
          />
          <Textarea
            label="Description"
            placeholder="What is this group about?"
            rows={3}
            error={errors.description?.message}
            {...register("description", {
              required: "Description is required",
            })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createGroup.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
