import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { Link, router, useLocalSearchParams, Href } from 'expo-router';
import { User as UserIcon } from 'lucide-react-native';
import axios from 'axios';
import { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { TWO_FACTOR_CODE_LENGTH, type LoginRequest, type LoginResponse, type Verify2FARequest } from '@ayalaslanguage/types/auth';
import { errorHandler } from '@ayalaslanguage/types/error';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/AuthContext';
import { checkPasswordStrength, generatePasswordFeedback, isValidEmail } from '@ayalaslanguage/types/sharedfrontlib/utils';

const SignUpScreen = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  async function submitAction() {
    try {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      if (password == null || passwordConfirm == null) {
        setError("Password and Password Confirm are required.")
        return;
      }

      const newPasswordTrimmed = password.trim();
      const newPasswordConfirmTrimmed = passwordConfirm.trim();
      if (newPasswordTrimmed.length == 0) {
        setError("Password and Password Confirm are required. Password contains only whitespace.")
        return;
      }

      if (newPasswordTrimmed != newPasswordConfirmTrimmed) {
        setError("Password and Password Confirm must be identical.")
        return;
      }

      const resCheck = checkPasswordStrength(newPasswordTrimmed);
      if (!resCheck.isValid) {
        const feedback = generatePasswordFeedback(resCheck.checks);
        setError(feedback.message);
        return;
      }

      await axios.post('/api/auth/register',
        { displayname: displayName, username: email, password: newPasswordTrimmed });

      setError("");
      setSuccess(true);
    } catch (err) {
      errorHandler(err, setError);
    }
  }

  return (
    <SafeAreaView>
    <View className="root">
      <View className='form-container'>
        <Text className="h1">Sign Up</Text>
        {error !== "" && (
          <View className="form-row">
            <Text className="form-error">{error}</Text>
          </View>
        )}
        {success && (
          <>
            <View className="form-row">
              <Text className="h2">Account created successfully.</Text>
            </View>
            <View className="form-row">
              <Text className="form-content-row">
                An email address confirmation request has been sent to &apos;{email}&apos;.
                Please confirm your email, so you&apos;ll be able to generate exercise
                content and recover your account, in case you forget your password.
                You can do this now, or later on, after you{" "}
                <Link href={`/login?user=${email}`}>
                  <Text className="text-dimmed underline">log in</Text>
                </Link>
                {" "}and experience with the app.
              </Text>
            </View>
          </>
        ) || (
            <>
              <View className="form-row">
                <View className="form-label-cell">
                  <Text className="form-label">Display Name</Text>
                </View>
                <View className="form-input-cell">
                  <TextInput data-testid="display-name" keyboardType="default"
                    maxLength={128}
                    value={displayName} className="input form-input"
                    onChangeText={setDisplayName} />
                </View>
              </View>
              <View className="form-row">
                <View className="form-label-cell">
                  <Text className="form-label">Email</Text>
                </View>
                <View className="form-input-cell">
                  <TextInput
                    data-testid="email"
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
                    data-testid="password"
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
                <View className="form-label-cell">
                  <Text className="form-label">Confirm Password</Text>
                </View>
                <View className="form-input-cell">
                  <TextInput
                    data-testid="confirm-password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={passwordConfirm}
                    onChangeText={setPasswordConfirm}
                    secureTextEntry={true}
                    className="input form-input"
                  />
                </View>
              </View>
              <View className="buttons-container">
                <View className="form-input-row">
                  <TouchableOpacity data-testid="submit" className="form-button login-button" onPress={submitAction}>
                    <UserIcon className="inline-row" /><Text className='text'>{" "}Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
      </View>
    </View>
    </SafeAreaView>
  )
}

export default SignUpScreen;