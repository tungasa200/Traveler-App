import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// 백엔드 서버 주소 (개발 환경)
const BASE_URL = 'http://10.0.2.2:8081'; // Android 에뮬레이터

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: Access Token 자동 추가
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = await SecureStore.getItemAsync('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 시 토큰 재발급 시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          await SecureStore.setItemAsync('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // 토큰 재발급 실패 시 로그아웃 처리
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
