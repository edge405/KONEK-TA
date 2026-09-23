import api from "../lib/api";

export const getPosts = async (page = 1, filters = {}) => {
  const params = new URLSearchParams({ page });
  if (filters?.author) params.append('author', filters.author);
  if (filters?.group) params.append('group', filters.group);
  const response = await api.get(`/posts/?${params.toString()}`);
  return response.data;
};

export const getPost = async (id) => {
  const response = await api.get(`/posts/${id}/`);
  return response.data;
};

export const createPost = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (data[key] !== null && data[key] !== undefined) {
      formData.append(key, data[key]);
    }
  });

  const response = await api.post("/posts/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updatePost = async (id, data) => {
  const response = await api.patch(`/posts/${id}/`, data);
  return response.data;
};

export const deletePost = async (id) => {
  const response = await api.delete(`/posts/${id}/`);
  return response.data;
};

export const toggleLike = async (id) => {
  const response = await api.post(`/posts/${id}/like/`);
  return response.data;
};

export const sharePost = async (id) => {
  const response = await api.post(`/posts/${id}/share/`);
  return response.data;
};

export const getComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments/`);
  return response.data;
};

export const addComment = async (postId, content) => {
  const response = await api.post(`/posts/${postId}/comments/`, { content });
  return response.data;
};

export const hidePost = async (id, reason = "not_interested") => {
  const response = await api.post(`/posts/${id}/hide/`, { reason });
  return response.data;
};

export const unhidePost = async (id) => {
  const response = await api.delete(`/posts/${id}/hide/`);
  return response.data;
};

export const toggleBookmark = async (id) => {
  const response = await api.post(`/posts/${id}/bookmark/`);
  return response.data;
};

export const getBookmarks = async (page = 1) => {
  const response = await api.get(`/posts/bookmarks/?page=${page}`);
  return response.data;
};

