import React, { useEffect, useRef, useState } from 'react';
import KeyboardModule from 'simple-keyboard';
import KeyboardLayoutsModule from 'simple-keyboard-layouts';
import 'simple-keyboard/build/css/index.css';
import { isTouchDevice, parseBoolean } from '../utils/utils';

// Minimal runtime typings for the keyboard packages used here.
type KeyboardInstance = {
    destroy?: () => void;
    setOptions?: (opts: Record<string, unknown>) => void;
    setInput?: (v: string) => void;
    getInput?: () => string;
    setCaretPosition?: (index: number | null) => void;
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

const VirtualKeyboard: React.FC<Props> = ({ languageCode = 'en', isRightToLeft = false, onChange = () => { }, value = '' }) => {
    const keyboardRef = useRef<KeyboardInstance | null>(null);
    const [showKeyboard, setShowKeyboard] = useState(false);
    const [layoutName, setLayoutName] = useState('default');

    const isSupported = isLanguageSupported(languageCode) && !isTouchDevice();

    const handleKeyPress = (button: string) => {
        if (button === '{shift}' || button === '{lock}') {
            setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
        }
    };

    const toggleKeyboard = () => {
        const tempValue = !showKeyboard;
        setShowKeyboard(!showKeyboard);
        localStorage.setItem(`keyboard-show-for-${languageCode}`, tempValue.toString());
    } 

    // Consolidate instantiation and updates into a single effect 
    useEffect(() => {
        if (!isSupported) return;

        const tempValue = localStorage.getItem(`keyboard-show-for-${languageCode}`);
        if (tempValue != null) {
            setShowKeyboard(parseBoolean(tempValue));
        }

        // 1. Initialize the keyboard instance if it doesn't exist
        if (!keyboardRef.current) {
            keyboardRef.current = new (Keyboard as KeyboardConstructor)('.simple-keyboard', {
                onKeyPress: (button: string) => handleKeyPress(button),
                useCaretPosition: true,
                syncInstanceInputs: true,
                // preventMouseDownDefault prevents the input from losing focus
                preventMouseDownDefault: true 
            });
            (window as any).keyboard = keyboardRef.current;
        }

        // 2. Safely apply current configurations (Layout, Arabic, RTL, and the stable onChange)
        const keyboardOptions: Record<string, unknown> = {
            onChange: (input: string) => onChange?.(input),
            layoutName: layoutName,
           // rtl: !!isRightToLeft,
            //preventMouseDownDefault: true,
            useCaretPosition: true
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

    }, [isSupported, onChange, languageCode, layoutName, isRightToLeft]);

    useEffect(() => {
        const current = keyboardRef.current;
        if (!current || !isSupported) return;

        if (value !== current.getInput?.()) {
            current.setInput?.(value);
        }
    }, [value, isSupported]);

    if (!isSupported) return null;

    return (
        <>
            <div
                className="keyboard-container"
                style={{
                    direction: isRightToLeft ? 'rtl' : 'ltr',
                    width: '100%',
                    maxWidth: '850px',
                    margin: '0',
                    justifyContent: 'flex-start',
                    textAlign: 'start',
                    display: showKeyboard ? 'block' : 'none'
                }}
            >
                <div data-testid="keyboard" className="simple-keyboard" />
            </div>
            <div className="form-label-center-row">
                <a className="form-link" href="#" onClick={(e) => { e.preventDefault(); toggleKeyboard(); }}>{showKeyboard ? 'Hide' : 'Show'} Keyboard</a>
            </div>
        </>
    );
};

export default VirtualKeyboard;
// ...existing code...
