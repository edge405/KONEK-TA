import { useState } from "react";
import { useGroups, useCreateGroup, useJoinGroup, useLeaveGroup } from "../hooks/useGroups";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";
import Modal from "../components/ui/Modal";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import Avatar from "../components/ui/Avatar";
import { Plus, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { formatCount } from "../utils/formatters";
import { Link } from "react-router-dom";

export default function Groups() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading } = useGroups(search);
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();
  const leaveGroup = useLeaveGroup();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const groups = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Groups
        </h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Group
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {isLoading ? (
        <Spinner className="py-12" />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No groups found"
          description="Create a group to get started or try a different search."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} padding={false} className="overflow-hidden">
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
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCount(group.members_count || 0)} members
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
