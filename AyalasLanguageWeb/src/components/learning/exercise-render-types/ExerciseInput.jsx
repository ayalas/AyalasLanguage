import { useState, forwardRef, useImperativeHandle, useRef } from 'react';

import { useOutletContext } from 'react-router-dom';

import { replaceCharsForLanguage } from '../../../utils/languageUtils';

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

  const inputStyle = {
      width: `${charWidth}ch`,
      backgroundColor: errorState ? "rgb(228, 180, 180)" : "white" // No semicolons inside the strings!
  };

  return <input ref={inputRef} type="text" value={internalData} 
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            className="input-text-placeholder" style={inputStyle}></input>;
});