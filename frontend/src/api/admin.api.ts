import api from './axiosInstance';

export const getAllUsers = async (page = 0, size = 10) => {
  const { data } = await api.get(`/api/admin/users?page=${page}&size=${size}`);
  return data.content || data;
};

export const onboardUser = async (onboardingData: any) => {
  const { data } = await api.post('/api/admin/onboard', onboardingData);
  return data;
};
