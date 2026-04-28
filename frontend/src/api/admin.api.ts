import api from './axiosInstance';

export const getAllSessions = async (page = 0, size = 10) => {
  const { data } = await api.get(`/api/admin/sessions?page=${page}&size=${size}`);
  return data.content || data;
};

export const getDisputedSessions = async () => {
  const { data } = await api.get('/api/admin/sessions/disputed');
  return data;
};

export const getAllUsers = async (page = 0, size = 10) => {
  const { data } = await api.get(`/api/admin/users?page=${page}&size=${size}`);
  return data.content || data;
};

export const resolveDispute = async (sessionId: number, faultIsGuide: boolean, adminNotes: string) => {
  const { data } = await api.post(`/api/admin/sessions/${sessionId}/resolve?faultIsGuide=${faultIsGuide}&adminNotes=${encodeURIComponent(adminNotes)}`);
  return data;
};

export const getPendingTopicRequests = async () => {
  const { data } = await api.get('/api/admin/topic-requests');
  return data;
};

export const approveTopicRequest = async (requestId: number, adminNotes: string) => {
  const { data } = await api.post(`/api/admin/topic-requests/${requestId}/approve?adminNotes=${encodeURIComponent(adminNotes)}`);
  return data;
};

export const rejectTopicRequest = async (requestId: number, adminNotes: string) => {
  const { data } = await api.post(`/api/admin/topic-requests/${requestId}/reject?adminNotes=${encodeURIComponent(adminNotes)}`);
  return data;
};

export const onboardUser = async (onboardingData: any) => {
  const { data } = await api.post('/api/admin/onboard', onboardingData);
  return data;
};

