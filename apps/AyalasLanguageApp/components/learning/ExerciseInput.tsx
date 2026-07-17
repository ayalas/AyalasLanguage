import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { replaceCharsForLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import { useAuth } from '@/lib/AuthContext';
import { TextInput, TextInputKeyPressEvent, useColorScheme } from 'react-native';
import { BG_DARK, BG_LIGHT, BORDER_ACCENT, BORDER_ACCENT_DARK } from '@/constants';

export interface ExerciseInputHandle {
  getUserAnswer: () => string;
  setToError: () => void;
  setFocus: () => void;
  setValue: (val: string) => void;
}

interface Props {
  charWidth?: number;
  checkAnswer?: () => void;
  value?: string;
  onChange?: (value: string, customKey?: string) => void;
  customKey?: string;
  ref?: React.Ref<ExerciseInputHandle | null>;
}

export default function ExerciseInput ({ charWidth = 20, checkAnswer, value, onChange = () => { }, customKey, ref }: Props) {
  const [internalData, setInternalData] = useState<string>('');
  const [errorState, setErrorState] = useState<boolean>(false);
  const inputRef = useRef<TextInput | null>(null);
  const { user } = useAuth();
  const colorScheme = useColorScheme();

  useImperativeHandle(ref, () => ({
    getUserAnswer() {
      const lang = user?.languageSettings?.targetLanguage;
      return replaceCharsForLanguage(lang, internalData) || '';
    },
    setToError() {
      setErrorState(true);
    },
    setFocus() {
      inputRef.current?.focus();
    },
    setValue(val: string) {
      setInternalData(val);
      setErrorState(false);
    }
  }));

  useEffect(() => {
    if (value != null) {
      setInternalData(value);
      setErrorState(false);
    }
  }, [value]);

  const onInputChange = (val: string) => {
    setInternalData(val);
    onChange?.(val, customKey);
    setErrorState(false);
  };

  const handleKeyDown = (e: TextInputKeyPressEvent) => {
    const { key } = e.nativeEvent;
    if (key === 'Enter') {
      e.preventDefault();
      checkAnswer?.();
    }
  };

  let bgColor = BG_LIGHT;
  let borderColor = BORDER_ACCENT;
  
  if (colorScheme === 'dark') {
    bgColor = BG_DARK;
    borderColor = BORDER_ACCENT_DARK;
  }
    

  return (
    <TextInput data-testid="input-element"
      ref={inputRef}
      keyboardType="default"
      value={internalData}
      onChangeText={onInputChange}
      onKeyPress={handleKeyDown}
      className="input-text-placeholder"
      style={{
        width: charWidth * 10,
        backgroundColor: errorState ? 'rgb(228, 180, 180)' : bgColor,
        borderColor: borderColor,
        borderWidth: 1,
        borderStyle: 'solid'
      }}
    />
  );
};