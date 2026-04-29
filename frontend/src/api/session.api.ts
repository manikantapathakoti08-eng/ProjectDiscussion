import api from './axiosInstance';

export interface UserDashboardDTO {
  myRequests: any[];
  myGuidanceSessions: any[];
  completedHistory: any[];
  assignedGuideAvailability?: any[];
  assignedGuideName?: string;
  myStudents?: any[];
  guideStatusChange?: 'APPROVED' | 'REJECTED';
  guideStatusNotes?: string;
}

export const getDashboardData = async (): Promise<UserDashboardDTO> => {
  const { data } = await api.get('/api/sessions/dashboard');
  return data;
};

export const bookSession = async (availabilityId: number, topicName: string) => {
  const { data } = await api.post(`/api/sessions/request/${availabilityId}?topicName=${topicName}`);
  return data;
};


