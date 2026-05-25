import { useState, forwardRef, useImperativeHandle, useRef } from 'react';

import { useOutletContext } from 'react-router-dom';

import { replaceCharsForLanguage } from '../utils/languageUtils';

export const ExerciseInput = forwardRef(({charWidth, checkAnswer}, ref) => {
  const [internalData, setInternalData] = useState("");
  const [errorState, setErrorState] = useState(false);
  const inputRef = useRef(null);
  const { user } = useOutletContext();

  // This defines what the parent can access via the ref
  useImperativeHandle(ref, () => ({
    getUserAnswer() {
        return replaceCharsForLanguage(user.languageSettings.targetLanguage, internalData);
    },
    setToError() {
        setErrorState(true);
    },
    setFocus() {
      inputRef.current.focus();
    }
  }));

  const onInputChange = function(e) {
    setInternalData(e.target.value);
    setErrorState(false);
  }

  const handleKeyDown = function(e) {
    if (e.key === 'Enter' ) {
      e.preventDefault();
      checkAnswer();
    }
  }

  return <input ref={inputRef} type="text" value={internalData} 
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="input-text-placeholder" style={{
            width: `${charWidth}ch`, backgroundColor: errorState? "red": "white"
        }}></input>;
});