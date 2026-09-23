import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useFollowing } from "../../hooks/useUsers";
import { useCreateInvitation } from "../../hooks/useGroups";
import { searchUsers } from "../../services/users";
import Modal from "../ui/Modal";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import Textarea from "../ui/Textarea";
import EmptyState from "../ui/EmptyState";
import { Search, UserPlus, Check, Users } from "lucide-react";
import { toast } from "react-hot-toast";

export default function InviteMemberModal({ isOpen, onClose, group }) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");

  const { data: followingData, isLoading: followingLoading } = useFollowing(
    isOpen ? currentUser?.id : null
  );

  const createInvitation = useCreateInvitation();

  const followingList = Array.isArray(followingData)
    ? followingData
    : followingData?.results ?? [];

  const handleSearch = async (query) => {
    setSearchTerm(query);
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const data = await searchUsers(query.trim());
      const users = Array.isArray(data) ? data : data?.results ?? [];
      // Filter out self
      setSearchResults(users.filter((u) => u.id !== currentUser?.id));
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const candidateUsers = searchResults !== null ? searchResults : followingList;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedUser || createInvitation.isPending) return;

    try {
      await createInvitation.mutateAsync({
        group: group.id,
        invitee: selectedUser.id,
        message: message.trim(),
      });
      setSelectedUser(null);
      setMessage("");
      setSearchTerm("");
      setSearchResults(null);
      onClose();
    } catch {
      // Error handled by mutation toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedUser(null);
        setSearchTerm("");
        setSearchResults(null);
        onClose();
      }}
      title={`Invite to ${group.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Selected User Banner */}
        {selectedUser && (
          <div className="flex items-center justify-between p-3 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                src={selectedUser.profile_picture}
                name={`${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() || selectedUser.username}
                size="sm"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                  Inviting: {selectedUser.first_name} {selectedUser.last_name} (@{selectedUser.username})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-2"
            >
              Change
            </button>
          </div>
        )}

        {/* Candidates List */}
        {!selectedUser && (
          <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1">
            {searching || followingLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner />
              </div>
            ) : candidateUsers.length === 0 ? (
              <div className="py-6">
                <EmptyState
                  icon={<Users className="w-8 h-8 text-gray-400" />}
                  title={searchTerm ? "No users found" : "No users to invite"}
                  description={
                    searchTerm
                      ? "Try searching with a different keyword"
                      : "Search for users above to invite them to this group."
                  }
                />
              </div>
            ) : (
              candidateUsers.map((u) => {
                const displayName =
                  `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
                  u.username;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar
                        src={u.profile_picture}
                        name={displayName}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          @{u.username}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                      Select
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Optional Invitation Note */}
        {selectedUser && (
          <Textarea
            label="Invitation Message (Optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Add a friendly note explaining why they should join..."
          />
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelectedUser(null);
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedUser || createInvitation.isPending}
            loading={createInvitation.isPending}
            className="flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
