import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    PROFILE: "/api/auth/profile",
    UPLOAD_IMAGE: "/api/auth/upload-image",
  },
  USERS: {
    GET_ALL: "/api/users",
    GET_BY_ID: (id) => `/api/users/${id}`,
    DELETE: (id) => `/api/users/${id}`,
  },
  TASKS: {
    DASHBOARD_STATS: "/api/tasks/dashboard-stats",
    USER_DASHBOARD_STATS: "/api/tasks/user-dashboard-stats",
    GET_ALL: "/api/tasks",
    GET_BY_ID: (id) => `/api/tasks/${id}`,
    CREATE: "/api/tasks",
    UPDATE: (id) => `/api/tasks/${id}`,
    DELETE: (id) => `/api/tasks/${id}`,
    UPDATE_STATUS: (id) => `/api/tasks/${id}/status`,
    ADD_COMMENT: (id) => `/api/tasks/${id}/comments`,
  },
  NOTIFICATIONS: {
    GET_ALL: "/api/notifications",
    MARK_READ: "/api/notifications/read",
  },
  REPORTS: {
    EXPORT_TASKS: "/api/reports/export/tasks",
    EXPORT_USERS: "/api/reports/export/users",
  },
  CHAT: {
    MEMBERS: "/api/chat/members",
    UNREAD_COUNT: "/api/chat/unread-count",
    MY_CONVERSATION: "/api/chat/my-conversation",
    CONVERSATION_WITH: (memberId) => `/api/chat/conversation/with/${memberId}`,
    HISTORY: (memberId) => `/api/chat/history/${memberId}`,
    MESSAGES: (conversationId) => `/api/chat/conversation/${conversationId}/messages`,
    SEND_MESSAGE: (conversationId) => `/api/chat/conversation/${conversationId}/messages`,
    MARK_READ: (conversationId) => `/api/chat/conversation/${conversationId}/read`,
    ARCHIVE: (conversationId) => `/api/chat/conversation/${conversationId}/archive`,
  },
};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("taskManagerUser") || "null");
    if (user?.token) config.headers.Authorization = `Bearer ${user.token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("taskManagerUser");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
