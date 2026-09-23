import api from "../lib/api";

export const getUser = async (id) => {
  const response = await api.get(`/auth/users/${id}/`);
  return response.data;
};

export const updateProfile = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.patch("/auth/profile/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const searchUsers = async (query) => {
  const response = await api.get(`/auth/users/?search=${encodeURIComponent(query)}`);
  return response.data;
};

export const toggleFollow = async (userId) => {
  const response = await api.post(`/auth/follow/${userId}/`);
  return response.data;
};

export const getFollowStatus = async (userId) => {
  const response = await api.get(`/auth/follow/${userId}/status/`);
  return response.data;
};

export const getFollowers = async (userId) => {
  const url = userId ? `/auth/followers/?user_id=${userId}` : "/auth/followers/";
  const response = await api.get(url);
  return response.data;
};

export const getFollowing = async (userId) => {
  const url = userId ? `/auth/following/?user_id=${userId}` : "/auth/following/";
  const response = await api.get(url);
  return response.data;
};

export const toggleBlock = async (userId) => {
  const response = await api.post(`/auth/block/${userId}/`);
  return response.data;
};

export const getBlockedUsers = async () => {
  const response = await api.get("/auth/blocked/");
  return response.data;
};

export const reportUser = async (data) => {
  const response = await api.post("/auth/report/", data);
  return response.data;
};

export const search = async (query, type = "all") => {
  const response = await api.get(
    `/auth/search/?q=${encodeURIComponent(query)}&type=${type}`
  );
  return response.data;
};

