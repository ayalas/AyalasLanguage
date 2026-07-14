import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Link, router, useLocalSearchParams, Href } from 'expo-router';
import { LogIn } from 'lucide-react-native';
import axios from 'axios';
import { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { TWO_FACTOR_CODE_LENGTH, type LoginRequest, type LoginResponse, type Verify2FARequest } from '@ayalaslanguage/types/auth';
import { errorHandler } from '@ayalaslanguage/types/error';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthContext';

const LogInPage = () => {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [on2FA, setOn2FA] = useState(false);
  const [verify2FAToken, setVerify2FAToken] = useState('');
  const [code, setCode] = useState('');
  const { login } = useAuth();
  const { from } = useLocalSearchParams();

  function completeLogin(tmpUser: User) {
    try {
      login(tmpUser);

      if (tmpUser.languageSettings?.knownLanguageId == null || tmpUser.languageSettings?.targetLanguageId == null) {
        if (from != null && typeof from == 'string') {
          router.push({
            pathname: '/profile',
            params: { from }
          });
        }
        else {
          router.replace('/profile');
        }
        return;
      }

      if (from != null && typeof from == 'string') {
        router.replace(from as Href);
      }
      else {
        router.replace('/');
      }
    } catch (err) {
      errorHandler(err, setError);
    }
  }

  async function submitAction() {
    try {
      if (on2FA) {
        const response = await axios.post<LoginResponse<User>>('/api/auth/verify2fa', { verify2FAToken, code } as Verify2FARequest);

        completeLogin(response.data.user);
      }
      else {
        const response = await axios.post<LoginResponse<User>>('/api/auth/login', { userName: email, password } as LoginRequest);

        if (response.data.requires2FA) {
          setOn2FA(true);
          setVerify2FAToken(response.data.verify2FAToken);
        }
        else {
          completeLogin(response.data.user);
        }
      }
    } catch (err) {
      errorHandler(err, setError);
    }
  }

  return (
    <SafeAreaView className="root">
      {error !== "" && (
        <View className="form-row">
          <Text className="form-error">{error}</Text>
        </View>
      )}
      {on2FA && (
        <View className="form-row">
          <View className="form-label-cell">
            <Text className="form-label">Two Factor Authentication Code</Text>
          </View>
          <View className="form-input-cell">
            <TextInput maxLength={TWO_FACTOR_CODE_LENGTH} value={code}
              keyboardType="number-pad"
              className="form-input"
              onChangeText={setCode} />
          </View>
          <View className="form-cell-footer"><Text className='text'>Fill the 6-digit code that has been sent to you by email</Text></View>
        </View>
      ) || (
          <>
            <View className="form-row">
              <View className="form-label-cell">
                <Text className="form-label">Email</Text>
              </View>
              <View className="form-input-cell">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  className="input form-input"
                />
              </View>
            </View>
            <View className="form-row">
              <View className="form-label-cell">
                <Text className="form-label">Password</Text>
              </View>
              <View className="form-input-cell">
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={true}
                  className="input form-input"
                />
              </View>
            </View>
            <View className="form-row">
              <View className="form-label-cell"><Link href="/forgot"><Text className='text'>Forgot your password?</Text></Link></View>
            </View>
          </>
        )}
      <View className="buttons-container">
        <View className="form-input-row">
          <TouchableOpacity className="form-button login-button" onPress={submitAction}>
            <LogIn /><Text className='text'> Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

export default LogInPage