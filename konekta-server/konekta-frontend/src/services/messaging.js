import api from "../lib/api";

export const getConversations = async () => {
  const response = await api.get("/messaging/conversations/");
  return response.data;
};

export const createConversation = async (userId) => {
  const response = await api.post("/messaging/conversations/", {
    other_user_id: userId,
  });
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await api.get(
    `/messaging/conversations/${conversationId}/messages/`
  );
  return response.data;
};

export const sendMessage = async (conversationId, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.post(
    `/messaging/conversations/${conversationId}/messages/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};

export const markRead = async (conversationId) => {
  const response = await api.post(
    `/messaging/conversations/${conversationId}/read/`
  );
  return response.data;
};

export const getGroupChat = async (groupId) => {
  const response = await api.get(`/messaging/groups/${groupId}/chat/`);
  return response.data;
};

export const sendGroupMessage = async (groupId, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.post(
    `/messaging/groups/${groupId}/chat/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};
