import { useState, useRef, useEffect } from "react";
import { useConversations, useMessages, useSendMessage, useMarkMessagesRead } from "../hooks/useMessages";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/ui/Avatar";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import { Send, ArrowLeft, MessageCircle } from "lucide-react";
import { timeAgo } from "../utils/formatters";
import { toast } from "react-hot-toast";

export default function Messages() {
  const { user } = useAuth();
  const { data: conversationsData, isLoading: convLoading } = useConversations();
  const [selectedId, setSelectedId] = useState(null);
  const { data: messagesData, isLoading: msgLoading } = useMessages(selectedId);
  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const conversations = Array.isArray(conversationsData)
    ? conversationsData
    : conversationsData?.results ?? [];

  const messages = Array.isArray(messagesData)
    ? messagesData
    : messagesData?.results ?? [];

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const otherUser = selectedConv?.other_user || selectedConv?.participants?.find(
    (p) => p.id !== user?.id
  );

  useEffect(() => {
    if (selectedId) {
      markRead.mutate(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedId) return;
    try {
      await sendMessage.mutateAsync({
        conversationId: selectedId,
        data: { content: text.trim() },
      });
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const getOtherName = (conv) => {
    const other = conv.other_user || conv.participants?.find((p) => p.id !== user?.id);
    return other ? `${other.first_name} ${other.last_name}` : "Unknown";
  };

  const getOtherAvatar = (conv) => {
    const other = conv.other_user || conv.participants?.find((p) => p.id !== user?.id);
    return other?.profile_picture || null;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Conversation list */}
        <div
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-r border-gray-200 dark:border-gray-800`}
        >
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Messages
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <Spinner className="py-12" />
            ) : conversations.length === 0 ? (
              <EmptyState
                icon={<MessageCircle className="w-10 h-10" />}
                title="No conversations"
                description="Start a conversation from a user's profile."
              />
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${
                    selectedId === conv.id
                      ? "bg-indigo-50 dark:bg-indigo-950/30"
                      : ""
                  }`}
                >
                  <Avatar
                    src={getOtherAvatar(conv)}
                    name={getOtherName(conv)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getOtherName(conv)}
                      </span>
                      {conv.last_message && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {timeAgo(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    {conv.last_message && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.last_message.content}
                      </p>
                    )}
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-medium">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat window */}
        <div
          className={`${
            selectedId ? "flex" : "hidden md:flex"
          } flex-col flex-1`}
        >
          {selectedId && selectedConv ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar
                  src={getOtherAvatar(selectedConv)}
                  name={getOtherName(selectedConv)}
                  size="sm"
                />
                <span className="font-medium text-gray-900 dark:text-white">
                  {getOtherName(selectedConv)}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <Spinner className="py-12" />
                ) : messages.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 py-12">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      msg.sender?.id === user?.id || msg.is_sender;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine
                                ? "text-indigo-200"
                                : "text-gray-400"
                            }`}
                          >
                            {timeAgo(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sendMessage.isPending}
                  className="p-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<MessageCircle className="w-12 h-12" />}
                title="Select a conversation"
                description="Choose a conversation from the list to start chatting."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
