import apiClient from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  session_id: string;
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: 'user' | 'admin';
    is_verified: boolean;
  };
  expires_at: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

interface RegisterResponse {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string;
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/api/v1/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post('/api/v1/register', data);
    return response.data;
  },

  verifyEmail: async (email: string, otp: string): Promise<string> => {
    const response = await apiClient.post('/api/v1/verify-email', { email, otp });
    return response.data;
  },

  resendOTP: async (email: string): Promise<string> => {
    const response = await apiClient.post(`/api/v1/resend-otp?email=${encodeURIComponent(email)}`);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/api/v1/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/v1/me');
    return response.data;
  },
};

export function extractErrorMessage(err: any): string {
  const detail = err?.response?.data?.detail;
  if (!detail) return err?.message || 'Something went wrong';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
  }
  return JSON.stringify(detail);
}