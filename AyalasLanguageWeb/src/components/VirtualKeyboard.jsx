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
};

const VirtualKeyboard = ({ languageCode, isRightToLeft, onChange, value }) => {
  const keyboardRef = useRef(null);
  const [layoutName, setLayoutName] = useState("default");

  const handleKeyPress = (button) => {
    if (button === "{shift}" || button === "{lock}") {
      setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
    }
  };

  // 1. Initialize the keyboard instance ONLY ONCE on mount
  useEffect(() => {
    keyboardRef.current = new Keyboard(".simple-keyboard", {
      onChange: (input) => onChange(input),
      onKeyPress: (button) => handleKeyPress(button),
      layoutName: "default",
    });

    return () => {
      if (keyboardRef.current) {
        keyboardRef.current.destroy();
      }
    };
  }, []); // Empty dependency array prevents instance recreation

  // 2. Dynamically update keyboard configurations without destroying the instance
  useEffect(() => {
    if (!keyboardRef.current) return;

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
      // Reset back to default English layout if languageCode is 'en'
      keyboardOptions.layout = undefined; 
    }

    // Use setOptions to smoothly apply layout updates and preserve input history
    keyboardRef.current.setOptions(keyboardOptions);
  }, [languageCode, layoutName, isRightToLeft]);

  // 3. Keep controlled component state perfectly synced
  useEffect(() => {
    if (keyboardRef.current && value !== keyboardRef.current.getInput()) {
      keyboardRef.current.setInput(value);
    }
  }, [value]);

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
