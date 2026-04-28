import api from './axiosInstance';

export interface TopicRequestDTO {
  id: number;
  topicName: string;
  certificateUrl: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
}

// --- 🗳️ Session Requests ---

export const getPendingRequests = async () => {
  const { data } = await api.get('/api/sessions/pending-requests');
  return data;
};

export const acceptSession = async (sessionId: number) => {
  const { data } = await api.post(`/api/sessions/${sessionId}/accept`);
  return data;
};

export const rejectSession = async (sessionId: number) => {
  const { data } = await api.post(`/api/sessions/${sessionId}/cancel`);
  return data;
};

// --- 📅 Availability Management ---

export const setAvailability = async (startTime: string, endTime: string) => {
  const { data } = await api.post('/api/student/availability', { startTime, endTime });
  return data;
};

export const getGuideAvailability = async (userId: number) => {
  const { data } = await api.get(`/api/student/${userId}/availability`);
  return data;
};

export const deleteAvailability = async (slotId: number) => {
  const { data } = await api.delete(`/api/student/availability/${slotId}`);
  return data;
};

// --- 🛠️ Topic Management ---

export const addTopic = async (topicName: string) => {
  const { data } = await api.post(`/api/guide/add-topic?topicName=${topicName}`);
  return data;
};

export const removeTopic = async (topicName: string) => {
  const { data } = await api.delete(`/api/guide/remove-topic?topicName=${topicName}`);
  return data;
};
