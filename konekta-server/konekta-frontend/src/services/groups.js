import api from "../lib/api";

export const getGroups = async (page = 1, search = "") => {
  const response = await api.get(`/groups/?page=${page}&search=${encodeURIComponent(search)}`);
  return response.data;
};

export const getGroup = async (id) => {
  const response = await api.get(`/groups/${id}/`);
  return response.data;
};

export const createGroup = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.post("/groups/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateGroup = async (id, data) => {
  const response = await api.patch(`/groups/${id}/`, data);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await api.delete(`/groups/${id}/`);
  return response.data;
};

export const joinGroup = async (id) => {
  const response = await api.post(`/groups/${id}/join/`);
  return response.data;
};

export const leaveGroup = async (id) => {
  const response = await api.delete(`/groups/${id}/leave/`);
  return response.data;
};

export const getGroupMembers = async (id) => {
  const response = await api.get(`/groups/${id}/members/`);
  return response.data;
};

export const getGroupPosts = async (id) => {
  const response = await api.get(`/groups/${id}/posts/`);
  return response.data;
};

export const getInvitations = async () => {
  const response = await api.get("/groups/invitations/");
  return response.data;
};

export const acceptInvitation = async (id) => {
  const response = await api.post(`/groups/invitations/${id}/accept/`);
  return response.data;
};

export const declineInvitation = async (id) => {
  const response = await api.post(`/groups/invitations/${id}/decline/`);
  return response.data;
};
