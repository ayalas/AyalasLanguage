import { View, Text, TouchableOpacity, TextInput } from 'react-native'
import api from '@/lib/api';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { errorHandler } from '@ayalaslanguage/types/error';
import { isValidEmail } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { Send } from 'lucide-react-native';
import { FormHeader } from '@/components/FormHeader';

import useTextStyles from '@/lib/useTextStyles';

export default function ForgotScreen() {
  const [error, setError] = useState("");
  const { user: userFromSearch } = useLocalSearchParams<{ user: string }>();
  const [email, setEmail] = useState(userFromSearch);
  const [success, setSuccess] = useState(false);
  const { styles } = useTextStyles();

  async function submitAction() {
    try {
      if (!isValidEmail(email)) {
        setError("Please enter a valid email address");
        return;
      }

      await api.post('/api/auth/forgot', { username: email });

      setSuccess(true);

    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }

  return (
      <View className='root'>
        <View className="form-container">
          <FormHeader title='Password Reset' />
          {error !== "" && (
            <View className="form-row">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <>
              <View className="form-row">
                <Text style={styles.h2}>Email sent successfully.</Text>
              </View>
              <View className="form-row">
                <Text style={styles.text}>An email address with a link to reset your password has been sent to &apos;{email}&apos;.</Text>
              </View>
            </>
          ) || (
              <>
                <View className="form-row">
                  <View className="form-label-cell">
                    <Text style={styles.label}>Email</Text>
                  </View>
                  <View className="form-input-cell">
                    <TextInput testID="email" maxLength={128} keyboardType="email-address" value={email} className="form-input"
                      onChangeText={setEmail} />
                  </View>
                </View>
              </>
            )}
          {!success && (
            <View className="buttons-container">
              <View className="form-input-row">
                <TouchableOpacity onPress={submitAction} testID="complete-registration" className="form-button"><Send /><Text style={styles.text}> Send Reset Password Email</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
  )
}