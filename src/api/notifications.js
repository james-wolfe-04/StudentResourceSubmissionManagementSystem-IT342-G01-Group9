import api from "./axios";

export const fetchUserNotifications = async (userId) => {
    const res = await api.get(`/notifications/user/${userId}`);
    return res.data || [];
};

export const markAllReadForUser = async (userId) => {
    await api.post(`/notifications/user/${userId}/read-all`);
};

export const markNotificationRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
};
