import api from './axiosInstance';

export interface UserDashboardDTO {
  myRequests: any[];
  myGuidanceSessions: any[];
  completedHistory: any[];
  guideStatusChange?: 'APPROVED' | 'REJECTED';
  guideStatusNotes?: string;
}

export const getDashboardData = async (): Promise<UserDashboardDTO> => {
  const { data } = await api.get('/api/sessions/dashboard');
  return data;
};

export const bookSession = async (availabilityId: number, topicName: string, durationHours: number) => {
  const { data } = await api.post(`/api/sessions/request/${availabilityId}?topicName=${topicName}&durationHours=${durationHours}`);
  return data;
};

export const submitReview = async (id: number, rating: number, comment: string) => {
  const { data } = await api.post(`/api/sessions/${id}/review`, { rating, comment });
  return data;
};

export const getGuideReviews = async (guideId: number) => {
  const { data } = await api.get(`/api/sessions/guide/${guideId}/reviews`);
  return data;
};
