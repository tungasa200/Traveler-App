import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { signup, login, logout, SignupRequest, LoginRequest } from '../api/auth';

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !nickname) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const data: SignupRequest = { email, password, nickname };
      const response = await signup(data);
      Alert.alert('성공', response.message, [
        { text: '확인', onPress: () => setMode('login') },
      ]);
      setPassword('');
    } catch (error: any) {
      const message = error.response?.data?.message || '회원가입에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const data: LoginRequest = { email, password };
      const response = await login(data);

      // 토큰 저장
      await SecureStore.setItemAsync('accessToken', response.accessToken);
      await SecureStore.setItemAsync('refreshToken', response.refreshToken);

      Alert.alert('성공', '로그인되었습니다.', [
        { text: '확인', onPress: onLoginSuccess },
      ]);
    } catch (error: any) {
      const message = error.response?.data?.message || '로그인에 실패했습니다.';
      Alert.alert('오류', message);
    } finally {
      setLoading(false);
    }
  };

  const clearInputs = () => {
    setEmail('');
    setPassword('');
    setNickname('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    clearInputs();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Traveler App</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? '로그인' : '회원가입'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="닉네임 (2~20자)"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="비밀번호 (8자 이상)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          >
            <Text style={styles.switchText}>
              {mode === 'login'
                ? '계정이 없으신가요? 회원가입'
                : '이미 계정이 있으신가요? 로그인'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});
