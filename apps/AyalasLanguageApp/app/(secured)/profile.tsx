import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { Save } from 'lucide-react-native';
import SecuredHeader from '@/components/SecuredHeader';
import { reloadLanguageSettings } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { LanguageLineForDelete } from '@/components/profile/LanguageLineForDelete';
import type { Language } from '@ayalaslanguage/types/sharedfrontlib/user';
import { errorHandler } from '@ayalaslanguage/types/error';
import { DEFAULT_NUM_OF_EXERCISES } from '@ayalaslanguage/types/sharedfrontlib/learning'
import { FormHeader } from '@/components/FormHeader';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/AuthContext';
import { Slider } from '@miblanchard/react-native-slider';
import { Picker } from '@react-native-picker/picker';
import api from '@/lib/api'; //secured axios instance
import { Checkbox } from 'expo-checkbox';

export default function ProfileScreen() {
  const [allLanguages, setAllLanguages] = useState<Language[]>([]);
  const [targetLanguage, setTargetLanguage] = useState<string | number>('');
  const [knownLanguage, setKnownLanguage] = useState<string | number>('');
  const [numOfExercises, setNumOfExercises] = useState<number>(DEFAULT_NUM_OF_EXERCISES);
  const [error, setError] = useState('');
  const [disablePuter, setDisablePuter] = useState(false);
  const router = useRouter();
  const { user, login } = useAuth();

  useEffect(() => {
    async function loadData() {
      const response = await api.get('/api/static/languages');
      const allLanguagesData = response.data as Language[];
      setAllLanguages(allLanguagesData || []);

      //load data from user context
      if (user != null) {
        if (user.disablePuter) {
          setDisablePuter(true);
        }

        if (user.languageSettings) {
          if (user.languageSettings.targetLanguageId && user.languageSettings.targetLanguageId > 0) {
            setTargetLanguage(user.languageSettings.targetLanguageId as number);
          }
          if (user.languageSettings.knownLanguageId && user.languageSettings.knownLanguageId > 0) {
            setKnownLanguage(user.languageSettings.knownLanguageId as number);
          } else {
            const english = allLanguagesData.find((lang) => lang.code === 'en');
            setKnownLanguage(english?.languageId || '');
          }
        }

        setNumOfExercises(user.numOfExercisesToGenerate ?? DEFAULT_NUM_OF_EXERCISES)
      }
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.languageSettings]);

  const validateForm = function (onlyClear?: boolean) {
    if (knownLanguage === '' || targetLanguage === '') {
      if (!onlyClear) {
        setError('Please select language to learn and language you know.');
      }
      return false;
    }
    setError('');
    return true;
  };

  const changeTargetLanguage = function (text: string | number) {
    setTargetLanguage(text);
    validateForm(true);
  };
  const changeKnownLanguage = function (text: string | number) {
    setKnownLanguage(text);
    validateForm(true);
  };

  async function submitAction() {
    try {
      if (!validateForm(false)) {
        return;
      }
      if (!user) throw new Error('User must be logged in to change language');

      const res = await api.post('/api/profile/', {
        disablePuter,
        numOfExercisesToGenerate: numOfExercises,
        TargetLanguageId: Number(targetLanguage),
        KnownLanguageId: Number(knownLanguage)
      });

      login(res.data);

      router.replace('/');

    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }

  return (
    allLanguages && allLanguages.length > 0 && (
      <View className="root">
        <SecuredHeader />
        <ScrollView className='form-container' showsVerticalScrollIndicator={false}>
          <FormHeader title="Profile" />
          {error !== '' && (
            <View className="form-row">
              <Text className="form-error">{error}</Text>
            </View>
          )}
          <View className="form-row">
            <View className="form-label-cell">
              <Text className="form-label">Language to Learn</Text>
            </View>
            <View className="form-input-cell">
              <Picker className="form-select" data-testid="target-language"
                selectedValue={targetLanguage}
                onValueChange={(itemValue) => changeTargetLanguage(itemValue)}
                mode="dropdown" // Android only: 'dropdown' or 'dialog'
              >
                <Picker.Item label="-- Please choose an option --" value="" enabled={false} />
                {allLanguages.map((language) => (
                  <Picker.Item key={language.languageId}
                    value={language.languageId}
                    label={language.englishName !== language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                  />
                ))}
              </Picker>
            </View>
          </View>
          <View className="form-row">
            <View className="form-label-cell">
              <Text className="form-label">Language I Know</Text>
            </View>
            <View className="form-input-cell">
              <Picker className="form-select" data-testid="known-language"
                selectedValue={knownLanguage}
                onValueChange={(itemValue) => changeKnownLanguage(itemValue)}
                mode="dropdown" // Android only: 'dropdown' or 'dialog'
              >
                <Picker.Item label="-- Please choose an option --" value="" enabled={false} />
                {allLanguages.map((language) => (
                  <Picker.Item key={language.languageId}
                    value={language.languageId}
                    label={language.englishName !== language.nativeName ? `${language.englishName} ${language.nativeName}` : language.englishName}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View className="form-row">
            <View className="form-label-cell">
              <Text className="form-label">Disable Puter use in AI and Sounds</Text>
            </View>
            <View className="form-input-cell">
              <Checkbox value={disablePuter} data-testid="disablePuter" onValueChange={setDisablePuter} />
            </View>
          </View>

          <View className="form-row">
            <View className="form-label-cell">
              <Text className="form-label-wrap">No. of Exercises for AI Generation: {numOfExercises}</Text>
            </View>
            <Slider
                minimumValue={0}
                maximumValue={50}
                step={1}
                // Note: this library expects value to be an array or a number
                value={numOfExercises} 
                // Note: onValueChange returns an array [number]
                onValueChange={(value: number[]) => setNumOfExercises(Array.isArray(value) ? value[0] : value)}
                minimumTrackTintColor="#1EB1FC"
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor="#1EB1FC"
              />
          </View>
          <View className="buttons-container">
            <View className="form-input-row">
              <TouchableOpacity data-testid="save" className="form-button" onPress={submitAction}>
                <Save /><Text className="text">{" "}Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {user?.languageSettings?.otherUserLanguages && user.languageSettings.otherUserLanguages.length > 0 && (
            <View className="form-row">
              <View className="form-content-row">
                <Text className='h2'>Other languages</Text>
              </View>
              {user.languageSettings.otherUserLanguages.map((lang) => (
                <LanguageLineForDelete key={lang.languageId} languageInfo={lang} user={user} login={login} reloadLanguageSettings={reloadLanguageSettings} />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    )
  );
}
