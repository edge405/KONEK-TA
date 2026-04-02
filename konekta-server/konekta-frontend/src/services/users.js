import api from "../lib/api";

export const getUser = async (id) => {
  const response = await api.get(`/users/${id}/`);
  return response.data;
};

export const updateProfile = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.patch("/users/me/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/users/?search=${encodeURIComponent(query)}`);
  return response.data;
};

export const toggleFollow = async (userId) => {
  const response = await api.post(`/users/${userId}/follow/`);
  return response.data;
};

export const getFollowStatus = async (userId) => {
  const response = await api.get(`/users/${userId}/follow-status/`);
  return response.data;
};

export const getFollowers = async () => {
  const response = await api.get("/users/me/followers/");
  return response.data;
};

export const getFollowing = async () => {
  const response = await api.get("/users/me/following/");
  return response.data;
};

export const toggleBlock = async (userId) => {
  const response = await api.post(`/users/${userId}/block/`);
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get("/users/me/blocked/");
  return response.data;
};

export const reportUser = async (data) => {
  const response = await api.post("/users/reports/", data);
  return response.data;
};

export const search = async (query, type = "all") => {
  const response = await api.get(
    `/search/?q=${encodeURIComponent(query)}&type=${type}`
  );
  return response.data;
};
