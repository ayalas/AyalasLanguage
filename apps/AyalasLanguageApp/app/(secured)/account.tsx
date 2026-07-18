import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native'
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { Save, Send } from 'lucide-react-native';
import { errorHandler } from '@ayalaslanguage/types/error';
import SecuredHeader from '@/components/SecuredHeader';
import { checkPasswordStrength, generatePasswordFeedback } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { FormHeader } from '@/components/FormHeader';
import { useAuth } from '@/lib/AuthContext';
import Checkbox from 'expo-checkbox';
import useTextStyles from '@/lib/useTextStyles';

export default function AccountScreen() {
  const [displayName, setDisplayName] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [use2FALogin, setUse2FALogin] = useState(false);
  const [accountChanged, setAccountChanged] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [error, setError] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const { user, login } = useAuth();
  const router = useRouter();
  const styles = useTextStyles();

  const confirmEmail = async () => {
    try {

      await api.post('/api/auth/confirm');

      setEmailConfirmationSent(true);
      setTimeout(() => {
        router.replace('/');
      }, 3000);
    }
    catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  const handleSubmit = async () => {
    try {
      let newPasswordTrimmed: string = "";
      const newUserNameTrimmed = newUserName.trim();
      if (newPassword != null && newPassword.length > 0) {
        newPasswordTrimmed = newPassword.trim();

        if (newPasswordConfirm == null) {
          setError("Must fill New Password Confirm, if New Password is filled.");
          return;
        }

        const newPasswordConfirmTrimmed = newPasswordConfirm.trim();

        if (newPasswordTrimmed.length == 0) {
          setError("New Password and Password Confirm are required. New Password contains only whitespace.")
          return;
        }

        if (newPasswordTrimmed != newPasswordConfirmTrimmed) {
          setError("New Password and Password Confirm must be identical.")
          return;
        }

        const resCheck = checkPasswordStrength(newPasswordTrimmed);
        if (!resCheck.isValid) {
          const feedback = generatePasswordFeedback(resCheck.checks);
          setError(feedback.message);
          return;
        }
      }

      const res = await api.post('/api/auth/account', { newUserName: newUserNameTrimmed, oldPassword, newPassword: newPasswordTrimmed, use2FALogin, displayName });

      login(res.data);

      setError("");
      setAccountChanged(true);
      setTimeout(() => {
        router.replace('/');
      }, 3000);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  };

  useEffect(() => {
    async function runAsync() {
      if (user != null) {
        setUse2FALogin(user?.use2FALogin);
        if (user?.displayName != null) {
          setDisplayName(user?.displayName);
        }
      }
    }
    runAsync();
  }, [user]);

  return (
    <View className="root">
      <ScrollView className='form-container' showsVerticalScrollIndicator={false}>

        {accountChanged ? (
          <View className="form-row">
            <Text style={styles.h2}>Account details changed successfully.</Text>
          </View>
        ) : emailConfirmationSent ? (
          <>
            <View className="form-row">
              <Text style={styles.h2}>Email address confirmation sent successfully.</Text>
            </View>
            <View className="form-row">
              <Text style={styles.text}>An email address confirmation request has been sent to '{user?.userName}'. Please confirm your email, so you'll be able to recover your account, in case you forget your password. </Text>
            </View>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <FormHeader title="Account Details" />
            {error !== "" && (
              <View className="form-row">
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View className="form-row">
              <View className="form-label-cell">
                <Text style={styles.label}>First Name</Text>
              </View>
            </View>
            <View className="form-row">
              <View className="form-input-cell">
                <TextInput testID="display-name" keyboardType="default" maxLength={128} className="form-input" value={displayName} onChangeText={setDisplayName} />
              </View>
            </View>
            <View className="form-row">
              <View className="form-label-cell">
                <Text style={styles.label}>Email Address: {user?.userName}</Text>
              </View>
              <Text style={styles.text}>{user?.emailConfirmed && (
                <>Confirmed (cannot be changed)</>
              ) || (
                  <> Please confirm your email address by clicking Confirm Email Address above.</>
                )}</Text>
            </View>
            {user?.emailConfirmed && (
              <>
                <View className="form-row">
                  <View className="line-container">
                    <Checkbox className='inline-row' testID="use-2fa" value={use2FALogin} onValueChange={setUse2FALogin} /><Text style={styles.label}>Use Two Factor Authentication</Text>
                  </View>
                  <Text style={styles.text}>Protect your account on login with an extra code sent by email</Text>
                </View>
              </>
            )}
            <View className="form-row">
              <View className="form-label-cell">
                <Text style={styles.label}>Current Password</Text>
              </View>
            </View>
            <View className="form-row">
              <View className="form-input-cell">
                <TextInput testID="current-password" secureTextEntry={true} keyboardType="default" maxLength={32} className="form-input" value={oldPassword} onChangeText={setOldPassword} />
              </View>
            </View>

            <View className="form-row">
              <View className="form-label-cell">
                <Text style={styles.label}>New Password</Text>
              </View>

            </View>
            <View className="form-row">
              <View className="form-input-cell">
                <TextInput testID="new-password" secureTextEntry={true} keyboardType="default" maxLength={32} className="form-input" value={newPassword} onChangeText={setNewPassword} />
              </View>
              <Text style={styles.text}>Fill only to change your password and click Save Changes</Text>
            </View>
            <View className="form-row">
              <View className="form-label-cell">
                <Text style={styles.label}>Confirm New Password</Text>
              </View>
            </View>
            <View className="form-row">
              <View className="form-input-cell">
                <TextInput testID="confirm-new-password" maxLength={32} secureTextEntry={true} keyboardType="default" className="form-input" value={newPasswordConfirm} onChangeText={setNewPasswordConfirm} />
              </View>
            </View>

            {!user?.emailConfirmed && (
              <>
                <View className="form-row">
                  <View className="form-label-cell">
                    <Text style={styles.label}>New Email Address</Text>
                  </View>
                </View>
                <View className="form-row">
                  <View className="form-input-cell">
                    <TextInput testID="new-email-address" maxLength={128} keyboardType="email-address" className="form-input" value={newUserName} onChangeText={setNewUserName} />
                  </View>
                  <Text style={styles.text}>Fill only to change your email address and click Save Changes.</Text>
                </View>
              </>
            )}
            <View className="buttons-container">
              <View className="form-button-cell">
                <TouchableOpacity testID="save" onPress={handleSubmit} className="form-button"><Save /><Text style={styles.text}> Save Changes</Text></TouchableOpacity>
              </View>
              {!user?.emailConfirmed && (
                <View className="form-button-cell">
                  <TouchableOpacity testID="send" className="form-button" onPress={confirmEmail}><Send /><Text style={styles.text}> Confirm Email Address</Text></TouchableOpacity>
                </View>
              )}
            </View>
          </form>
        )}
      </ScrollView>
    </View>
  )
}