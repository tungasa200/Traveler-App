import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 저장된 토큰 확인
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const accessToken = await SecureStore.getItemAsync('accessToken');
      setIsLoggedIn(!!accessToken);
    } catch (error) {
      console.log('토큰 확인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoggedIn ? (
        <HomeScreen onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
