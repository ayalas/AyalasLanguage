import React, { useEffect, useRef, useState } from "react";
import KeyboardModule from "simple-keyboard";
import KeyboardLayoutsModule from "simple-keyboard-layouts";
import "simple-keyboard/build/css/index.css";

const Keyboard = KeyboardModule.default || KeyboardModule;
const KeyboardLayouts = KeyboardLayoutsModule.default || KeyboardLayoutsModule;

const layoutCodeOverrides = {
  zh: "chinese", 
  ja: "japanese",
  ko: "korean",
  hi: "hindi",
  bn: "bengali",
  te: "telugu",
  mr: "marathi",
  ta: "tamil",
  ur: "urdu",
  fa: "farsi",
  he: "hebrew",
  ar: "arabic",
};

// Helper function to check if the language layout actually exists
const isLanguageSupported = (langCode) => {
  if (langCode === "en") return true;
  
  const layouts = new KeyboardLayouts();
  const targetLayoutCode = layoutCodeOverrides[langCode] || langCode;
  const layoutData = layouts.get(targetLayoutCode);
  
  return !!(layoutData && layoutData.layout);
};

const VirtualKeyboard = ({ languageCode, isRightToLeft, onChange, value }) => {
  const keyboardRef = useRef(null);
  const [layoutName, setLayoutName] = useState("default");

  // Determine support status immediately during rendering
  const isSupported = isLanguageSupported(languageCode);

  const handleKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
    }
  };

  // 1. Initialize the keyboard instance ONLY if supported and ONCE on mount
  useEffect(() => {
    if (!isSupported) return;

    keyboardRef.current = new Keyboard(".simple-keyboard", {
      onChange: (input) => onChange(input),
      onKeyPress: (button) => handleKeyPress(button),
      layoutName: "default",
    });

    return () => {
      if (keyboardRef.current) {
        keyboardRef.current.destroy();
        keyboardRef.current = null;
      }
    };
  }, [isSupported]); // Re-run initialization if support status changes

  // 2. Dynamically update keyboard configurations
  useEffect(() => {
    if (!keyboardRef.current || !isSupported) return;

    let keyboardOptions = {
      layoutName: layoutName,
      rtl: !!isRightToLeft,
    };

    if (languageCode !== "en") {
      const layouts = new KeyboardLayouts();
      const targetLayoutCode = layoutCodeOverrides[languageCode] || languageCode;
      const layoutData = layouts.get(targetLayoutCode);

      if (layoutData && layoutData.layout) {
        keyboardOptions.layout = layoutData.layout;
      }
    } else {
      keyboardOptions.layout = undefined; 
    }

    keyboardRef.current.setOptions(keyboardOptions);
  }, [languageCode, layoutName, isRightToLeft, isSupported]);

  // 3. Keep controlled component state perfectly synced
  useEffect(() => {
    if (keyboardRef.current && isSupported && value !== keyboardRef.current.getInput()) {
      keyboardRef.current.setInput(value);
    }
  }, [value, isSupported]);

  // Early return: If the language is not supported, hide the entire keyboard element
  if (!isSupported) {
    return null;
  }

  return (
    <div 
      className="keyboard-container" 
      style={{ 
        direction: isRightToLeft ? "rtl" : "ltr", 
        width: "100%", 
        maxWidth: "850px",
        margin: "0 auto" 
      }}
    >
      <div className="simple-keyboard" />
    </div>
  );
};

export default VirtualKeyboard;