import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { replaceCharsForLanguage } from '../utils/languageUtils';
import type { ExerciseInputHandle } from '../types/ui/ComponentHandles';
import type { User } from '../types/shared/User';

interface Props {
  charWidth?: number;
  checkAnswer?: () => void;
  value?: string;
  onChange?: (value: string, customKey?: string) => void;
  customKey?: string;
  ref?: React.Ref<ExerciseInputHandle | null>;
}

export const ExerciseInput = function(props: Props) {
  const { charWidth = 20, checkAnswer, value, onChange = () => {}, customKey, ref } = props;
  const [internalData, setInternalData] = useState<string>('');
  const [errorState, setErrorState] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useOutletContext() as { user?: User };

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

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalData(e.target.value);
    onChange?.(e.target.value, customKey);
    setErrorState(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkAnswer?.();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onChange?.(e.target.value, customKey);
  };

  const inputStyle: React.CSSProperties = {
    width: `${charWidth}ch`,
    backgroundColor: errorState ? 'rgb(228, 180, 180)' : 'white'
  };

  return (
    <input data-testid="input-element"
      ref={inputRef}
      type="text"
      value={internalData}
      onChange={onInputChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      className="input-text-placeholder"
      style={inputStyle}
    />
  );
};

export default ExerciseInput;
// ...existing code...
