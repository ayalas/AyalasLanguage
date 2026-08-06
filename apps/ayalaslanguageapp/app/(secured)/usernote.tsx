import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import React, { useState } from 'react'
import { Send } from "lucide-react-native";

import { errorHandler } from '@ayalaslanguage/types/error';

import api from "@/lib/api";
import SecuredHeader from "@/components/SecuredHeader";
import { FormHeader } from "@/components/FormHeader";
import useTextStyles from '@/lib/useTextStyles';

export default function ContactUsScreen() {
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const { styles } = useTextStyles();

  async function submitAction() {
    try {
      await api.post('/api/profile/message', { message });

      setError("");
      setSuccess(true);

    } catch (err) {
      errorHandler(err, setError);
    }
  }

  return (
    <View className="root">
      <SecuredHeader />
      <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
          <FormHeader title="Contact Us" />
          {error !== "" && (
            <View className="form-row">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View className="form-row">
              <Text style={styles.h2}>Message sent successfully.</Text>
            </View>
          ) || (
              <>
                <Text style={styles.label}>Message</Text>
                <View className="form-row">
                  <View className="form-input-row">
                    <TextInput
                      multiline={true}
                      numberOfLines={8} testID="message" maxLength={4000}
                      className="text-area-wide" value={message}
                      onChangeText={setMessage} />
                  </View>
                </View>
              </>
            )}
          {!success && (
            <View className="buttons-container">
              <View className="form-button-cell">
                <TouchableOpacity testID="save" onPress={submitAction} className="form-button login-button"><Send /><Text style={styles.text}> Send</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>);
}