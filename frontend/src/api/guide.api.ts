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

// --- 🛠️ Topic Approval System ---

export const requestNewTopic = async (topicName: string, certificateUrl: string): Promise<TopicRequestDTO> => {
  // FIXED: Endpoint is /request-project and param is topicName
  const { data } = await api.post(`/api/guide/request-project?topicName=${topicName}&certificateUrl=${certificateUrl}`);
  return data;
};

export const getMyTopicRequests = async (): Promise<TopicRequestDTO[]> => {
  const { data } = await api.get('/api/guide/project-requests');
  return data;
};

export const uploadCertificate = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/student/upload', formData, { // Assuming upload is in StudentController or shared
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; 
};
