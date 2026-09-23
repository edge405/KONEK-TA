import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGroupChat, useSendGroupMessage } from "../../hooks/useGroups";
import { useGroupChatSocket } from "../../hooks/useGroupChatSocket";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { Send, MessageSquare, Radio, Users } from "lucide-react";
import { timeAgo } from "../../utils/formatters";

export default function GroupChatView({ group, isMember, onJoin }) {
  const { user: currentUser } = useAuth();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { data: chatData, isLoading } = useGroupChat(group.id);
  const { isSocketConnected, sendSocketMessage } = useGroupChatSocket(
    isMember ? group.id : null
  );
  const sendMutation = useSendGroupMessage();

  const messages = Array.isArray(chatData)
    ? chatData
    : chatData?.results ?? [];

  const scrollToBottom = (behavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom("auto");
  }, [messages.length]);

  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;

    setContent("");

    // Try sending over real-time WebSocket first
    const sentViaSocket = isSocketConnected && sendSocketMessage(trimmed);

    // If socket is disconnected or fails, fall back to REST endpoint
    if (!sentViaSocket) {
      await sendMutation.mutateAsync({
        groupId: group.id,
        data: { content: trimmed },
      });
    }

    setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom();
    }, 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm flex flex-col h-[600px] overflow-hidden">
      {/* Chat Header / Connection status */}
      <div className="px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
              {group.name} Channel
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {group.members_count || 0} members in group
            </p>
          </div>
        </div>

        {isMember && (
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isSocketConnected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSocketConnected
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500"
                }`}
              />
              {isSocketConnected ? "Live" : "Connecting..."}
            </div>
          </div>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Radio className="w-6 h-6" />
            </div>
            <p className="font-medium text-gray-900 dark:text-white">
              No messages yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mt-1">
              Be the first to say hello to everyone in {group.name}!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.sender_id === currentUser?.id ||
              msg.sender === currentUser?.username;

            const senderDisplayName =
              msg.sender_name || msg.sender || "Member";

            const profileUrl = msg.sender_id ? `/users/${msg.sender_id}` : null;

            return (
              <div
                key={msg.id || index}
                className={`flex gap-3 items-end ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  profileUrl ? (
                    <Link to={profileUrl} className="flex-shrink-0 mb-1">
                      <Avatar
                        src={msg.sender_avatar}
                        name={senderDisplayName}
                        size="sm"
                        className="hover:ring-2 hover:ring-indigo-400 transition-all"
                      />
                    </Link>
                  ) : (
                    <Avatar
                      src={msg.sender_avatar}
                      name={senderDisplayName}
                      size="sm"
                      className="flex-shrink-0 mb-1"
                    />
                  )
                )}

                <div
                  className={`max-w-[75%] sm:max-w-[70%] flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  }`}
                >
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1 px-1">
                      {profileUrl ? (
                        <Link
                          to={profileUrl}
                          className="text-xs font-semibold text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {senderDisplayName}
                        </Link>
                      ) : (
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                          {senderDisplayName}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {timeAgo(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words shadow-xs ${
                      isMe
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-xs"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {isMe && (
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {timeAgo(msg.created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input or Join Banner */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
        {isMember ? (
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to the group..."
              className="flex-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
            <Button
              type="submit"
              disabled={!content.trim() || sendMutation.isPending}
              loading={sendMutation.isPending}
              className="px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <p className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 font-medium">
                Join this group to chat with other members in real-time.
              </p>
            </div>
            <Button size="sm" onClick={onJoin}>
              Join Group
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
