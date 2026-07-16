import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';
import { Trash2 } from 'lucide-react-native';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';
import { errorHandler } from '@ayalaslanguage/types/error';
import api from '@/lib/api'; //secured axios instance

export function LanguageLineForDelete({ languageInfo, user, login, reloadLanguageSettings }:
  { languageInfo: any; user: User | null; login: (u: User) => void; reloadLanguageSettings: (a: any, u: any, l: any) => void }) {
  const [error, setError] = useState('');
  const [exists, setExists] = useState(true);

  async function onButtonClick() {
    try {
      await api.delete(`/api/profile/${languageInfo.languageId}`);
      setExists(false); //disappear from screen
      reloadLanguageSettings(api, user, login);
    } catch (err: unknown) {
      errorHandler(err, setError);
    }
  }
  return (
    <>
      {exists && (
        <View className="language-line">
            <TouchableOpacity data-testid="delete-item"
                className="button-delete-item" 
                onPress={onButtonClick}>
              <Trash2 className="small-icon" />
            </TouchableOpacity>
            <Text className="profile-language-names">{languageInfo.nativeName} ({languageInfo.englishName})</Text>
        </View>
      )}
      {error !== '' && (
        <View className="form-row">
          <Text className="form-error">{error}</Text>
        </View>
      )}
    </>
  );
}
