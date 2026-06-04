import React, { useEffect, useRef, useState } from 'react';
import KeyboardModule from 'simple-keyboard';
import KeyboardLayoutsModule from 'simple-keyboard-layouts';
import 'simple-keyboard/build/css/index.css';

// Minimal runtime typings for the keyboard packages used here.
type KeyboardInstance = {
  destroy?: () => void;
  setOptions?: (opts: Record<string, unknown>) => void;
  setInput?: (v: string) => void;
  getInput?: () => string;
};

type KeyboardConstructor = new (selector: string | HTMLElement, options?: Record<string, unknown>) => KeyboardInstance;

type KeyboardLayoutsConstructor = new () => { get: (name: string) => { layout?: string[] } | undefined };

const Keyboard = ((KeyboardModule as unknown) as { default?: KeyboardConstructor }).default || ((KeyboardModule as unknown) as KeyboardConstructor);
const KeyboardLayouts = ((KeyboardLayoutsModule as unknown) as { default?: KeyboardLayoutsConstructor }).default || ((KeyboardLayoutsModule as unknown) as KeyboardLayoutsConstructor);

const layoutCodeOverrides: Record<string, string> = {
  zh: 'chinese',
  ja: 'japanese',
  ko: 'korean',
  hi: 'hindi',
  bn: 'bengali',
  te: 'telugu',
  mr: 'marathi',
  ta: 'tamil',
  ur: 'urdu',
  fa: 'farsi',
  he: 'hebrew',
  ar: 'arabic'
};

const isLanguageSupported = (langCode?: string) => {
  if (!langCode || langCode === 'en') return true;
  try {
    const layouts = new (KeyboardLayouts as KeyboardLayoutsConstructor)();
    const targetLayoutCode = layoutCodeOverrides[langCode] || langCode;
    const layoutData = layouts.get(targetLayoutCode as string);
    return !!(layoutData && layoutData.layout);
  } catch {
    return false;
  }
};

type Props = {
  languageCode?: string;
  isRightToLeft?: boolean;
  onChange?: (val: string) => void;
  value?: string;
};

const VirtualKeyboard: React.FC<Props> = ({ languageCode = 'en', isRightToLeft = false, onChange = () => {}, value = '' }) => {
  const keyboardRef = useRef<KeyboardInstance | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [layoutName, setLayoutName] = useState('default');

  const isSupported = isLanguageSupported(languageCode);

  const handleKeyPress = (button: string) => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
    }
  };

  const toggleKeyboard = () => setShowKeyboard(!showKeyboard);

  useEffect(() => {
    if (!isSupported) return;
    keyboardRef.current = new (Keyboard as KeyboardConstructor)('.simple-keyboard', {
      onChange: (input: string) => onChange?.(input),
      onKeyPress: (button: string) => handleKeyPress(button),
      layoutName: 'default'
    });

    return () => {
      if (keyboardRef.current) {
        keyboardRef.current.destroy?.();
        keyboardRef.current = null;
      }
    };
  }, [isSupported, onChange]);

  useEffect(() => {
    if (!keyboardRef.current || !isSupported) return;
    const keyboardOptions: Record<string, unknown> = {
      layoutName,
      rtl: !!isRightToLeft
    };

    if (languageCode !== 'en') {
      const layouts = new (KeyboardLayouts as KeyboardLayoutsConstructor)();
      const targetLayoutCode = layoutCodeOverrides[languageCode || ''] || languageCode;
      const layoutData = layouts.get(targetLayoutCode as string);
      if (layoutData && layoutData.layout) {
        keyboardOptions.layout = layoutData.layout;
      }
    } else {
      keyboardOptions.layout = undefined;
    }

    keyboardRef.current.setOptions?.(keyboardOptions);
  }, [languageCode, layoutName, isRightToLeft, isSupported]);

  useEffect(() => {
    const current = keyboardRef.current;
    if (!current || !isSupported) return;
    const getInput = current.getInput;
    const setInput = current.setInput;
    if (typeof getInput === 'function' && typeof setInput === 'function') {
      if (value !== getInput.call(current)) {
        setInput.call(current, value);
      }
    }
  }, [value, isSupported]);

  if (!isSupported) return null;

  return (
    <>
      <div
        className="keyboard-container"
        style={{
          direction: isRightToLeft ? 'rtl' : 'ltr',
          width: '85%',
          maxWidth: '850px',
          margin: '0',
          justifyContent: 'flex-start',
          textAlign: 'start',
          display: showKeyboard ? 'block' : 'none'
        }}
      >
        <div className="simple-keyboard" />
      </div>
      <div className="form-label-center-row">
        <a className="form-link" href="#" onClick={(e) => { e.preventDefault(); toggleKeyboard(); }}>{showKeyboard ? 'Hide' : 'Show'} Keyboard</a>
      </div>
    </>
  );
};

export default VirtualKeyboard;
// ...existing code...
