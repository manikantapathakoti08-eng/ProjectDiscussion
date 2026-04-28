import api from './axiosInstance';

export interface ReviewResponse {
  id: number;
  sessionId: number;
  reviewerName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface UserProfileDTO {
  id: number;
  name: string;
  email: string;
  bio: string;
  topics: string[];
  averageRating: number;
  totalReviews: number;
  role: string;
  reviews?: ReviewResponse[];
}

export const getAllProfiles = async (): Promise<UserProfileDTO[]> => {
  const { data } = await api.get('/api/student/all-profiles');
  return data;
};

export const searchGuides = async (topic: string, minRating: number = 0): Promise<UserProfileDTO[]> => {
  const { data } = await api.get(`/api/student/search?topic=${topic}&minRating=${minRating}`);
  return data;
};

export interface AvailabilityDTO {
  id: number;
  guideId: number;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

export const getAvailabilities = async (guideId: number): Promise<AvailabilityDTO[]> => {
  const { data } = await api.get(`/api/student/${guideId}/availability`);
  return data;
};

export interface ProfileUpdateDTO {
  name: string;
  bio: string;
}

export const updateProfile = async (profileData: ProfileUpdateDTO): Promise<UserProfileDTO> => {
  const { data } = await api.put('/api/student/profile', profileData);
  return data;
};

export interface UserStatsDTO {
  totalSessionsAsGuide: number;
  totalSessionsAsStudent: number;
}

export const getMyStats = async (): Promise<UserStatsDTO> => {
  const { data } = await api.get('/api/student/stats');
  return data;
};

export const getProfileByEmail = async (email: string): Promise<UserProfileDTO> => {
  const { data } = await api.get(`/api/student/by-email?email=${email}`);
  return data;
};

export const updateBio = async (bio: string): Promise<UserProfileDTO> => {
  const { data } = await api.put('/api/guide/profile/bio', bio, {
    headers: { 'Content-Type': 'text/plain' }
  });
  return data;
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<string> => {
  const { data } = await api.post('/api/student/change-password', { oldPassword, newPassword });
  return data;
};
