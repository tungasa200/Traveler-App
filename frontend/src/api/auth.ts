import apiClient from './client';

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SignupResponse {
  message: string;
  userSeq: number;
}

// 회원가입
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post('/api/auth/signup', data);
  return response.data;
};

// 로그인
export const login = async (data: LoginRequest): Promise<TokenResponse> => {
  const response = await apiClient.post('/api/auth/login', data);
  return response.data;
};

// 토큰 재발급
export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await apiClient.post('/api/auth/refresh', { refreshToken });
  return response.data;
};

// 로그아웃
export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};
