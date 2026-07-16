import React, { useState, useEffect, useImperativeHandle, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { replaceCharsForLanguage } from '@ayalaslanguage/types/sharedfrontlib/utils';
import type { User } from '@ayalaslanguage/types/sharedfrontlib/user';

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

export const ExerciseInput = function (props: Props) {
  const { charWidth = 20, checkAnswer, value, onChange = () => { }, customKey, ref } = props;
  const [internalData, setInternalData] = useState<string>('');
  const [errorState, setErrorState] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useOutletContext() as { user?: User };

  const syncVirtualKeyboard = (val: string, pos: number | null) => {
    const kb = (window as any).keyboard;
    if (kb) {
      // 1. Update the internal string buffer
      kb.setInput(val);
      // 2. Update the cursor position within that buffer
      // simple-keyboard needs a small timeout or immediate call depending on version, 
      // but immediate is usually correct for 3.x
      kb.setCaretPosition(pos);
    }
  };

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
    const val = e.target.value;
    const pos = e.target.selectionStart; // Capture current cursor

    setInternalData(val);
    onChange?.(val, customKey);
    setErrorState(false);

    // Sync the internal state of the keyboard immediately
    syncVirtualKeyboard(val, pos);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    syncVirtualKeyboard(target.value, target.selectionStart);
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
    backgroundColor: errorState ? 'rgb(228, 180, 180)' : 'var(--bg)'
  };

  return (
    <input data-testid="input-element"
      ref={inputRef}
      type="text"
      value={internalData}
      onChange={onInputChange}
      onSelect={handleSelect}
      onKeyUp={handleSelect}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      className="input-text-placeholder"
      style={inputStyle}
    />
  );
};

export default ExerciseInput;
// ...existing code...
