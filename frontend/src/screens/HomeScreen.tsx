import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { logout } from '../api/auth';

interface HomeScreenProps {
  onLogout: () => void;
}

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // 서버 로그아웃 실패해도 로컬 토큰은 삭제
      console.log('서버 로그아웃 실패:', error);
    } finally {
      // 토큰 삭제
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      Alert.alert('알림', '로그아웃되었습니다.');
      onLogout();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Traveler App</Text>
      <Text style={styles.subtitle}>로그인 성공!</Text>
      <Text style={styles.description}>
        회원가입 및 로그인 테스트가 완료되었습니다.
      </Text>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    color: '#007AFF',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
